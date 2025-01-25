import os
import csv
import time
import random
import threading
from datetime import datetime
import functools

from flask import (
    Flask, request, session, jsonify, send_from_directory, redirect, url_for, flash
)
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_socketio import SocketIO, emit
from flask_wtf.csrf import CSRFProtect
from flask_cors import CORS
from wtforms import (
    StringField, PasswordField, IntegerField, FloatField, SelectField, SubmitField
)
from wtforms.validators import DataRequired, Length, NumberRange
from flask_wtf import FlaskForm

# Optional: For environment variables in .env
from dotenv import load_dotenv
load_dotenv()

##############################################################################
# Retrieve secrets from environment
##############################################################################
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin")
SECRET_KEY = os.environ.get("SECRET_KEY", "MY_SUPER_SECRET_KEY")
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///multi_broker.db")

API_KEY = os.getenv("API_KEY", "SOME_DEFAULT_KEY")  # If you want broker credentials
CLIENT_CODE = os.getenv("CLIENT_CODE", "")
CLIENT_PASSWORD = os.getenv("CLIENT_PASSWORD", "")
TOTP_SECRET = os.getenv("TOTP_SECRET", "")

##############################################################################
# Flask + Config
##############################################################################
app = Flask(__name__)
app.config["SECRET_KEY"] = SECRET_KEY
app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
import logging

logging.basicConfig(level=logging.DEBUG)
app.logger.setLevel(logging.DEBUG)

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
csrf = CSRFProtect(app)

# Enable CORS for React <-> Flask requests
CORS(app)

# SocketIO for real-time
socketio = SocketIO(app, cors_allowed_origins="*")

# Hash the admin password at startup
ADMIN_HASH = bcrypt.generate_password_hash(ADMIN_PASSWORD).decode("utf-8")

##############################################################################
# Database Models
##############################################################################
class TradingUser(db.Model):
    """
    A "TradingUser" does NOT log in themselves. Only the Admin manages them.
    They each have:
      - broker ('angel' or 'shonnay')
      - api_key
      - optional totp_token
      - default_quantity for trades
    """
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    broker = db.Column(db.String(20), nullable=False)     # 'angel', 'shonnay', etc.
    api_key = db.Column(db.String(128), nullable=False)
    totp_token = db.Column(db.String(64), nullable=True)
    default_quantity = db.Column(db.Integer, default=1)

    trades = db.relationship("Trade", backref="trading_user", lazy=True)


class Trade(db.Model):
    """
    A single trade (BUY/SELL).
    """
    id = db.Column(db.Integer, primary_key=True)
    symbol = db.Column(db.String(20), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    transaction_type = db.Column(db.String(10), nullable=False)  # BUY or SELL
    price = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    broker_order_id = db.Column(db.String(50), nullable=False)

    user_id = db.Column(db.Integer, db.ForeignKey("trading_user.id"), nullable=False)


with app.app_context():
    db.create_all()

##############################################################################
# Helper: Simulated "Live Price" function
##############################################################################
def angel_fetch_live_price(symbol: str) -> float:
    """
    Return a random float around 1000 +/- 10 for demonstration.
    In real usage, you'd call an actual broker API.
    """
    return 1000 + random.uniform(-10, 10)

##############################################################################
# Admin-Required Decorator
##############################################################################
def admin_required(f):
    @functools.wraps(f)
    def wrap(*args, **kwargs):
        if not session.get("is_admin"):
            return jsonify({"success": False, "message": "Not logged in as admin"}), 401
        return f(*args, **kwargs)
    return wrap

##############################################################################
# Flask-WTF Forms (if you still serve some pages with Jinja)
##############################################################################
class AdminLoginForm(FlaskForm):
    username = StringField("Admin Username", validators=[DataRequired()])
    password = PasswordField("Admin Password", validators=[DataRequired()])
    submit = SubmitField("Admin Login")

class RegisterTradingUserForm(FlaskForm):
    username = StringField("Username", validators=[DataRequired(), Length(min=2, max=64)])
    broker = SelectField("Broker", choices=[("angel", "Angel"), ("shonnay", "Shonnay")])
    api_key = StringField("API Key", validators=[DataRequired(), Length(min=5, max=128)])
    totp_token = StringField("TOTP (optional)", validators=[Length(max=64)])
    default_quantity = IntegerField("Default Quantity", validators=[DataRequired(), NumberRange(min=1)])
    submit = SubmitField("Register User")

##############################################################################
# Serve an Image if needed
##############################################################################
@app.route("/ramdoot.jpg")
def serve_logo():
    return send_from_directory(".", "ramdoot.jpg")

##############################################################################
# Admin Login (JSON)
##############################################################################
@app.route("/admin_login", methods=["POST"])
def admin_login():
    """
    Expects JSON: { "username": "...", "password": "..." }
    """
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No JSON data provided"}), 400

    username = data.get("username")
    password = data.get("password")

    # Check against .env credentials
    if username == ADMIN_USERNAME and bcrypt.check_password_hash(ADMIN_HASH, password):
        session["is_admin"] = True
        return jsonify({"success": True, "message": "Login successful"}), 200
    else:
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

##############################################################################
# Admin Logout (JSON)
##############################################################################
@app.route("/admin_logout", methods=["POST"])
@admin_required
def admin_logout():
    session.pop("is_admin", None)
    return jsonify({"success": True, "message": "Admin logged out"}), 200

##############################################################################
# Dashboard Stats (JSON)
##############################################################################
@app.route("/api/dashboard", methods=["GET"])
@admin_required
def api_dashboard():
    total_users = TradingUser.query.count()
    total_trades = Trade.query.count()
    return jsonify({"total_users": total_users, "total_trades": total_trades})

##############################################################################
# List Users (JSON)
##############################################################################
@app.route("/api/users", methods=["GET"])
@admin_required
def api_users():
    users = TradingUser.query.order_by(TradingUser.username.asc()).all()
    data = []
    for u in users:
        data.append({
            "id": u.id,
            "username": u.username,
            "broker": u.broker,
        })
    return jsonify(data)

##############################################################################
# Register a Single User (JSON)
##############################################################################
@app.route("/api/register_user", methods=["POST"])
@admin_required
def api_register_user():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No JSON body"}), 400

    username = data.get("username")
    broker = data.get("broker")
    api_key = data.get("api_key")
    totp_token = data.get("totp_token", None)
    default_qty = data.get("default_quantity", 1)

    if TradingUser.query.filter_by(username=username).first():
        return jsonify({"success": False, "message": "Username already exists"}), 400

    new_user = TradingUser(
        username=username,
        broker=broker,
        api_key=api_key,
        totp_token=totp_token if broker == "angel" else None,
        default_quantity=default_qty
    )
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"success": True, "message": f"Registered user '{username}'"}), 201

##############################################################################
# Bulk Register (CSV)
##############################################################################
@app.route("/api/bulk_register", methods=["POST"])
@admin_required
def api_bulk_register():
    file = request.files.get("file")
    if not file or not file.filename.endswith(".csv"):
        return jsonify({"success": False, "message": "Please upload a valid .csv"}), 400

    try:
        reader = csv.reader(file.stream.read().decode("utf-8").splitlines())
        count = 0
        for row in reader:
            if len(row) < 5:
                continue
            username, broker, api_key, totp_token, def_qty = row
            if TradingUser.query.filter_by(username=username).first():
                continue
            user = TradingUser(
                username=username,
                broker=broker,
                api_key=api_key,
                totp_token=totp_token,
                default_quantity=int(def_qty or 1)
            )
            db.session.add(user)
            count += 1
        db.session.commit()
        return jsonify({"success": True, "message": f"Bulk registered {count} users"}), 200
    except Exception as e:
        return jsonify({"success": False, "message": f"Error in bulk register: {e}"}), 500

##############################################################################
# Trades (JSON)
##############################################################################
@app.route("/api/trades", methods=["GET"])
@admin_required
def api_trades():
    trades = Trade.query.order_by(Trade.timestamp.desc()).all()
    data = []
    for t in trades:
        data.append({
            "id": t.id,
            "username": t.trading_user.username,
            "broker": t.trading_user.broker,
            "symbol": t.symbol,
            "quantity": t.quantity,
            "transaction_type": t.transaction_type,
            "price": t.price,
            "timestamp": t.timestamp.isoformat(),
            "broker_order_id": t.broker_order_id
        })
    return jsonify(data)

##############################################################################
# SocketIO: Real-time feed
##############################################################################
@socketio.on("request_trades")
def handle_request_trades():
    all_trades = Trade.query.order_by(Trade.id.asc()).all()
    data = []
    for t in all_trades:
        data.append({
            "symbol": t.symbol,
            "price": t.price,
            "broker_order_id": t.broker_order_id,
            "username": t.trading_user.username,
            "broker": t.trading_user.broker
        })
    emit("initial_trades", data)

##############################################################################
# Manual Trade (JSON)
##############################################################################
@app.route("/api/manual_trade", methods=["POST"])
@admin_required
def api_manual_trade():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No JSON data"}), 400

    user_id = data.get("user_id")
    user = TradingUser.query.get(user_id)
    if not user:
        return jsonify({"success": False, "message": "Invalid user_id"}), 400

    symbol = data.get("symbol")
    transaction_type = data.get("transaction_type")
    price = float(data.get("price", 0))
    exchange = data.get("exchange", "NSE")

    if not symbol or not transaction_type or price <= 0:
        return jsonify({"success": False, "message": "Missing or invalid details"}), 400

    quantity = user.default_quantity
    broker_order_id = f"{user.broker.upper()}-{int(time.time())}"

    new_trade = Trade(
        symbol=symbol,
        quantity=quantity,
        transaction_type=transaction_type,
        price=price,
        broker_order_id=broker_order_id,
        user_id=user.id
    )
    db.session.add(new_trade)
    db.session.commit()

    # Emit to all clients => real-time chart
    socketio.emit("new_trade", {
        "symbol": new_trade.symbol,
        "price": new_trade.price,
        "broker_order_id": new_trade.broker_order_id,
        "username": user.username,
        "broker": user.broker
    }, broadcast=True)

    return jsonify({"success": True, "message": f"Trade placed. ID={new_trade.id}"}), 200

##############################################################################
# Auto Trade & Stop-Loss (JSON)
##############################################################################
@app.route("/api/auto_trade", methods=["POST"])
@admin_required
def api_auto_trade():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No JSON"}), 400

    user_id = data.get("user_id")
    user = TradingUser.query.get(user_id)
    if not user:
        return jsonify({"success": False, "message": "Invalid user_id"}), 400

    symbol = data.get("symbol")
    condition = data.get("condition")
    basis = data.get("basis")
    threshold_value = float(data.get("threshold_value", 0))
    reference_price = float(data.get("reference_price", 0))
    stop_loss_type = data.get("stop_loss_type")
    stop_loss_value = data.get("stop_loss_value")

    if not (symbol and condition and basis and stop_loss_type and stop_loss_value is not None):
        return jsonify({"success": False, "message": "Missing required fields"}), 400

    quantity = user.default_quantity

    def monitor_auto_trade():
        while True:
            live_price = angel_fetch_live_price(symbol)
            if live_price is None:
                time.sleep(5)
                continue

            triggered = False
            # Example conditions:
            if condition == "Condition 1" and basis == "fixed" and live_price >= threshold_value:
                triggered = True
            elif condition == "Condition 2" and basis == "fixed" and live_price > threshold_value:
                triggered = True

            if triggered:
                # "Place" a buy
                broker_order_id = f"{user.broker.upper()}-{int(time.time())}"
                new_trade = Trade(
                    symbol=symbol,
                    quantity=quantity,
                    transaction_type="BUY",
                    price=live_price,
                    broker_order_id=broker_order_id,
                    user_id=user.id
                )
                db.session.add(new_trade)
                db.session.commit()

                socketio.emit("new_trade", {
                    "symbol": new_trade.symbol,
                    "price": new_trade.price,
                    "broker_order_id": new_trade.broker_order_id,
                    "username": user.username,
                    "broker": user.broker
                }, broadcast=True)

                # Start stop-loss monitor
                monitor_stop_loss(symbol, live_price, stop_loss_type, stop_loss_value, quantity, user)
                break

            time.sleep(5)

    def monitor_stop_loss(symbol, entry_price, sl_type, sl_value, qty, user_obj):
        while True:
            live_price = angel_fetch_live_price(symbol)
            if live_price is None:
                time.sleep(5)
                continue

            if sl_type == "percentage":
                stop_line = entry_price * (1 - sl_value / 100)
            elif sl_type == "points":
                stop_line = entry_price - sl_value
            elif sl_type == "fixed":
                stop_line = sl_value
            else:
                stop_line = entry_price - 10

            if live_price <= stop_line:
                # "Place" a sell
                broker_order_id = f"{user_obj.broker.upper()}-{int(time.time())}"
                sl_trade = Trade(
                    symbol=symbol,
                    quantity=qty,
                    transaction_type="SELL",
                    price=live_price,
                    broker_order_id=broker_order_id,
                    user_id=user_obj.id
                )
                db.session.add(sl_trade)
                db.session.commit()

                socketio.emit("new_trade", {
                    "symbol": sl_trade.symbol,
                    "price": sl_trade.price,
                    "broker_order_id": sl_trade.broker_order_id,
                    "username": user_obj.username,
                    "broker": user_obj.broker
                }, broadcast=True)
                break

            time.sleep(5)

    threading.Thread(target=monitor_auto_trade, daemon=True).start()
    return jsonify({"success": True, "message": "Auto trade started with stop-loss"}), 200

##############################################################################
# Default Route
##############################################################################
@app.route("/")
def home():
    return "Flask backend is running. Use the React frontend at http://localhost:3000"

##############################################################################
# MAIN
##############################################################################
if __name__ == "__main__":
    socketio.run(app, debug=True, host="0.0.0.0", port=5050)


import React from 'react';
import { Link } from 'react-router-dom';

function Navbar({ isAdmin, onLogout }) {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-3">
      <Link className="navbar-brand d-flex align-items-center" to="/">
        <img
          src="/ramdoot.jpg"
          alt="Logo"
          style={{ height: '40px', marginRight: '10px' }}
        />
        <span>MultiTradingBroker</span>
      </Link>
      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
      >
        <span className="navbar-toggler-icon" />
      </button>

      <div className="collapse navbar-collapse" id="navbarNav">
        <ul className="navbar-nav ms-auto">
          {isAdmin ? (
            <>
              <li className="nav-item">
                <Link className="nav-link" to="/admin_dashboard">
                  <i className="fas fa-tachometer-alt"></i> Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/place_order">
                  <i className="fas fa-shopping-cart"></i> Place Order
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/trades">
                  <i className="fas fa-list"></i> Trades
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/chart">
                  <i className="fas fa-chart-line"></i> Live Chart
                </Link>
              </li>
              <li className="nav-item">
                <button className="btn nav-link" onClick={onLogout}>
                  <i className="fas fa-sign-out-alt"></i> Logout
                </button>
              </li>
            </>
          ) : (
            <li className="nav-item">
              <Link className="nav-link" to="/admin_login">
                <i className="fas fa-user-shield"></i> Admin Login
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;

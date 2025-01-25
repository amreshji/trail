import React, { useEffect, useState } from 'react';
import api from '../services/api';

function PlaceOrder() {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState('');
  const [symbol, setSymbol] = useState('');
  const [transactionType, setTransactionType] = useState('BUY');
  const [price, setPrice] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/api/users');
        setUsers(res.data);
        if (res.data.length > 0) {
          setUserId(res.data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        user_id: parseInt(userId, 10),
        symbol,
        transaction_type: transactionType,
        price: parseFloat(price),
        exchange: 'NSE', // default
      };
      const res = await api.post('/api/manual_trade', payload);
      alert(res.data.message || 'Trade placed successfully!');
    } catch (err) {
      console.error(err);
      alert('Error placing trade');
    }
  };

  return (
    <div>
      <h2 className="text-center text-primary mb-4">
        <i className="fas fa-shopping-cart"></i> Place Order
      </h2>
      <div className="card p-4 shadow-sm mb-3">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Select User</label>
            <select
              className="form-select"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username} ({u.broker})
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">Symbol</label>
            <input
              className="form-control"
              placeholder="e.g. INFY"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Transaction Type</label>
            <select
              className="form-select"
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
            >
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">Price</label>
            <input
              className="form-control"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Place Order
          </button>
        </form>
      </div>
    </div>
  );
}

export default PlaceOrder;

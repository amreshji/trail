import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../services/api';

function AdminLogin({ onLogin, isAdmin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (isAdmin) {
    return <Navigate to="/admin_dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin_login', { username, password });
      if (res.data.success) {
        onLogin();
      } else {
        alert(res.data.message || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error logging in');
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <h2 className="text-center text-primary mb-4">
          <i className="fas fa-user-shield"></i> Admin Login
        </h2>
        <div className="card p-4 shadow-sm">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Admin Username</label>
              <input
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Admin Password</label>
              <input
                className="form-control"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;

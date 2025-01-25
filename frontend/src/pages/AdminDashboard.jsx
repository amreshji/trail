import React, { useEffect, useState } from 'react';
import api from '../services/api';

function AdminDashboard() {
  const [stats, setStats] = useState({ total_users: 0, total_trades: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/api/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="text-center">
      <h2 className="text-primary mb-4">
        <i className="fas fa-tachometer-alt"></i> Admin Dashboard
      </h2>
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card p-4 shadow-sm">
            <h4>Total Users: {stats.total_users}</h4>
            <h4>Total Trades: {stats.total_trades}</h4>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

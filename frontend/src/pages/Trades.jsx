import React, { useEffect, useState } from 'react';
import api from '../services/api';

function Trades() {
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const res = await api.get('/api/trades');
        setTrades(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTrades();
  }, []);

  return (
    <div>
      <h2 className="text-center text-primary mb-4">
        <i className="fas fa-list"></i> All Trades
      </h2>
      <div className="table-responsive">
        <table className="table table-striped align-middle">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Broker</th>
              <th>Symbol</th>
              <th>Quantity</th>
              <th>Type</th>
              <th>Price</th>
              <th>Timestamp</th>
              <th>OrderID</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.username}</td>
                <td>{t.broker}</td>
                <td>{t.symbol}</td>
                <td>{t.quantity}</td>
                <td>{t.transaction_type}</td>
                <td>{t.price}</td>
                <td>{t.timestamp}</td>
                <td>{t.broker_order_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Trades;

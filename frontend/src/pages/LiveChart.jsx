import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { BASE_URL } from '../services/api';

function LiveChart() {
  const [tradesData, setTradesData] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to Socket.IO on the Flask server
    socketRef.current = io(BASE_URL);

    // Request initial trades
    socketRef.current.emit('request_trades');

    // Listen for initial trades
    socketRef.current.on('initial_trades', (data) => {
      setTradesData(data);
    });

    // Listen for new trades
    socketRef.current.on('new_trade', (trade) => {
      setTradesData((prev) => [...prev, trade]);
    });

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Prepare data for Chart.js
  const labels = tradesData.map((_, index) => index + 1);
  const prices = tradesData.map((t) => t.price);

  const data = {
    labels,
    datasets: [
      {
        label: 'Trade Price',
        data: prices,
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        pointRadius: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      x: { title: { display: true, text: 'Trade Index' } },
      y: { title: { display: true, text: 'Price' } },
    },
  };

  return (
    <div className="pb-4">
      <h2 className="text-center text-primary mb-3">
        <i className="fas fa-chart-line"></i> Live Trades Chart
      </h2>
      <p className="text-center text-muted">
        All trades from all users in real time.
      </p>
      <div className="card shadow-sm p-3">
        <div style={{ height: 500 }}>
          <Line data={data} options={options} />
        </div>
      </div>
    </div>
  );
}

export default LiveChart;

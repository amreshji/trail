import React, { useState } from 'react';
import api from '../services/api';

function RegisterUser() {
  const [username, setUsername] = useState('');
  const [broker, setBroker] = useState('angel');
  const [apiKey, setApiKey] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [defaultQty, setDefaultQty] = useState(1);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        username,
        broker,
        api_key: apiKey,
        totp_token: totpToken,
        default_quantity: parseInt(defaultQty, 10),
      };
      const res = await api.post('/api/register_user', payload);
      alert(res.data.message || 'User registered');
    } catch (err) {
      console.error(err);
      alert('Error registering user');
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('csvFile');
    if (!fileInput.files.length) {
      alert('Please select a CSV file.');
      return;
    }
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
      const res = await api.post('/api/bulk_register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert(res.data.message || 'Bulk register success');
    } catch (err) {
      console.error(err);
      alert('Error in bulk upload');
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <h2 className="text-primary text-center mb-4">
          <i className="fas fa-user-plus"></i> Register Trading User
        </h2>
        <div className="card p-4 shadow-sm mb-3">
          <form onSubmit={handleRegister}>
            <div className="mb-3">
              <label className="form-label">Username</label>
              <input
                className="form-control"
                placeholder="e.g. John123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Broker</label>
              <select
                className="form-select"
                value={broker}
                onChange={(e) => setBroker(e.target.value)}
              >
                <option value="angel">Angel</option>
                <option value="shonnay">Shonnay</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">API Key</label>
              <input
                className="form-control"
                placeholder="API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">TOTP (optional)</label>
              <input
                className="form-control"
                placeholder="TOTP if Angel"
                value={totpToken}
                onChange={(e) => setTotpToken(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Default Quantity</label>
              <input
                type="number"
                className="form-control"
                min="1"
                value={defaultQty}
                onChange={(e) => setDefaultQty(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-success w-100">
              <i className="fas fa-user-plus"></i> Register User
            </button>
          </form>
        </div>

        <div className="card p-4 shadow-sm">
          <h5 className="text-info">
            <i className="fas fa-file-csv"></i> Bulk Register via CSV
          </h5>
          <form onSubmit={handleBulkUpload}>
            <div className="mb-3">
              <label className="form-label">
                CSV Format: username,broker,api_key,totp_token,default_quantity
              </label>
              <input
                type="file"
                id="csvFile"
                className="form-control"
                accept=".csv"
              />
            </div>
            <button type="submit" className="btn btn-info w-100">
              <i className="fas fa-upload"></i> Bulk Register
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegisterUser;

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import RegisterUser from './pages/RegisterUser';
import PlaceOrder from './pages/PlaceOrder';
import Trades from './pages/Trades';
import LiveChart from './pages/LiveChart';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('isAdmin');
    if (stored === 'true') {
      setIsAdmin(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAdmin(true);
    localStorage.setItem('isAdmin', 'true');
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('isAdmin');
  };

  return (
    <BrowserRouter>
      <Navbar isAdmin={isAdmin} onLogout={handleLogout} />
      <div className="container py-4">
        <Routes>
          <Route
            path="/admin_login"
            element={<AdminLogin isAdmin={isAdmin} onLogin={handleLogin} />}
          />
          <Route
            path="/admin_dashboard"
            element={
              <ProtectedRoute isAdmin={isAdmin}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register_user"
            element={
              <ProtectedRoute isAdmin={isAdmin}>
                <RegisterUser />
              </ProtectedRoute>
            }
          />
          <Route
            path="/place_order"
            element={
              <ProtectedRoute isAdmin={isAdmin}>
                <PlaceOrder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trades"
            element={
              <ProtectedRoute isAdmin={isAdmin}>
                <Trades />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chart"
            element={
              <ProtectedRoute isAdmin={isAdmin}>
                <LiveChart />
              </ProtectedRoute>
            }
          />
          {/* Default route */}
          <Route
            path="/"
            element={
              isAdmin ? (
                <AdminDashboard />
              ) : (
                <AdminLogin isAdmin={isAdmin} onLogin={handleLogin} />
              )
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

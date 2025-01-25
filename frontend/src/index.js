import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
// Font Awesome (optional icons)
import '@fortawesome/fontawesome-free/css/all.min.css';

// Your custom styles
import './styles/main.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

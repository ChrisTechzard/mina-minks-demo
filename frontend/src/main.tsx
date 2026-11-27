import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// GitHub Pages serves project sites from /<repo>/; Render keeps the default '/'.
const basename = import.meta.env.BASE_URL;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element was not found in the document.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

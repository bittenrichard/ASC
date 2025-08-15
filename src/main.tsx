// src/main.tsx

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Toaster } from 'react-hot-toast';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster 
      position="top-right"
      toastOptions={{
        success: {
          style: {
            background: '#F0FFF4', // green-50
            color: '#22543D', // green-900
          },
        },
        error: {
          style: {
            background: '#FFF5F5', // red-50
            color: '#742A2A', // red-900
          },
        },
      }}
    />
  </StrictMode>
);
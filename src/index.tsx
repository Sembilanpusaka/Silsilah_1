// Silsilah_1/src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Mengimpor komponen App
import './index.css'; // Mengimpor file CSS global
import { BrowserRouter } from 'react-router-dom'; // <--- Tambahkan ini

// Dapatkan elemen root dari index.html
const rootElement = document.getElementById('root');

// Pastikan elemen root ditemukan sebelum me-render aplikasi
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      {/* <--- Bungkus <App /> dengan <BrowserRouter> di sini */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );
} else {
  console.error('Root element with ID "root" not found in the document.');
}
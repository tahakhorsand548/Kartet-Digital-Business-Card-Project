import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safely silence benign Vite HMR (Hot Module Replacement) WebSocket connection warnings
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason?.message || String(event.reason || "");
    if (
      reason.toLowerCase().includes("websocket") ||
      reason.toLowerCase().includes("vite") ||
      reason.toLowerCase().includes("hmr")
    ) {
      event.preventDefault();
      event.stopPropagation();
      console.info("Silenced benign HMR/WebSocket rejection:", reason);
    }
  });

  window.addEventListener("error", (event) => {
    const message = event.message || "";
    if (
      message.toLowerCase().includes("websocket") ||
      message.toLowerCase().includes("vite") ||
      message.toLowerCase().includes("hmr")
    ) {
      event.preventDefault();
      event.stopPropagation();
      console.info("Silenced benign HMR/WebSocket error event:", message);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);


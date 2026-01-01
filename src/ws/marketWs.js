import { wsUrl } from '../utils/apiUrl';
let ws = null;
let listeners = new Set();

export const connectMarketWS = () => {
  if (ws) return ws;

  ws = new WebSocket(`ws://${wsUrl}/ws/market`);

  ws.onopen = () => {
    console.log("✅ [MarketWS] Connected");
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      listeners.forEach(fn => fn(msg));
    } catch {}
  };

  ws.onerror = (e) => {
    console.log("❌ [MarketWS] Error", e?.message);
  };

  ws.onclose = () => {
    ws = null;
  };

  return ws;
};

/* 🔥 ADD THIS */
export const sendMarketMessage = (payload) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(payload));
};

/* optional */
export const onMarketMessage = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

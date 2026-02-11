// ✅ marketWs.js — Works with your EXACT apiUrl.js (no changes needed)
import { wsUrl } from '../utils/apiUrl';

let ws = null;
let listeners = new Set();

// 🔥 Auto-detect: if wsUrl has IP:port → use 'ws'; if domain → 'wss'
const getWsProtocol = (host) => {
  // Check if it's an IP or localhost (dev)
  if (host.includes('192.168.') || 
      host.includes('localhost') || 
      host.includes('127.0.0.1') ||
      host.includes(':')) {
    return 'ws';
  }
  return 'wss';
};



export const connectMarketWS = () => {
  if (ws && ws.readyState === WebSocket.OPEN) return ws;

  const protocol = getWsProtocol(wsUrl);
  const url = `${protocol}://${wsUrl}/ws/prices`;

  ws = new WebSocket(url);

  ws.onopen = () => {
    console.log(`✅ [MarketWS] Connected to ${url}`);
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      listeners.forEach(fn => fn(msg));
    } catch (e) {
      console.warn("[MarketWS] Invalid JSON:", event.data);
    }
  };

  ws.onerror = (e) => {
    console.error(`❌ [MarketWS] Failed to connect to ${url}`);
    // Common reasons: backend not running, wrong port, CORS (if strict), or wrong path
  };

  ws.onclose = () => {
    console.log("🔌 [MarketWS] Closed");
    ws = null;
  };

  return ws;
};

export const sendMarketMessage = (payload) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(payload));
};

export const onMarketMessage = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
import { wsUrl } from '../utils/apiUrl';

let ws = null;
let listeners = new Set();
let reconnectInterval = null;

const getWsProtocol = (host) => {
  if (
    host.includes('192.168.') ||
    host.includes('localhost') ||
    host.includes('127.0.0.1') ||
    host.includes(':')
  ) {
    return 'ws';
  }
  return 'wss';
};

const createConnection = () => {
  const protocol = getWsProtocol(wsUrl);
  const url = `${protocol}://${wsUrl}/ws/prices`;

  ws = new WebSocket(url);

  ws.onopen = () => {
    console.log(`✅ [MarketWS] Connected to ${url}`);
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      listeners.forEach((fn) => fn(msg));
    } catch (e) {
      console.warn('[MarketWS] Invalid JSON:', event.data);
    }
  };

  ws.onerror = () => {
    console.log('⚠️ [MarketWS] Error');
  };

  ws.onclose = () => {
    console.log('🔌 [MarketWS] Closed');
    ws = null;
  };
};

export const connectMarketWS = () => {
  if (ws && ws.readyState === WebSocket.OPEN) return ws;

  createConnection();

  // 🔥 Start auto reconnect checker (only once)
  if (!reconnectInterval) {
    reconnectInterval = setInterval(() => {
      if (!ws || ws.readyState === WebSocket.CLOSED) {
        console.log('🔄 [MarketWS] Reconnecting...');
        createConnection();
      }
    }, 1000);
  }

  return ws;
};

export const sendMarketMessage = (payload) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
};

export const onMarketMessage = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

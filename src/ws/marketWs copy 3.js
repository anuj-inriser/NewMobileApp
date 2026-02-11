import { wsUrl } from '../utils/apiUrl';

let ws = null;
let listeners = new Set();
let reconnectTimeout = null;
let isConnecting = false;
let reconnectDelay = 1000; // start with 1 sec
const MAX_RECONNECT_DELAY = 10000; // max 10 sec

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

const connect = () => {
  if (isConnecting || (ws && ws.readyState === WebSocket.OPEN)) {
    return;
  }

  isConnecting = true;

  const protocol = getWsProtocol(wsUrl);
  const url = `${protocol}://${wsUrl}/ws/prices`;

  ws = new WebSocket(url);

  ws.onopen = () => {
    console.log(`✅ [MarketWS] Connected`);
    isConnecting = false;
    reconnectDelay = 1000; // reset delay after success
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      listeners.forEach((fn) => fn(msg));
    } catch (e) {
      console.warn('[MarketWS] Invalid JSON:', event.data);
    }
  };

  ws.onerror = (err) => {
    console.log('⚠️ [MarketWS] Error:', err.message);
  };

  ws.onclose = () => {
    console.log('🔌 [MarketWS] Closed');
    ws = null;
    isConnecting = false;
    scheduleReconnect();
  };
};

const scheduleReconnect = () => {
  if (reconnectTimeout) return;

  console.log(`🔄 [MarketWS] Reconnecting in ${reconnectDelay / 1000}s`);

  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    connect();
    reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY); // exponential backoff
  }, reconnectDelay);
};

export const connectMarketWS = () => {
  connect();
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

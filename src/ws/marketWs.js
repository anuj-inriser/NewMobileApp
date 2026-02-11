import { wsUrl } from '../utils/apiUrl';

let ws = null;
let listeners = new Set();
let reconnectTimeout = null;
let marketTimer = null;

let isConnecting = false;
let reconnectDelay = 1000; // 1 sec start
const MAX_RECONNECT_DELAY = 10000; // 10 sec max

/* -------------------------------------------------- */
/* 🔹 Helpers */
/* -------------------------------------------------- */

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

const isWeekend = () => {
  const day = new Date().getDay();
  return day === 0 || day === 6; // Sunday or Saturday
};

const isMarketOpenTime = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  return hours > 9 || (hours === 9 && minutes >= 15);
};

/* -------------------------------------------------- */
/* 🔹 Core WebSocket Connection */
/* -------------------------------------------------- */

const connect = () => {
  if (isConnecting || (ws && ws.readyState === WebSocket.OPEN)) {
    return;
  }

  if (isWeekend()) {
    console.log("📴 Weekend - WS will not connect");
    return;
  }

  if (!isMarketOpenTime()) {
    console.log("⏳ Market not open yet");
    return;
  }

  isConnecting = true;

  const protocol = getWsProtocol(wsUrl);
  const url = `${protocol}://${wsUrl}/ws/prices`;

  console.log("🔌 [MarketWS] Connecting...");

  ws = new WebSocket(url);

  ws.onopen = () => {
    console.log("✅ [MarketWS] Connected");
    isConnecting = false;
    reconnectDelay = 1000; // reset delay
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
    console.log("⚠️ [MarketWS] Error:", err?.message);
  };

  ws.onclose = () => {
    console.log("🔌 [MarketWS] Closed");
    ws = null;
    isConnecting = false;
    scheduleReconnect();
  };
};

/* -------------------------------------------------- */
/* 🔹 Reconnect Logic (Exponential Backoff) */
/* -------------------------------------------------- */

const scheduleReconnect = () => {
  if (reconnectTimeout) return;

  if (!isMarketOpenTime() || isWeekend()) return;

  console.log(`🔄 Reconnecting in ${reconnectDelay / 1000}s`);

  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    connect();
    reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
  }, reconnectDelay);
};

/* -------------------------------------------------- */
/* 🔹 09:15 Auto Scheduler */
/* -------------------------------------------------- */

const scheduleMarketOpenConnection = () => {
  if (isWeekend()) {
    console.log("📴 Weekend - No market connection");
    return;
  }

  const now = new Date();
  const marketOpen = new Date();

  marketOpen.setHours(9, 15, 0, 0);

  if (isMarketOpenTime()) {
    connect();
    return;
  }

  const timeDiff = marketOpen.getTime() - now.getTime();

  console.log(
    `⏳ Market WS scheduled in ${Math.floor(timeDiff / 1000)} seconds`
  );

  if (marketTimer) clearTimeout(marketTimer);

  marketTimer = setTimeout(() => {
    console.log("🟢 Market Open - Connecting WS");
    connect();
  }, timeDiff);
};

/* -------------------------------------------------- */
/* 🔹 Public APIs */
/* -------------------------------------------------- */

export const connectMarketWS = () => {
  scheduleMarketOpenConnection();
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

// useRealtimePrices.js — Final Corrected
import { useEffect, useRef, useState } from "react";
import { onMarketMessage } from "../ws/marketWs";
import { latestPrices } from "../store/marketPrices"; // Import global cache

export const useRealtimePrices = () => {
  const [prices, setPrices] = useState({ ...latestPrices });
  const bufferRef = useRef({});

  useEffect(() => {
    const unsubscribe = onMarketMessage((msg) => {
      // ✅ Handle v2 format
      const data =
        msg?.type?.toLowerCase() === "price"
          ? msg.data
          : msg?.symbol || msg?.token
            ? msg
            : null;
      if (!data) return;

      const { token, symbol, value: price, close: prevClose, open, timestamp, exchange_timestamp } = data;
      const key = token != null && String(token).trim() !== ""
        ? String(token)
        : symbol != null && String(symbol).trim() !== ""
          ? String(symbol)
          : null;
      if (!key || price == null) return;

      const prev = bufferRef.current[key] || latestPrices[key];
      const base = prev?.prevClose ?? prevClose ?? open ?? prev?.price ?? price;

      const newPriceData = {
        price,
        prevClose: base,
        change: price - base,
        changePercent: base ? ((price - base) / base) * 100 : 0,
        timestamp: exchange_timestamp || timestamp,
        exchange_timestamp: exchange_timestamp || timestamp,
        __ui_ts: Date.now(), // for flash
      };
      bufferRef.current[key] = newPriceData;
      if (symbol && String(symbol).trim() !== "") {
        bufferRef.current[String(symbol)] = newPriceData;
      }

      // Update global cache immediately (so other screens get fresh data)
      latestPrices[key] = newPriceData;
      if (symbol && String(symbol).trim() !== "") {
        latestPrices[String(symbol)] = newPriceData;
      }
    });

    const flush = setInterval(() => {
      const snapshot = { ...bufferRef.current };
      if (Object.keys(snapshot).length > 0) {
        bufferRef.current = {};
        setPrices(prev => ({ ...prev, ...snapshot }));
      }
    }, 400);

    return () => {
      unsubscribe?.();
      clearInterval(flush);
    };
  }, []);

  return { prices };
};

export default useRealtimePrices;
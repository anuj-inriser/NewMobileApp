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
      if (msg?.type?.toLowerCase() !== "price") return;
      const data = msg.data;
      if (!data) return;

      const { symbol, value: price, close: prevClose, open } = data;
      if (!symbol || price == null) return;

      const prev = bufferRef.current[symbol] || latestPrices[symbol];
      const base = prev?.prevClose ?? prevClose ?? open ?? prev?.price ?? price;

      const newPriceData = {
        price,
        prevClose: base,
        change: price - base,
        changePercent: base ? ((price - base) / base) * 100 : 0,
        __ui_ts: Date.now(), // for flash
      };
      bufferRef.current[symbol] = newPriceData;

      // Update global cache immediately (so other screens get fresh data)
      latestPrices[symbol] = newPriceData;
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
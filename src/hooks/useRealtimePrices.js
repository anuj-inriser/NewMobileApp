import { useEffect, useRef, useState } from "react";
import { onMarketMessage } from "../ws/marketWs";

export const useRealtimePrices = () => {
  const [prices, setPrices] = useState({});
  const bufferRef = useRef({});

  useEffect(() => {
    // 🔔 Listen WS messages
    const unsubscribe = onMarketMessage((msg) => {
      if (msg.type !== "PRICE") return;

      const { symbol, price, prevClose, open, ts } = msg;
      if (!symbol || price == null) return;

      const prev = bufferRef.current[symbol];
      const base =
        prev?.prevClose ??
        prevClose ??
        open ??
        prev?.price ??
        price;

      bufferRef.current[symbol] = {
        price,
        prevClose: base,
        change: price - base,
        changePercent: base > 0 ? ((price - base) / base) * 100 : 0,
        timestamp: ts || Date.now(),
      };
    });

    // 🔥 FORCE RE-RENDER (MOST IMPORTANT PART)
    const flush = setInterval(() => {
      if (Object.keys(bufferRef.current).length) {
        const snapshot = { ...bufferRef.current };
        bufferRef.current = {}; // 🔥 CLEAR BUFFER

        setPrices((prev) => ({
          ...prev,
          ...snapshot,
        }));
      }
    }, 800);

    return () => {
      unsubscribe?.();
      clearInterval(flush);
    };
  }, []);

  return { prices };
};

export default useRealtimePrices;

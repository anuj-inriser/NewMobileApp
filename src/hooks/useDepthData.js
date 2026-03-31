import { useEffect, useRef, useState } from "react";
import { onMarketMessage } from "../ws/marketWs";

export const useDepthData = () => {
  const [depthMap, setDepthMap] = useState({});
  const [marketPhase, setMarketPhase] = useState("CLOSED");
  const bufferRef = useRef({});

  useEffect(() => {
    const unsubscribe = onMarketMessage((msg) => {
      if (msg.marketPhase) {
        setMarketPhase(msg.marketPhase);
      } else {
        setMarketPhase("CLOSED");
      }

      const msgType = String(msg?.type || "").toLowerCase();
      if (msgType !== "depth") return;

      const data = msg.data;
      if (!data) return;


      const key = data.token || data.symbol || "default";
      bufferRef.current[key] = data;
    });

    const flush = setInterval(() => {
      if (Object.keys(bufferRef.current).length > 0) {
        setDepthMap(prev => ({ ...prev, ...bufferRef.current }));
        bufferRef.current = {};
      }
    }, 200);

    return () => {
      unsubscribe?.();
      clearInterval(flush);
    };
  }, []);

  return { depthMap, marketPhase  };
};

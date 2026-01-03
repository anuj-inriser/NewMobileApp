import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { apiUrl } from "../utils/apiUrl";

export const usePrevCloses = (symbols = []) => { 
    console.log("symbols",symbols)
  const [prevCloses, setPrevCloses] = useState({});
  const fetchedRef = useRef(new Set());

  useEffect(() => {
    if (!Array.isArray(symbols) || symbols.length === 0) return;

    const fetchPrevClose = async (symbol) => {
      try {
        console.log("📡 PREV-CLOSE API CALL →", symbol);

        const res = await axios.get(
          `${apiUrl}/api/market/prev-close`,
          {
            params: {
              symbol,
              exchange: "NSE",
            },
          }
        );

        console.log("✅ PREV-CLOSE RESPONSE:", res.data);

        if (res.data?.success && res.data.prevClose != null) {
          setPrevCloses((prev) => ({
            ...prev,
            [symbol]: Number(res.data.prevClose),
          }));
        }
      } catch (err) {
        console.error("❌ PREV-CLOSE ERROR:", symbol, err.message);
      }
    };

    symbols.forEach((symbol) => {
      if (!symbol) return;
      if (fetchedRef.current.has(symbol)) return;

      fetchedRef.current.add(symbol);
      fetchPrevClose(symbol);
    });
  }, [symbols]);

  return prevCloses;
};

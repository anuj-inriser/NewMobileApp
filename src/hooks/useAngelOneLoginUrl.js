import { useEffect, useRef, useState } from "react";
import axiosInstance from "../api/axios";

export function useAngelOneLoginUrl({
  state,
  enabled,
  onAuthError,
  onError,
}) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const onAuthErrorRef = useRef(onAuthError);
  const onErrorRef = useRef(onError);

  
  useEffect(() => {
    onAuthErrorRef.current = onAuthError;
    onErrorRef.current = onError;
  }, [onAuthError, onError]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!enabled) {
        setUrl(null);
        return;
      }

      setLoading(true);
      try {
        const res = await axiosInstance.get("/broker/angelone/angelOne-url", {
          params: { state },
        });

        const nextUrl = res?.data?.url || null;

        console.log(`res =${res} nextUrl=${nextUrl}`);

        // axiosInstance resolves some error responses (500/network) into a synthetic object.
        // Treat "no url" as an error so callers can show a meaningful message.
        if (!nextUrl) {
          const message =
            res?.data?.message || "Angel One login URL not available";
          const syntheticError = new Error(message);
          syntheticError._status =
            res?.status || res?.statusCode || res?.data?.statusCode || null;
          throw syntheticError;
        }

        if (!cancelled) setUrl(nextUrl);
      } catch (e) {
        if (cancelled) return;

        setUrl(null);
        const status = e?.response?.status || e?._status;
        if (status === 401) onAuthErrorRef.current?.(e);
        else onErrorRef.current?.(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [enabled, state]);

  return { url, loading };
}

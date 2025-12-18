import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '../utils/apiUrl';
import { useCallback } from 'react';

// Selector function defined outside to maintain referential stability
const selectIntervalData = (candles) => {
  let ltp = 0;
  let priceChange = 0;
  let percentChange = 0;

  if (candles && candles.length > 0) {
    const lastCandle = candles[candles.length - 1];
    const firstCandle = candles[0];

    ltp = lastCandle.close;
    priceChange = lastCandle.close - firstCandle.open;
    percentChange = ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100;
  }

  return {
    candles,
    ltp,
    priceChange,
    percentChange
  };
};

export function useIntervalData(symbol, interval, limit = 100) {
  const isMarketOpen = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const ist = new Date(utc + (3600000 * 5.5)); // IST time

    const hours = ist.getHours();
    // const minutes = ist.getMinutes(); // Unused
    const day = ist.getDay(); // 0 is Sunday, 6 is Saturday

    // Check weekend
    if (day === 0 || day === 6) return false;

    // Market times: 09:15 to 15:30
    const currentMinutes = hours * 60 + ist.getMinutes();
    const startMinutes = 9 * 60 + 15; // 09:15
    const endMinutes = 15 * 60 + 30;  // 15:30

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  };

  const fetchIntervalData = useCallback(async () => {
    if (!symbol) return null;

    const response = await fetch(
      `${apiUrl}/api/trading/ohlc?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${limit}`
    );



    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || [];
  }, [symbol, interval, limit]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['intervalData', symbol, interval, limit],
    queryFn: fetchIntervalData,
    enabled: !!symbol,
    refetchInterval: isMarketOpen() ? 60000 : false, // Poll every minute if market is open
    staleTime: 60000, // Data is fresh for 1 minute
    cacheTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
    select: selectIntervalData, // Stable reference
    keepPreviousData: true, // Show previous data while fetching new to prevent flickering
  });

  return { data, loading: isLoading, error: error ? error.message : null };
}

export function useAllIntervalsData(symbol) {
  const fetchAllIntervals = useCallback(async () => {
    if (!symbol) return null;

    const response = await fetch(`${apiUrl}/api/intervals/all?symbol=${symbol}`);

    if (!response.ok) {
      throw new Error(`Error fetching all intervals: ${response.statusText}`);
    }

    return await response.json();
  }, [symbol]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['allIntervals', symbol],
    queryFn: fetchAllIntervals,
    enabled: !!symbol,
    staleTime: 60000,
  });

  return { data, loading: isLoading, error: error ? error.message : null };
}

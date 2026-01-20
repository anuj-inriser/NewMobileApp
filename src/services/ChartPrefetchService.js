import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiUrl } from "../utils/apiUrl";

const RESOLUTIONS = ["1", "1D"]; // Prefetch 1-minute and 1-day

export const ChartPrefetchService = {
  /**
   * Main function to trigger prefetching.
   * Can be called after Login or App Open.
   */
  prefetchWatchlist: async () => {
    // 1. Fetch User's Watchlist (Top 5)
    let symbolsToPrefetch = [];
    try {
      // Assuming 'limit=5' fetches the top 5 stocks
      const response = await fetch(`${apiUrl}/api/trading/watchlist?limit=5`);
      const result = await response.json();
      if (result.success && result.data) {
        symbolsToPrefetch = result.data.map((s) => {
          // Ensure symbol has prefix if needed, or rely on clean names
          return s.symbol.includes(":") ? s.symbol : `NSE:${s.symbol}`;
        });
        // We do NOT merge with defaults anymore. STRICTLY dynamic.
      }
    } catch (e) {
      console.error("[ChartPrefetch] Failed to fetch watchlist:", e.message);
    }

    // 1.5 Fetch Community Stocks (Top 3 from First Sequence)
    // "Can we also do caching of commity stock like that"
    try {
      const seqRes = await fetch(
        `${apiUrl}/api/communitysequence/community-sequences`,
      );
      const seqData = await seqRes.json();

      if (seqData.success && seqData.data && seqData.data.length > 0) {
        const firstSeqId = seqData.data[0].id; // Top trending sequence
        const postRes = await fetch(
          `${apiUrl}/api/communitypost/sequence/${firstSeqId}`,
        );
        const postData = await postRes.json();

        if (postData.success && postData.data) {
          const commSymbols = postData.data
            .slice(0, 3)
            .map((p) => {
              const sym = p.content_symbol || p.stock_name;
              return sym && sym.includes(":") ? sym : `NSE:${sym}`;
            })
            .filter((s) => s && !s.includes("undefined"));

          symbolsToPrefetch = [
            ...new Set([...symbolsToPrefetch, ...commSymbols]),
          ];
        }
      }
    } catch (e) {
      console.error(
        "[ChartPrefetch] Failed to fetch community stocks:",
        e.message,
      );
    }

    // 2. Determine Intervals
    const lastInterval = await AsyncStorage.getItem("@chart_interval");
    const resolutionsToFetch = [...RESOLUTIONS];
    if (lastInterval && !resolutionsToFetch.includes(lastInterval)) {
      resolutionsToFetch.push(lastInterval);
    }

    console.log(
      "🚀 [ChartPrefetch] Starting prefetch for:",
      symbolsToPrefetch.length,
      "symbols. Res:",
      resolutionsToFetch,
    );

    for (const symbol of symbolsToPrefetch) {
      for (const resolution of resolutionsToFetch) {
        // Run in background without awaiting efficiently
        ChartPrefetchService.fetchAndCache(symbol, resolution);
      }
    }
  },

  fetchAndCache: async (fullSymbol, resolution) => {
    try {
      const cleanSymbol = fullSymbol.replace(/^(NSE:|BSE:)/, "");
      const interval = ChartPrefetchService.mapResolutionToInterval(resolution);
      const to = Math.floor(Date.now() / 1000);
      const from = to - (resolution === "1D" ? 31536000 : 604800); // 1 Year or 7 Days

      // Use the exact same API endpoint as the chart
      const url = `${apiUrl}/api/trading/ohlc?symbol=${cleanSymbol}&interval=${interval}&from=${from}&to=${to}&limit=1000`;

      // console.log(`[ChartPrefetch] Fetching: ${url}`);

      const response = await fetch(url);
      const json = await response.json();

      if (json.success && json.data && json.data.length > 0) {
        const cacheKey = `@chart_cache_${fullSymbol}_${resolution}`;

        // Transform to TradingView format here to save processing time later
        const bars = json.data
          .map((bar) => ({
            time: new Date(bar.time).getTime(),
            open: parseFloat(bar.open),
            high: parseFloat(bar.high),
            low: parseFloat(bar.low),
            close: parseFloat(bar.close),
            volume: parseFloat(bar.volume || 0),
          }))
          .sort((a, b) => a.time - b.time);

        await AsyncStorage.setItem(cacheKey, JSON.stringify(bars));
        console.log(
          `[ChartPrefetch] ✅ Cached ${bars.length} bars for ${fullSymbol} (${resolution})`,
        );
      }
    } catch (e) {
      console.error(`[ChartPrefetch] Failed for ${fullSymbol}:`, e.message);
    }
  },

  mapResolutionToInterval: (resolution) => {
    const map = {
      1: "1m",
      5: "5m",
      15: "15m",
      30: "30m",
      60: "1h",
      "1D": "1d",
      D: "1d",
    };
    return map[resolution] || "1m";
  },
};

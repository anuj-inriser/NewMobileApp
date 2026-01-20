import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  ActivityIndicator,
  Text,
  AppState,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import axiosInstance from "../api/axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

// import TopHeader from "../components/TopHeader";
import TopMenuSlider from "../components/TopMenuSlider";
import TopWatchlistMenu from "../components/TopWatchlistMenu";
import WatchlistItemCard from "../components/WatchlistItemCard";
// import BottomTabBar from "../components/BottomTabBar";

import { apiUrl } from "../utils/apiUrl";
import { useRealtimePrices } from "../hooks/useRealtimePrices";
import {
  subscribeSymbols,
  unsubscribeDelayed,
} from "../ws/marketSubscriptions";

const mergeWithRealtime = (list, realtimePrices) => {
  return list.map(item => {
    const rt = realtimePrices[item.token] || realtimePrices[item.script_id];

    // ✅ LTP: realtime > item.ltp > 0
    const ltp = rt?.price != null
      ? Number(rt.price)
      : Number(item.ltp || item.value || 0);
    // ✅ Prev Close: realtime > item.prev_close > ltp (no change fallback)
    const prevClose = rt?.prevClose != null
      ? Number(rt.prevClose)
      : Number(item.prev_close || item.prevClose || ltp);

    // ✅ Recalculate every ,time — fresh & consistent
    const change = ltp - prevClose;
    const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;
    // console.log("ltp",ltp)
    // console.log("prevClose",prevClose)
    // console.log("change",change)
    // console.log("changePercent",changePercent)

    return {
      ...item,
      value: ltp,
      prevClose,          // ✅ expose for debugging/UI
      change,
      changePercent,
      timestamp: rt?.timestamp || item.timestamp || new Date().toISOString(),
    };
  });
};

export default function TradeOrderListScreen({ navigation }) {
  const [currentWatchlistId, setCurrentWatchlistId] = useState(null);
  const [stocks, setStocks] = useState([]); // ✅ raw DB data
  const [enrichedStocks, setEnrichedStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [removingScriptId, setRemovingScriptId] = useState(null);

  const { prices: realtimePrices } = useRealtimePrices();
  const symbolsRef = useRef([]);
  const fetchedPrevCloseRef = useRef(false);

  // ---------------- FETCH WATCHLIST ----------------
  const fetchWatchlistStocks = useCallback(async (wishlistId) => {
    if (!wishlistId) {
      setStocks([]);
      setEnrichedStocks([]);
      symbolsRef.current = [];
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `${apiUrl}/api/wishlistcontrol/stocks`,
        { params: { wishlist_id: wishlistId } }
      );
      const data = res.data?.data || [];
      setStocks(data);
      const enriched = data.map(item => {
        const value = Number(item.ltp || item.last_price || item.lastPrice || item.value || 0);
        const prevClose = Number(item.prev_close || item.prevClose || 0);
        const change = prevClose > 0 ? value - prevClose : 0;
        const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

        return {
          ...item,
          symbol: String(item.script_id),
          name: item.script_name,
          value,           // ✅ current LTP (DB)
          prevClose,       // ✅ DB prev close
          change,
          changePercent,
          timestamp: new Date().toISOString()
        };
      });
      setEnrichedStocks(enriched);
      symbolsRef.current = enriched.map(i => i.symbol).filter(Boolean);

    } catch (err) {
      console.error("❌ Failed to fetch watchlist stocks:", err.message);
      Alert.alert("Error", "Failed to load watchlist.");
      setStocks([]);
      setEnrichedStocks([]);
      symbolsRef.current = [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchlistStocks(currentWatchlistId);
  }, [currentWatchlistId, fetchWatchlistStocks]);

  // ---------------- WEBSOCKET SUBSCRIPTION ----------------
  useEffect(() => {
    const symbols = symbolsRef.current;
    if (symbols.length === 0) return;

    const page = "WatchlistPage";
    const context = `Watchlist-${currentWatchlistId}`;
    subscribeSymbols(symbols, page, context);

    const appStateSub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        subscribeSymbols(symbols, page, context);
      } else {
        unsubscribeDelayed(symbols, page, context);
      }
    });

    return () => {
      unsubscribeDelayed(symbols, page, context);
      appStateSub.remove();
    };
  }, [enrichedStocks, currentWatchlistId]);

  // ---------------- REMOVE STOCK ----------------
  const removeStockFromWatchlist = useCallback(async (item) => {
    if (!currentWatchlistId) return;
    const { script_id, script_name } = item;
    if (!script_id) {
      Alert.alert('❌ Error', 'Invalid stock.');
      return;
    }

    setRemovingScriptId(script_id);

    try {
      const userIdStr = await AsyncStorage.getItem('userId');
      if (!userIdStr) {
        Alert.alert('❌ Auth Error', 'User ID not found. Please log in again.');
        setRemovingScriptId(null);
        return;
      }

      const response = await axiosInstance.post(`${apiUrl}/api/wishlistcontrol/remove`, {
        user_id: parseInt(userIdStr, 10),
        wishlist_id: parseInt(currentWatchlistId, 10),
        script_id: script_id,
      });

      if (response.data.success) {
        // Optimistic update on enrichedStocks (not raw stocks)
        setEnrichedStocks(prev => prev.filter(s => s.symbol !== String(script_id)));
        symbolsRef.current = symbolsRef.current.filter(s => s !== String(script_id));
      } else {
        throw new Error(response.data.message || 'Remove failed');
      }
    } catch (err) {
      console.error("❌ Remove stock failed:", err.response?.data || err.message);
      Alert.alert('❌ Failed', `Could not remove "${script_name}".`);
    } finally {
      setRemovingScriptId(null);
    }
  }, [currentWatchlistId]);

  const displayStocks = mergeWithRealtime(enrichedStocks, realtimePrices);

  // ---------------- UI ----------------
  return (
    <>
      <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: "#F5F5F7" }}>

        {/* <TopHeader /> */}
        <TopMenuSlider />
        <TopWatchlistMenu onWatchlistChange={setCurrentWatchlistId} />

        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color="#210F47" />
            <Text style={{ marginTop: 8, color: "#666" }}>Loading watchlist...</Text>
          </View>
        ) : (
          <WatchlistItemCard
            data={displayStocks}
            realtimePrices={{}}
            prevCloses={{}}
            onPressItem={(item) =>
              navigation.navigate("TradeOrder", {
                symbol: item.symbol,
                name: item.name,
              })
            }
            onRemoveItem={removeStockFromWatchlist}
          />
        )}
      </SafeAreaView>
      {/* <BottomTabBar /> */}
    </>
  );
}
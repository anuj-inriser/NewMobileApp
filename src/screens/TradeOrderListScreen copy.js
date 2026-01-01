import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  Alert,
} from 'react-native'; // ✅ Correct: core RN components
import { SafeAreaView } from 'react-native-safe-area-context'; // ✅ Only SafeAreaView from this lib
import { useAuth } from '../context/AuthContext';
import TopHeader from '../components/TopHeader';
import TopMenuSlider from '../components/TopMenuSlider';
import TopWatchlistMenu from '../components/TopWatchlistMenu';
import WatchlistItemCard from '../components/WatchlistItemCard';
import { apiUrl } from '../utils/apiUrl';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomTabBar from '../components/BottomTabBar';


export default function TradeOrderListScreen({ navigation }) {
  const { authToken } = useAuth();
  const [ltpData, setLtpData] = useState({});
  const [currentWatchlistId, setCurrentWatchlistId] = useState(null);
  const [stocksInWatchlist, setStocksInWatchlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stockSymbols, setStockSymbols] = useState([]);
  const ltpIntervalsRef = useRef([]);


  const handleWatchlistAdded = useCallback((wishlistId) => {
    // Only refresh the current watchlist if item was added to the same watchlist
    // Don't switch to the watchlist where item was added
    if (currentWatchlistId && currentWatchlistId === wishlistId) {
      setRefreshTrigger(prev => prev + 1);
    }
    // If item was added to a different watchlist, do nothing (stay on current)
  }, [currentWatchlistId]);

  const removeStockFromWatchlist = async (item) => {
    const userId = await AsyncStorage.getItem('userId'); // ✅ 'userId' (not 'user_id')

    if (!userId) {
      Alert.alert('❌ Auth Error', 'User ID not found. Please log in again.');
      return;
    }

    if (!currentWatchlistId) {
      Alert.alert('⚠️ Error', 'No watchlist selected.');
      return;
    }
    if (!item?.script_id) {
      Alert.alert('⚠️ Error', 'Invalid stock selected.');
      return;
    }

    try {

      const response = await axios.post(`${apiUrl}/api/wishlistcontrol/remove`, {
        user_id: parseInt(userId, 10),
        wishlist_id: parseInt(currentWatchlistId, 10),
        script_id: item.script_id,
      });


      if (response.data.success === true) {
        setStocksInWatchlist(prev =>
          prev.filter(stock => stock.script_id !== item.script_id)
        );
        Alert.alert('✅ Done', `${item.script_name} removed from watchlist`);
      } else {
        throw new Error(response.data.message || 'Operation failed');
      }
    } catch (err) {
      console.error("💥 API Error:", err.response?.data || err.message);
      Alert.alert('❌ Failed', `Could not remove ${item.script_name}`);
    }
  };

  // 🔹 Fetch LTP
  const fetchLtp = async (symbol) => {
    try {
      const res = await fetch(
        `${apiUrl}/api/buyshare/search?symbol=${symbol}&exchange=NSE`,
        {
          headers: {
            Authorization: "Bearer " + authToken,
          },
        }
      );
      const data = await res.json();
      if (data.success && typeof data.ltp === 'number') {
        setLtpData((prev) => ({ ...prev, [symbol]: data.ltp }));
      }
    } catch (err) {
      console.warn(`LTP fetch failed for ${symbol}`);
    }
  };

  // 🔹 Fetch stocks for active watchlist
  const fetchWatchlistStocks = async (wishlistId) => {
    if (!wishlistId) {
      setStocksInWatchlist([]);
      setStockSymbols([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/api/wishlistcontrol/stocks`, {
        params: { wishlist_id: wishlistId },
      });

      if (response.data.success) {
        const stocks = response.data.data || [];
        setStocksInWatchlist(stocks);
        setStockSymbols(stocks.map(s => s.symbol)); // ✅ now safe
      } else {
        setStocksInWatchlist([]);
        setStockSymbols([]);
      }
    } catch (err) {
      console.error('API fetch error:', err.response?.data || err.message);
      setStocksInWatchlist([]);
      setStockSymbols([]);
    } finally {
      setLoading(false);
    }
  };
  // 🔹 Watchlist change → reload
  useEffect(() => {
    fetchWatchlistStocks(currentWatchlistId);
  }, [currentWatchlistId, refreshTrigger]);

  // 🔹 LTP polling cleanup
  useEffect(() => {
    return () => {
      ltpIntervalsRef.current.forEach((timer) => clearInterval(timer));
    };
  }, []);

  useEffect(() => {
    ltpIntervalsRef.current.forEach((timer) => clearInterval(timer));
    ltpIntervalsRef.current = [];

    stocksInWatchlist.forEach((stock) => {
      const interval = setInterval(() => fetchLtp(stock.script_id), 5000);
      ltpIntervalsRef.current.push(interval);
    });
  }, [stocksInWatchlist]);

  // 🔹 UI
  const renderContent = () => {
    if (loading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#210F47" />
          <Text style={{ marginTop: 10, color: '#555' }}>Loading stocks...</Text>
        </View>
      );
    }

    if (stocksInWatchlist.length === 0) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 16, color: '#888', textAlign: 'center' }}>
            {currentWatchlistId
              ? 'No stocks in this watchlist.'
              : 'Select a watchlist to view stocks.'}
          </Text>
        </View>
      );
    }

    return (
      <WatchlistItemCard
        data={stocksInWatchlist}
        ltpData={ltpData}
        onPressItem={(item) =>
          navigation.navigate('TradeOrder', {
            symbol: item.script_id,
            token: item.token,
            ltp: ltpData[item.symbol || item.script_name] || 0,
            name: item.script_name,
            internaltype:'Place'
          })
        }
        onRemoveItem={removeStockFromWatchlist}   // ✅ exact function
      />
    );
  };

  return (
    <>
      <SafeAreaView
        edges={['top', 'bottom']}
        style={{ flex: 1, backgroundColor: '#fff' }}
      >
        <TopHeader
          onWatchlistAdded={handleWatchlistAdded}
        />
        <View style={{
          backgroundColor: "#fff",
          elevation: 10, // Android shadow
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 }, // bottom direction
          shadowOpacity: 0.2,
          shadowRadius: 3,

          // Trick to hide top shadow impact
          marginTop: -3,
          paddingTop: 3,
          marginBottom: 10
        }}>
          <TopMenuSlider />
          <TopWatchlistMenu onWatchlistChange={setCurrentWatchlistId} />
        </View> 
        {renderContent()}
      </SafeAreaView>

      <BottomTabBar/>
    </>
  );
}


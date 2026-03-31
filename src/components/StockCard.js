import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  MoreHorizontal,
  Bookmark,
  Share2,
  ThumbsDown,
  ThumbsUp,
  Clock,
  IndianRupee,
  Scan,
  Maximize2,
  MoreVertical,
  XCircle,
  AlertCircle
} from 'lucide-react-native';
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Image,
  ScrollView,
  Alert,
  Share,
  useWindowDimensions,
  Pressable,
  Animated,
} from 'react-native';
import TextInput from "../components/TextInput";
import { LineChart } from 'react-native-gifted-charts';
import * as ImagePicker from 'expo-image-picker';
import * as Device from "expo-device";
import { useIntervalData } from '../hooks/useIntervalData';
import axios from 'axios';
import axiosInstance from '../api/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiUrl } from '../utils/apiUrl';
import { useAuth } from '../context/AuthContext';
import CommentOverlay from './CommentOverlay';
import SequencePost from './SequencePost';
const { width } = Dimensions.get('window');
import { useNavigation, useNavigationState } from "@react-navigation/native";
import { useAlert } from "../context/AlertContext";
import { useDrawer } from "../context/DrawerContext";
import { Asset } from 'expo-asset';
import { useKeyboardAvoidingShift } from '../hooks/useKeyboardAvoidingShift';


const WISHLIST_API = `${apiUrl}/api/wishlistcontrol`;
// Added postNumber prop with default "1/1"
const StockCard = ({ stock, realtimeData, userReaction, contentType, postNumber, fullScreen }) => {
  const translateY = useKeyboardAvoidingShift()
  const { userId } = useAuth();
  const { showSuccess, showError } = useAlert();
  const { openStockInfoDrawer } = useDrawer();
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [reaction, setReaction] = useState(null); // 'like', 'dislike', null
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [issueDropdownOpen, setIssueDropdownOpen] = useState(false);
  const [issueCategory, setIssueCategory] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [successIssueModalOpen, setSuccessIssueModalOpen] = useState(false);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [chartHeight, setChartHeight] = useState(100);


  const [watchlistModalVisible, setWatchlistModalVisible] = useState(false);
  const [watchlists, setWatchlists] = useState([]);
  const [loadingWatchlists, setLoadingWatchlists] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState({});

  const navigation = useNavigation();

  const fetchWatchlists = async () => {
    if (!userId) return;
    setLoadingWatchlists(true);
    try {
      const res = await axiosInstance.get(`${WISHLIST_API}?user_id=${userId}`);
      const listData = res?.data?.data || [];
      setWatchlists(
        listData.map((item) => ({
          id: item.wishlist_id,
          name: item.wishlist_name,
          user: item.user_id,
        }))
      );
    } catch (err) {
      console.log("Watchlist fetch error:", err);
      setWatchlists([]);
    }
    setLoadingWatchlists(false);
  };

  const handleAddToWatchlist = async (wishlist) => {
    if (!stock || !wishlist || !userId) return;

    if (addingToWishlist[wishlist.id]) return;
    setAddingToWishlist(prev => ({ ...prev, [wishlist.id]: true }));

    const payload = {
      script_id: isNaN(stock.symbol) ? stock.symbol : (stock.token || stock.symbol),
      user_id: parseInt(userId, 10),
      wishlist_id: parseInt(wishlist.id, 10),
      token: stock.token,
    };

    try {
      const stocksRes = await axiosInstance.get(`${apiUrl}/api/wishlistcontrol/stocks`, {
        params: { wishlist_id: parseInt(wishlist.id, 10) }
      });
      const count = Array.isArray(stocksRes?.data?.data) ? stocksRes.data.data.length : 0;
      if (count >= 20) {
        Alert.alert("Alert", "Each watchlist can have maximum 20 stocks.");
        return;
      }

      const response = await axiosInstance.post(`${apiUrl}/api/wishlistcontrol/add`, payload);

      if (response.status === 201 || response.status === 200 || response.status === 409) {
        const msg = response.data.message || "Added to watchlist";
        const alertTitle = (response.status === 201 || msg === "Added to watchlist") ? "Success" : "Info";
        const alertMsg = (msg === "Added to watchlist" || response.status === 201)
          ? `Added ${stock.name || stock.symbol} to ${wishlist.name}`
          : msg;
        Alert.alert(alertTitle, alertMsg);
        setWatchlistModalVisible(false);
      } else {
        Alert.alert("Error", response.data.message || "Failed to add to watchlist");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to add";
      Alert.alert("Error", msg);
    } finally {
      setAddingToWishlist(prev => ({ ...prev, [wishlist.id]: false }));
    }
  };

  useEffect(() => {
    if (watchlistModalVisible) {
      fetchWatchlists();
    }
  }, [watchlistModalVisible, userId]);
  // Helper
  const truncateWords = (str, numWords) => {
    if (!str) return '';
    const words = str.split(' ');
    if (words.length <= numWords) return str;
    return words.slice(0, numWords).join(' ') + '...';
  };



  const handleNextNews = useCallback(() => {
    if (stock.news_items && stock.news_items.length > 0) {
      setCurrentNewsIndex((prev) => (prev + 1) % stock.news_items.length);
    }
  }, [stock.news_items, currentNewsIndex, stock.symbol]);

  const handlePrevNews = useCallback(() => {
    if (stock.news_items && stock.news_items.length > 0) {
      setCurrentNewsIndex((prev) => (prev - 1 + stock.news_items.length) % stock.news_items.length);
    }
  }, [stock.news_items, stock.symbol]);


  useEffect(() => {
    if (successIssueModalOpen) {
      setTimeout(() => {
        setSuccessIssueModalOpen(false);
        // Assuming setIssueModalVisible is defined elsewhere or should be set to false
        // setIssueModalVisible(false); 
      }, 2000);
    }
  }, [successIssueModalOpen]);

  useEffect(() => {
    const parseCount = (val) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return parseInt(val.replace(/,/g, ''), 10) || 0;
      return 0;
    };
    setLikeCount(parseCount(stock.stats?.likes));
    setDislikeCount(parseCount(stock.stats?.dislikes));
    setCommentCount(parseCount(stock.stats?.comments));
  }, [stock.id, stock.stats]);

  useEffect(() => {
    if (userReaction) {
      if (userReaction.isLiked) setReaction('like');
      else if (userReaction.isDisliked) setReaction('dislike');
      else setReaction(null);
    }
  }, [userReaction]);

  const handleReaction = async (type) => {

    let reactionMeta = {
      success: false,
      message: "",
      userid: "",
    };


    if (!userId) {
      showError(
        "Alert",
        "Please login to react."
      );
      return;
    }
    reactionMeta.userid = userId || "";

    const isLike = type === 'like';
    const current = reaction;
    // Optimistic Update
    let newReaction = null;
    if (current === type) {
      // Toggle OFF
      newReaction = null;
      if (isLike) setLikeCount(c => Math.max(0, c - 1));
      else setDislikeCount(c => Math.max(0, c - 1));
    } else {
      // Toggle ON (or Switch)
      newReaction = type;
      if (current === 'like') setLikeCount(c => Math.max(0, c - 1));
      if (current === 'dislike') setDislikeCount(c => Math.max(0, c - 1));
      if (isLike) setLikeCount(c => c + 1);
      else setDislikeCount(c => c + 1);
    }
    setReaction(newReaction);
    try {
      if (newReaction) {
        await axios.post(`${apiUrl}/api/likesdislikes`, {
          ContentID: stock.id,
          content_id: stock.id,
          ReactionUserID: userId,
          reaction_user_id: userId,
          like_dislike: isLike,
          content_type: contentType,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('en-GB')
        });
      } else {
        // Removing reaction
        await axios.delete(`${apiUrl}/api/likesdislikes/user/${userId}/content/${stock.id}/type/${contentType}`);
      }

      reactionMeta.success = true;

      if (newReaction === null) {
        reactionMeta.message = isLike ? "Like revoked" : "Dislike revoked";
      } else {
        reactionMeta.message = isLike ? "Like submitted" : "Dislike submitted";
      }


    } catch (err) {
      if (newReaction === null) {
        reactionMeta.message = isLike ? "Like revoke failed" : "Dislike revoke failed";
      } else {
        reactionMeta.message = isLike ? "Like failed" : "Dislike failed";
      }

      console.error('Reaction failed error:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
        showError(
          "Error",
          JSON.stringify(err.response.data)
        );
      } else {
        showError(
          "Error",
          err.message
        );
      }
      // Revert optimistic update
      setReaction(current);
    } finally {
      try {
        const deviceId =
          Device.osBuildId || Device.modelId || Device.deviceName || "Unknown";

        await axiosInstance.post("/eventlog", {
          user_id: reactionMeta.userid,
          content_id: stock.id,
          success: reactionMeta.success,
          device_id: deviceId,
          event_group_id: 2,
          event_type: isLike ? "Like" : "Dislike",
          content: reactionMeta.message,
          app_version: "1.0.0"
        });
      } catch (err) {
        console.log("Logging failed", err);
      }
    }

  };



  const pickAttachment = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      setAttachment(result.assets[0]);
    }
  };

  const handleReport = () => {
    if (!userId) {
      showError(
        "Alert",
        "Please login to report content."
      );
      return;
    }

    setShowMenu(false);
    setReportModalOpen(true);
  };

  const submitReportIssue = async () => {
    try {
      if (!issueCategory || !issueDescription) {
        showError(
          "Alert",
          "Please select category and description."
        );
        return;
      }

      const formData = new FormData();
      formData.append("complaint_type", "Issue");
      formData.append("complaint_status", "Opened");
      formData.append("issue_type", issueCategory);
      // Combine user description with system context
      const fullMessage = `${issueDescription}`;
      formData.append("message_text", fullMessage);
      formData.append("user_id", userId);

      const getAttachmentFileName = () => {
        const now = new Date();
        return `report_${stock.id}_${now.getTime()}.jpg`;
      };

      if (attachment) {
        formData.append("attachment", {
          uri: attachment.uri,
          name: getAttachmentFileName(),
          type: "image/jpeg",
        });
      }

      await axios.post(
        `${apiUrl}/api/grievance/issuesubmit`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setReportModalOpen(false);
      setSuccessIssueModalOpen(true);

      setIssueCategory("");
      setIssueDescription("");
      setAttachment(null);

    } catch (err) {
      showError(
        "Alert",
        "Failed to submit issue: " + (err.response?.data?.message || err.message)
      );
    }
  };

  const getInitialInterval = (savedTimeframe) => {
    if (!savedTimeframe) return '1m';
    const mapping = {
      '1m': '1m',
      '5m': '5m',
      '10m': '5m', // fallback 10m to 5m? or 15m?
      '15m': '15m',
      '1h': '1H',
      '1 day': '1D',
      '1 week': '1W',
      '1 month': '1M'
    };
    return mapping[savedTimeframe] || '1m';
  };

  const [selectedInterval, setSelectedInterval] = useState(getInitialInterval(stock.content_script_timeframe));
  const intervals = ['1m', '5m', '15m', '1H', '1D', '1W', '1M'];

  const getApiInterval = (uiInterval) => {
    if (uiInterval === '1M') return '1M';
    if (uiInterval === '1m') return '1m';
    const lower = uiInterval.toLowerCase();
    if (['5m', '15m', '1h', '1d', '1w'].includes(lower)) {
      return lower;
    }
    return '1d';
  };

  const apiInterval = getApiInterval(selectedInterval);
  const { data: intervalData, loading } = useIntervalData(stock.symbol, apiInterval);

  // REALTIME DATA LOGIC (Efficient Global Socket)
  const hasRealtime = !!realtimeData;

  const safeFloat = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  const rawPrice = (hasRealtime && realtimeData.price !== undefined) ? realtimeData.price : (intervalData?.ltp ?? (stock.ltp || stock.price || 0));
  const currentPrice = safeFloat(rawPrice);

  const rawChange = (hasRealtime && realtimeData.change !== undefined) ? realtimeData.change : (intervalData?.priceChange ?? (stock.change || stock.priceChange || 0));
  const currentChange = safeFloat(rawChange);

  const rawChangePercent = (hasRealtime && realtimeData.changePercent !== undefined) ? realtimeData.changePercent : (intervalData?.percentChange ?? (stock.percentChange || stock.changePercent || 0));
  const currentChangePercent = safeFloat(rawChangePercent);

  const currentHigh = intervalData?.ohlc?.high ?? 0;
  const currentLow = intervalData?.ohlc?.low ?? 0;

  // const isPositive = currentChange >= 0;
  // const color = isPositive ? global.colors.success : global.colors.error;

  const isPositive = currentChange > 0;

  let color = global.colors.textSecondary; // grey for 0

  if (currentChange > 0) {
    color = global.colors.success;
  } else if (currentChange < 0) {
    color = global.colors.error;
  }
  const formatXAxisLabel = useCallback((time, interval, index, total) => {
    let date;
    if (typeof time === 'string') {
      date = new Date(time);
    } else if (typeof time === 'number') {
      date = time < 946684800000 ? new Date(time * 1000) : new Date(time);
    } else {
      date = new Date(time);
    }
    if (isNaN(date.getTime())) return '';
    const labelFrequency = Math.max(1, Math.floor(total / 4));
    if (index % labelFrequency !== 0 && index !== total - 1) return '';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    switch (interval) {
      case '1m':
      case '5m':
      case '15m':
        return `${hours}:${minutes}`;
      case '1h':
      case '1d':
      case '1w':
      case '1M':
        return `${day} ${month}`;
      default:
        return '';
    }
  }, []);

  const chartData = useMemo(() => {
    return intervalData?.candles.map((item, index) => ({
      value: parseFloat(item.close),
      label: formatXAxisLabel(item.time, apiInterval, index, intervalData.candles.length),
      dataPointColor: color,
      labelTextStyle: { color: global.colors.textSecondary, width: 80, textAlign: 'center' },
    })) || [];
  }, [intervalData, apiInterval, color]);

  const chartWidth = width - 80;
  const dynamicSpacing = chartData.length > 1 ? chartWidth / (chartData.length - 1) : chartWidth;

  const [yAxisMax, setYAxisMax] = useState(0);
  const [yAxisMin, setYAxisMin] = useState(0);
  const scrollTimeout = useRef(null);

  const updateScaling = useCallback((offsetX) => {
    if (chartData.length === 0) return;
    const spacing = dynamicSpacing;
    const startIndex = Math.max(0, Math.floor(offsetX / spacing));
    const endIndex = Math.min(chartData.length, Math.ceil((offsetX + chartWidth) / spacing) + 1);
    const visibleData = chartData.slice(startIndex, endIndex);
    if (visibleData.length === 0) return;
    const values = visibleData.map(d => d.value);
    setYAxisMax(Math.max(...values));
    setYAxisMin(Math.min(...values));
  }, [chartData, dynamicSpacing, chartWidth]);

  useEffect(() => {
    if (chartData.length > 0) {
      updateScaling(0);
    }
  }, [chartData, updateScaling]);


  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => updateScaling(offsetX), 50);
  };


  const displayData = chartData.map(d => ({ ...d, value: Math.max(0, d.value - yAxisMin) }));

  const handleShare = async () => {
    let shareMeta = {
      success: false,
      message: "",
      userid: "",
    };

    const userId = await AsyncStorage.getItem("userId");
    shareMeta.userid = userId || "";

    try {

      // Prepare the caption
      const shareMessage = `Check out ${stock.name} (${stock.symbol}) on Equitty App! Current Price: ₹${currentPrice.toFixed(2)}\n\nhttps://equitty.one/stock/${stock.symbol}`;

      const result = await Share.share({
        message: shareMessage,
      });

      if (result.action === Share.sharedAction) {
        shareMeta.success = true;
        shareMeta.message = "Share submitted";
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
        shareMeta.message = "Share dismissed";
      }
    } catch (error) {
      shareMeta.message = "Share failed";
      console.error('Share error:', error.message);
      showError(
        "Alert",
        'Unable to share', error.message
      );
    } finally {
      try {
        const deviceId =
          Device.osBuildId || Device.modelId || Device.deviceName || "Unknown";

        await axiosInstance.post("/eventlog", {
          user_id: shareMeta.userid,
          content_id: stock.id,
          success: shareMeta.success,
          device_id: deviceId,
          event_group_id: 2,
          event_type: "Share",
          content: shareMeta.message,
          app_version: "1.0.0"
        });
      } catch (err) {
        console.log("Logging failed", err);
      }
    }

  };

  return (
    <View style={[styles.card, fullScreen && styles.cardFullScreen]}>
      {/* Header */}
      <View style={styles.stockHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.textColumn}>
            <Text style={styles.stockName}>{stock.exchange && stock.exchange !== 'undefined' ? `${stock.exchange}: ` : ''}
              {isNaN(stock.symbol) ? stock.symbol : (stock.name || stock.symbol || stock.token)}</Text>
            <Text style={styles.stockSymbol}>
              {stock.name}
            </Text>
          </View>

          {postNumber && (
            <View style={styles.postNumberContainer}>
              <Text style={styles.postNumberText}>{postNumber}</Text>
            </View>
          )}
        </View>
        <View style={styles.priceContainer}>
          <View style={{}}>
            <Text style={styles.price}>
              {loading && currentPrice === 0 ? '--' : `₹${currentPrice.toFixed(2)}`}
            </Text>
            <Text style={[styles.change, { color }]}>
              {loading && currentPrice === 0
                ? '--'
                : `${isPositive ? '+' : ''}${currentChange.toFixed(2)} (${currentChangePercent.toFixed(2)}%)`}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
            <MoreVertical size={20} color={global.colors.textPrimary} />
          </TouchableOpacity>
        </View>
        {showMenu && (
          <>
            <TouchableOpacity
              style={styles.menuBackdrop}
              activeOpacity={1}
              onPress={() => setShowMenu(false)}
            />
            <View style={styles.menuOverlay}>
              <TouchableOpacity
                style={[styles.menuItem]}
                onPress={handleReport}
              >
                <AlertCircle size={20} color={global.colors.textPrimary} />
                <Text style={[styles.menuText, { color: global.colors.textPrimary }]}>Report</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Main Chart */}
      <View
        style={[styles.chartContainer, { flex: 1 }]}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          if (height > 50) {
            setChartHeight(height);
          }
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={color} style={{ flex: 1 }} />
        ) : chartData.length > 0 ? (
          <>
            <LineChart
              data={displayData}
              height={chartHeight > 0 ? chartHeight - 50 : 100}
              width={width - 40}
              isAnimated
              color={color}
              thickness={2}
              startFillColor={color}
              endFillColor={color}
              startOpacity={0.2}
              endOpacity={0.0}
              spacing={dynamicSpacing}
              initialSpacing={0}
              endSpacing={0}
              hideDataPoints={chartData.length > 20}
              rulesColor={global.colors.border}
              rulesType="solid"
              xAxisColor="transparent"
              yAxisColor="transparent"
              yAxisTextStyle={{ color: global.colors.textSecondary, fontSize: 11, fontWeight: '500' }}
              xAxisLabelTextStyle={{ color: global.colors.textSecondary, fontSize: 11, fontWeight: '500', width: 55, textAlign: 'center' }}
              noOfSections={5}
              maxValue={Math.max(0.1, yAxisMax - yAxisMin)}
              formatYLabel={(label) => (parseFloat(label) + yAxisMin).toFixed(2)}
              xAxisIndicesHeight={0}
              xAxisIndicesWidth={0}
              xAxisThickness={0}
              yAxisThickness={0}
              curved={false}
              areaChart
              onScroll={handleScroll}
              hideRules
            // hideYAxisText - Removed to show Y axis values
            />


            {/* Overlay Date Badge - Moved to Top */}

            {/* Overlay Maximize Icon */}
            {/* Overlay Maximize Icon */}
            <TouchableOpacity
              style={{ position: 'absolute', right: 10, bottom: 10 }}
              onPress={() =>
                openStockInfoDrawer(stock.token, stock.symbol, "placeorder", stock.isin, {
                  name: stock.name,
                  tradeable: stock.tradeable,
                  exchange: stock.exchange
                })
              }
            >
              <Maximize2 size={20} color={global.colors.textSecondary} />
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No data available</Text>
          </View>
        )}
      </View>



      {/* Intervals */}
      <View style={styles.intervalContainer}>
        {intervals.map((interval) => (
          <TouchableOpacity
            key={interval}
            style={[styles.intervalButton, selectedInterval === interval && styles.activeInterval]}
            onPress={() => setSelectedInterval(interval)}
          >
            <Text
              style={[styles.intervalText, selectedInterval === interval && styles.activeIntervalText]}
            >
              {interval}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Market Analysis / Sequence Post */}
      {/* Market Analysis / Sequence Post */}
      <SequencePost
        title={((stock.news_items && stock.news_items.length > 0) ? stock.news_items[currentNewsIndex]?.title : stock.news_title) || ""}
        content={((stock.news_items && stock.news_items.length > 0) ? stock.news_items[currentNewsIndex]?.description : stock.analysis) || ""}
        timestamp={((stock.news_items && stock.news_items.length > 0) ? stock.news_items[currentNewsIndex]?.date : "") || ""}
        showNavigation={stock.news_items && stock.news_items.length > 1}
        onNext={handleNextNews}
        onPrev={handlePrevNews}
      />

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleReaction('like')}>
          <ThumbsUp size={17} color={reaction === 'like' ? global.colors.secondary : global.colors.textSecondary} />
          <Text style={[styles.actionText, reaction === 'like' && { color: global.colors.secondary, fontWeight: 'bold' }]}>
            {likeCount || "0"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleReaction('dislike')}>
          <ThumbsDown size={17} color={reaction === 'dislike' ? global.colors.error : global.colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => setShowComments(true)}>
          <MessageCircle size={17} color={global.colors.textSecondary} />
          <Text style={styles.actionText}>{commentCount || "0"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Share2 size={17} color={global.colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => setWatchlistModalVisible(true)}>
          <Bookmark size={17} color={global.colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}
          onPress={() =>
            openStockInfoDrawer(stock.token, stock.symbol, "placeorder", stock.isin, {
              name: stock.name,
              tradeable: stock.tradeable,
              exchange: stock.exchange
            })
          }
        >
          <IndianRupee size={17} color={global.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <CommentOverlay
        visible={showComments}
        onClose={() => setShowComments(false)}
        contentId={stock.id}
        contentType={contentType}
        onCommentAdded={() => setCommentCount(prev => prev + 1)}
        onCommentDeleted={() => setCommentCount(prev => Math.max(0, prev - 1))}
      />

      <Modal
        visible={reportModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setReportModalOpen(false)}
      >
        <Animated.View style={[styles.modalOverlay, { transform: [{ translateY }] }]}>
          <View style={styles.reportCard}>
            <TouchableOpacity
              style={styles.reportClose}
              onPress={() => setReportModalOpen(false)}
            >
              <Text style={{ fontSize: 22 }}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.reportTitle}>Report {contentType === 'post' ? 'Post' : 'Stock'}</Text>
            <Text style={styles.reportSubtitle}>
              Your report helps keep the platform accurate and safe.
            </Text>

            <View style={{ position: "relative", zIndex: 10 }}>
              <Text style={styles.reportLabel}>Issue Categories</Text>
              <TouchableOpacity
                style={styles.dropdownBox}
                onPress={() => setIssueDropdownOpen(!issueDropdownOpen)}
                activeOpacity={0.7}
              >
                <Text style={{ color: issueCategory ? global.colors.secondary : global.colors.textSecondary }}>
                  {issueCategory || "Select your concern"}
                </Text>
                <Text style={{ fontSize: 16 }}>▾</Text>
              </TouchableOpacity>

              {issueDropdownOpen && (
                <View style={styles.dropdownList}>
                  {[
                    "Suspected Activity",
                    "Incorrect Data",
                    "Privacy Concern",
                    "Misleading Information",
                    "Inappropriate Content",
                    "Other Issues",
                  ].map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setIssueCategory(item);
                        setIssueDropdownOpen(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <Text style={styles.reportLabel}>Description</Text>
            <View style={styles.textAreaBox}>
              <TextInput
                placeholder="Tell us what’s wrong..."
                value={issueDescription}
                onChangeText={setIssueDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={styles.textArea}
              />

              <View style={styles.attachInside}>
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center" }}
                  onPress={pickAttachment}
                >
                  <Text style={styles.attachText}>Attach Image</Text>
                  {/* <Image source={Attach} style={styles.iconSmall2} /> */}
                </TouchableOpacity>
              </View>
            </View>
            {attachment && (
              <View style={styles.attachRow}>
                <Text style={styles.attachLabel}>Add Screenshot</Text>
                <TouchableOpacity
                  onPress={() => setAttachment(null)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={styles.attachRemove}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.reportBtnRow}>
              <TouchableOpacity
                style={styles.reportCancel}
                onPress={() => setReportModalOpen(false)}
              >
                <Text style={styles.reportCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reportSubmit}
                onPress={submitReportIssue}
              >
                <Text style={styles.reportSubmitText}>Submit Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Modal>

      <Modal
        visible={successIssueModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessIssueModalOpen(false)}
      >
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Text style={styles.successTick}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Report Submitted</Text>
            <Text style={styles.successText}>
              Thanks for bringing this to our attention. We may contact you in case more information is required.
            </Text>
            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => setSuccessIssueModalOpen(false)}
            >
              <Text style={styles.successBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        transparent
        visible={watchlistModalVisible}
        animationType="fade"
        onRequestClose={() => setWatchlistModalVisible(false)}
      >
        <Pressable style={styles.watchlistOverlay} onPress={() => setWatchlistModalVisible(false)}>
          <Pressable
            style={styles.watchlistPopup}
            onStartShouldSetResponder={() => true}
            onResponderTerminationRequest={() => false}
          >
            <View style={styles.watchlistTitleBar}>
              <Text style={styles.watchlistTitleText}>
                Add to Watchlist
              </Text>
            </View>

            {loadingWatchlists ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator size="small" color={global.colors.secondary} />
              </View>
            ) : watchlists.length > 0 ? (
              <ScrollView style={{ maxHeight: 300 }}>
                {watchlists.map((wl) => (
                  <TouchableOpacity
                    key={wl.id}
                    style={[
                      styles.watchlistRow,
                      addingToWishlist[wl.id] && { opacity: 0.6 }
                    ]}
                    disabled={addingToWishlist[wl.id]}
                    onPress={() => handleAddToWatchlist(wl)}
                  >
                    <Text style={styles.watchlistRowText}>
                      {wl.name}
                      {addingToWishlist[wl.id] && (
                        <ActivityIndicator
                          size="small"
                          color={global.colors.secondary}
                          style={{ marginLeft: 8 }}
                        />
                      )}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={{ padding: 20, alignItems: "center" }}>
                <Text style={{ color: global.colors.textSecondary, textAlign: "center" }}>
                  No watchlists found. Please create one from your profile.
                </Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View >
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: global.colors.background,
    borderRadius: 16,
    marginBottom: 5,
    shadowColor: global.colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginHorizontal: 16,
    marginVertical: 3,
    borderWidth: 1,
    borderColor: global.colors.border
  },
  cardFullScreen: {
    flex: 1, // Take full height of container
    backgroundColor: global.colors.background,
    borderRadius: 15,
    marginTop: 20,
    marginBottom: 100,
    marginHorizontal: 25,
    borderWidth: 1,
    borderColor: global.colors.border,
    elevation: 3,
    shadowColor: global.colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stockHeader: {
    backgroundColor: global.colors.surface,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopLeftRadius: 15,
    borderBottomWidth: 1,
    borderBottomColor: global.colors.border,
    borderTopRightRadius: 15,
  },
  stockInfo: { flex: 1 }, // Keep for backward compat if needed, but unused now
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },
  textColumn: {
    flexDirection: 'column',
    justifyContent: 'center',
    marginRight: 0,
    flexShrink: 1, // Allow text to wrap/truncate properly
  },
  stockName: {
    fontSize: 16,
    fontWeight: '500',
    color: global.colors.textPrimary,
    marginBottom: 4,
  },
  stockSymbol: {
    fontSize: 12,
    color: global.colors.textSecondary,
    fontWeight: '500',
  },
  // symbolContainer removed as it's no longer used
  postNumberContainer: {
    backgroundColor: global.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 'auto'
  },
  postNumberText: {
    fontSize: 11,
    color: global.colors.textSecondary,
    fontWeight: '600',
  },
  priceContainer: { flexDirection: 'row', alignItems: 'left', justifyContent: 'flex-start', border: '1px solid red' },
  price: {
    fontSize: 15,
    fontWeight: '500',
    color: global.colors.textPrimary,
  },
  change: {
    fontSize: 12,
    fontWeight: '600',
  },

  chartContainer: {
    // height: 300, 
    backgroundColor: global.colors.background,
    overflow: 'hidden',
    paddingHorizontal: 10,
    marginTop: 10
  },
  intervalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    backgroundColor: global.colors.background,
    borderTopWidth: 1,
    borderTopColor: global.colors.border,
    marginBottom: 2,
    marginTop: 5
  },
  intervalButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activeInterval: { backgroundColor: global.colors.background, borderColor: global.colors.textPrimary },
  intervalText: {
    fontSize: 12,
    fontWeight: '600',
    color: global.colors.textSecondary,
  },
  activeIntervalText: { color: global.colors.textPrimary },
  actionsContainer: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: global.colors.border,
    backgroundColor: global.colors.surface,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: {
    fontSize: 12,
    color: global.colors.textPrimary,
    fontWeight: '600',
  },
  noDataContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  noDataText: { fontSize: 14, color: global.colors.textSecondary, fontWeight: '500' },

  menuOverlay: {
    position: 'absolute',
    top: 45,
    right: 15,
    backgroundColor: global.colors.background,
    borderRadius: 12,
    padding: 10,
    shadowColor: global.colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 1000,
    minWidth: 180,
  },
  menuBackdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: 'transparent',
    zIndex: 900,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 12,
  },
  menuText: {
    fontSize: 14,
    color: global.colors.textPrimary,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: global.colors.textPrimary,
    marginHorizontal: 15,
    marginBottom: 10,
  },
  // Report Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: global.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  reportCard: {
    width: "90%",
    backgroundColor: global.colors.background,
    borderRadius: 18,
    padding: 20,
  },
  reportClose: {
    position: "absolute",
    right: 14,
    top: 14,
    zIndex: 1,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: global.colors.secondary,
    marginBottom: 4,
  },
  reportSubtitle: {
    fontSize: 13,
    color: global.colors.textSecondary,
    marginBottom: 14,
    width: 270,
  },
  reportLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: global.colors.secondary,
  },
  dropdownBox: {
    backgroundColor: global.colors.background,
    borderWidth: 1,
    borderColor: global.colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dropdownList: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: global.colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: global.colors.border,
    zIndex: 9999,
    elevation: 10,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: global.colors.border,
  },
  dropdownItemText: {
    fontSize: 14,
    color: global.colors.secondary,
  },
  textAreaBox: {
    backgroundColor: global.colors.background,
    borderWidth: 1,
    borderColor: global.colors.border,

    borderRadius: 12,
    padding: 12,
    position: "relative",
    marginBottom: 16,
  },
  textArea: {
    height: 90,
    fontSize: 14,
    color: global.colors.secondary,
    textAlignVertical: "top",
    paddingBottom: 20,
  },
  attachInside: {
    position: "absolute",
    bottom: 8,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  attachText: {
    fontSize: 12,
    color: global.colors.textSecondary,
    fontWeight: '600',
  },
  attachRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    justifyContent: 'space-between',
    paddingHorizontal: 10
  },
  attachLabel: {
    fontSize: 12,
    color: global.colors.secondary,
  },
  attachRemove: {
    fontSize: 16,
    fontWeight: "700",
    color: global.colors.error,
  },
  reportBtnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  reportCancel: {
    backgroundColor: global.colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 20,
    flex: 0.45,
    alignItems: 'center',
  },
  reportCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: global.colors.secondary,
  },
  reportSubmit: {
    backgroundColor: global.colors.secondary,
    paddingVertical: 10,
    paddingHorizontal: 26,
    borderRadius: 20,
    flex: 0.50,
    alignItems: 'center',
  },
  reportSubmitText: {
    color: global.colors.background,
    fontSize: 13,
    fontWeight: "700",
  },
  // Success Modal
  successOverlay: {
    flex: 1,
    backgroundColor: global.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  successCard: {
    width: "85%",
    backgroundColor: global.colors.background,
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 22,
    alignItems: "center",
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: global.colors.success,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  successTick: {
    fontSize: 32,
    color: global.colors.background,
    fontWeight: "bold",
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: global.colors.textPrimary,
    marginBottom: 10,
  },
  successText: {
    fontSize: 15,
    color: global.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  successBtn: {
    backgroundColor: global.colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  successBtnText: {
    color: global.colors.background,
    fontSize: 15,
    fontWeight: "600",
  },
  // / Watchlist Modal Styles
  watchlistOverlay: {
    flex: 1,
    backgroundColor: global.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  watchlistPopup: {
    width: 280,
    backgroundColor: global.colors.background,
    borderRadius: 12,
    padding: 16,
    maxHeight: 400,
  },
  watchlistTitleBar: {
    marginBottom: 12,
    alignItems: "center",
  },
  watchlistTitleText: {
    fontSize: 16,
    fontWeight: "600",
  },
  watchlistRow: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: global.colors.border,
  },
  watchlistRowText: {
    fontSize: 15,
    color: global.colors.textPrimary,
  },
});

export default StockCard;

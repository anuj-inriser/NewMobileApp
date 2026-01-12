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
  TextInput,
  Image,
  ScrollView,
  Alert,
  Share,
  useWindowDimensions,
} from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import * as ImagePicker from 'expo-image-picker';
import { useIntervalData } from '../hooks/useIntervalData';
import axios from 'axios';
import { apiUrl } from '../utils/apiUrl';
import { useAuth } from '../context/AuthContext';
import CommentOverlay from './CommentOverlay';
import SequencePost from './SequencePost';
const { width } = Dimensions.get('window');
import { useNavigation, useNavigationState } from "@react-navigation/native";

import { Asset } from 'expo-asset';

// Added postNumber prop with default "1/1"
const StockCard = ({ stock, realtimeData, userReaction, contentType, postNumber, fullScreen }) => {
  const { userId } = useAuth();
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

  const navigation = useNavigation();
  // Helper
  const truncateWords = (str, numWords) => {
    if (!str) return '';
    const words = str.split(' ');
    if (words.length <= numWords) return str;
    return words.slice(0, numWords).join(' ') + '...';
  };

  // DEBUG: Monitor Index Changes
  useEffect(() => {
    if (stock.news_items?.length > 1) {
      console.log(`[StockCard ${stock.symbol}] Index Changed: ${currentNewsIndex}. Item:`, stock.news_items[currentNewsIndex]?.title);
    }
  }, [currentNewsIndex, stock.news_items, stock.symbol]);

  const handleNextNews = useCallback(() => {
    console.log(`[StockCard ${stock.symbol}] NEXT Clicked. Current: ${currentNewsIndex}, Total: ${stock.news_items?.length}`);
    if (stock.news_items && stock.news_items.length > 0) {
      setCurrentNewsIndex((prev) => (prev + 1) % stock.news_items.length);
    }
  }, [stock.news_items, currentNewsIndex, stock.symbol]);

  const handlePrevNews = useCallback(() => {
    console.log(`[StockCard ${stock.symbol}] PREV Clicked.`);
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
    if (!userId) {
      alert('Please login to react!');
      return;
    }
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
    } catch (err) {
      console.error('Reaction failed error:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
        alert('Reaction failed: ' + JSON.stringify(err.response.data));
      } else {
        alert('Reaction failed: ' + err.message);
      }
      // Revert optimistic update
      setReaction(current);
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
      alert('Please login to report content!');
      return;
    }

    setShowMenu(false);
    setReportModalOpen(true);
  };

  const submitReportIssue = async () => {
    try {
      if (!issueCategory || !issueDescription) {
        alert("Please select category and description");
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
      console.log("❌ REPORT ERROR:", err?.response?.data || err.message);
      alert("Failed to submit issue: " + (err.response?.data?.message || err.message));
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

  const isPositive = currentChange >= 0;
  const color = isPositive ? '#22c55e' : '#ef4444';

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
      labelTextStyle: { color: '#666', width: 80, textAlign: 'center' },
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
    try {

      // Prepare the caption
      const shareMessage = `Check out ${stock.name} (${stock.symbol}) on Victory App! Current Price: ₹${currentPrice.toFixed(2)}\n\nhttps://victory.inriser.com/stock/${stock.symbol}`;

      const result = await Share.share({
        message: shareMessage,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error) {
      console.error('Share error:', error.message);
      Alert.alert('Unable to share', error.message);
    }
  };

  return (
    <View style={[styles.card, fullScreen && { flex: 1 }]}>
      {/* Header */}
      <View style={styles.stockHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.textColumn}>
            <Text style={styles.stockName}>{stock.name}</Text>
            <Text style={styles.stockSymbol}>{stock.exchange}: {stock.symbol}</Text>
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
            <MoreVertical size={20} color="#000" />
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
                <AlertCircle size={20} color="#333" />
                <Text style={[styles.menuText, { color: '#333' }]}>Report</Text>
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
              rulesColor="#E0E0E0"
              rulesType="solid"
              xAxisColor="transparent"
              yAxisColor="transparent"
              yAxisTextStyle={{ color: '#666', fontSize: 11, fontWeight: '500' }}
              xAxisLabelTextStyle={{ color: '#666', fontSize: 11, fontWeight: '500', width: 55, textAlign: 'center' }}
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
              onPress={() => navigation.navigate('AdvancedChart', { symbol: stock.symbol })}
            >
              <Maximize2 size={20} color="#666" />
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
          <ThumbsUp size={17} color={reaction === 'like' ? "#210F47" : "#666"} />
          <Text style={[styles.actionText, reaction === 'like' && { color: "#210F47", fontWeight: 'bold' }]}>
            {likeCount || "0"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleReaction('dislike')}>
          <ThumbsDown size={17} color={reaction === 'dislike' ? "#F44336" : "#666"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => setShowComments(true)}>
          <MessageCircle size={17} color="#666" />
          <Text style={styles.actionText}>{commentCount || "0"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Share2 size={17} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Bookmark size={17} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <IndianRupee size={17} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Clock size={17} color="#666" />
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
        <View style={styles.modalOverlay}>
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
                <Text style={{ color: issueCategory ? "#210F47" : "#999" }}>
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
        </View>
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
    </View >
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginHorizontal: 16,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#eee'
  },
  cardFullScreen: {
    flex: 1, // Take full height of container
    backgroundColor: '#fff',
    borderRadius: 0,
    marginBottom: 0,
    marginHorizontal: 0,
    marginVertical: 0,
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  stockHeader: {
    backgroundColor: '#f2edf9',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopLeftRadius: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    color: '#000',
    marginBottom: 4,
  },
  stockSymbol: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  // symbolContainer removed as it's no longer used
  postNumberContainer: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 'auto'
  },
  postNumberText: {
    fontSize: 11,
    color: '#555',
    fontWeight: '600',
  },
  priceContainer: { flexDirection: 'row', alignItems: 'left', justifyContent: 'flex-start', border: '1px solid red' },
  price: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  change: {
    fontSize: 12,
    fontWeight: '600',
  },

  chartContainer: {
    // height: 300, 
    backgroundColor: '#fff',
    overflow: 'hidden',
    paddingHorizontal: 10,
    marginTop: 10
  },
  intervalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginBottom: 2,
    marginTop: 5
  },
  intervalButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activeInterval: { backgroundColor: '#fff', borderColor: '#333' },
  intervalText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  activeIntervalText: { color: '#000' },
  actionsContainer: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#f2edf9',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
  },
  noDataContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  noDataText: { fontSize: 14, color: '#999', fontWeight: '500' },

  menuOverlay: {
    position: 'absolute',
    top: 45,
    right: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
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
    color: '#333',
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#000000ff',
    marginHorizontal: 15,
    marginBottom: 10,
  },
  // Report Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  reportCard: {
    width: "90%",
    backgroundColor: "#fff",
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
    color: "#210F47",
    marginBottom: 4,
  },
  reportSubtitle: {
    fontSize: 13,
    color: "#555",
    marginBottom: 14,
    width: 270,
  },
  reportLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#210F47",
  },
  dropdownBox: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#DDD",
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
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    zIndex: 9999,
    elevation: 10,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#210F47",
  },
  textAreaBox: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    padding: 12,
    position: "relative",
    marginBottom: 16,
  },
  textArea: {
    height: 90,
    fontSize: 14,
    color: "#210F47",
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
    color: "#777",
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
    color: "#210F47",
  },
  attachRemove: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ef4444",
  },
  reportBtnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  reportCancel: {
    backgroundColor: "#EAE6F2",
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 20,
    flex: 0.45,
    alignItems: 'center',
  },
  reportCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#210F47",
  },
  reportSubmit: {
    backgroundColor: "#210F47",
    paddingVertical: 10,
    paddingHorizontal: 26,
    borderRadius: 20,
    flex: 0.50,
    alignItems: 'center',
  },
  reportSubmitText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  // Success Modal
  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  successCard: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 22,
    alignItems: "center",
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  successTick: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "bold",
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 10,
  },
  successText: {
    fontSize: 15,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  successBtn: {
    backgroundColor: "#1E0A3C",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  successBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default StockCard;

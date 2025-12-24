import { useState, useRef, useCallback } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    SafeAreaView,
    StyleSheet,
    View,
    TouchableOpacity,
    Text
} from 'react-native';

import BottomTabBar from '../components/BottomTabBar';
import TopHeader from "../components/TopHeader";
import GainerLoserCard from '../components/GainerLoserCard';
import CommunitySecondMenuSlider from '../components/CommunitySecondMenuSlider';
import TopFundamentalSlider from '../components/TopFundamentalSlider';
import StockCard from '../components/StockCard';
import SequenceCard from '../components/SequenceCard';

import { useAllStocks } from '../hooks/useAllStocks';
import { useMarketMovers } from '../hooks/useMarketMovers';
import { useCommunitySequences } from '../hooks/useCommunitySequences';
import { useCommunityPosts } from '../hooks/useCommunityPosts';
import { Ionicons } from '@expo/vector-icons';

const StockTimelineScreen = () => {

    // 🔥 TOP MENU (Timeline / Posts / Messages)
    const [topTab, setTopTab] = useState("Timeline");

    // 🔥 STOCK MENU (Latest / Watchlists / Gainers / Losers)
    const [stockTab, setStockTab] = useState("Latest");

    const { stocks: allStocks, loading: stocksLoading, hasMore, loadMore } = useAllStocks(20);
    const { data: moversData, loading: moversLoading } = useMarketMovers();
    const { sequences, loading: sequencesLoading, error: sequenceError } = useCommunitySequences();

    // 🔥 SEQUENCE NAVIGATION STATE
    const [selectedSequenceId, setSelectedSequenceId] = useState(null);
    const [currentPostIndex, setCurrentPostIndex] = useState(0);
    const { posts: sequencePosts, loading: postsLoading, error: postsError } = useCommunityPosts(selectedSequenceId);

    const handlePlaySequence = (sequence) => {
        setSelectedSequenceId(sequence.id);
        setCurrentPostIndex(0);
        setTopTab("Timeline"); // Move to Timeline tab to show posts
    };

    // Helper function to get symbol from script_id
    const getSymbolFromScriptId = (scriptId) => {
        if (!scriptId) return 'Unknown Stock';
        const stock = allStocks.find(s => s.token === scriptId || String(s.token) === String(scriptId));
        return stock ? stock.symbol || stock.name : `Stock #${scriptId}`;
    };

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50
    }).current;

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setCurrentPostIndex(viewableItems[0].index || 0);
        }
    }).current;

    // Sample Watchlist (later API se aa jayega)
    const watchlistStocks = allStocks.slice(0, 10);


    // 🔥 STOCK TAB LOGIC
    const getStockData = () => {
        const defaultStats = { likes: "0", dislikes: "0", comments: "0" };

        switch (stockTab) {

            case "Latest":
                return allStocks.map(stock => ({
                    ...stock,
                    analysis: "Real-time market analysis and insights.",
                    stats: stock.stats || defaultStats
                }));

            case "Watchlists":
                return watchlistStocks.map(stock => ({
                    ...stock,
                    analysis: "Stock in your watchlist.",
                    stats: stock.stats || defaultStats
                }));

            case "Gainers":
                return (moversData?.gainers || []).map(item => ({
                    ...item,
                    stats: defaultStats   // 🟢 FIX APPLIED HERE
                }));

            case "Losers":
                return (moversData?.losers || []).map(item => ({
                    ...item,
                    stats: defaultStats   // 🟢 FIX APPLIED HERE
                }));

            default:
                return allStocks.map(stock => ({
                    ...stock,
                    analysis: "Real-time market analysis and insights.",
                    stats: stock.stats || defaultStats
                }));
        }
    };


    const stockData = getStockData();


    // 🔥 Vertical Stock Pagination Layout
    const { height: SCREEN_HEIGHT } = Dimensions.get('window');
    const ITEM_HEIGHT = SCREEN_HEIGHT - 60;

    const renderStockItem = ({ item }) => (
        <View style={{ height: ITEM_HEIGHT }}>
            <StockCard stock={item} />
        </View>
    );

    const renderGainerLoserItem = ({ item }) => (
        <GainerLoserCard
            symbol={item.symbol}
            name={item.name}
            price={item.price}
            change={item.change}
            percentChange={item.percentChange}
        />
    );


    const handleLoadMore = () => {
        if ((stockTab === 'Latest' || stockTab === 'Watchlists') && !stocksLoading && hasMore) {
            loadMore();
        }
    };


    return (
        <>
            <SafeAreaView style={styles.container}>
                <TopHeader />

                {/* 🔥 TOP TWO MENUS */}
                <View style={styles.topSliders}>

                    {/* TOP: Timeline / Posts / Messages */}
                    <CommunitySecondMenuSlider
                        activeFilter={topTab}
                        onTabChange={(t) => setTopTab(t)}
                    />

                    {/* SECOND: Latest / Watchlists / Gainers / Losers */}
                    <TopFundamentalSlider
                        selectedCategory={stockTab}
                        onTabChange={(id) => setStockTab(id)}
                    />

                </View>


                {/* 🔥 MAIN CONTENT AREA */}
                <View style={{ flex: 1, paddingBottom: 80 }}>

                    {topTab === 'Sequence' ? (
                        sequencesLoading ? (
                            <ActivityIndicator size="large" color="#210F47" style={{ marginTop: 20 }} />
                        ) : sequenceError ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: 'red' }}>Error: {sequenceError}</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={sequences || []}
                                renderItem={({ item }) => (
                                    <SequenceCard
                                        item={{
                                            ...item,
                                            title: item.sequence_name,
                                            description: item.sequence_description,
                                            rating: item.rating || 4,
                                            ratingCount: item.ratingCount || 45
                                        }}
                                        onPlay={handlePlaySequence}
                                    />
                                )}
                                keyExtractor={item => item.id.toString()}
                                contentContainerStyle={{ padding: 16 }}
                            />
                        )
                    ) : topTab === 'News' ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: '#888' }}>News feed coming soon...</Text>
                        </View>
                    ) : (stockTab === 'Gainers' || stockTab === 'Losers') ? (
                        moversLoading ? (
                            <ActivityIndicator size="large" color="#210F47" style={{ marginTop: 20 }} />
                        ) : (
                            <FlatList
                                data={stockData}
                                renderItem={renderGainerLoserItem}
                                keyExtractor={(item) => item.id || item.symbol}
                                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, marginTop: 10, }}
                                showsVerticalScrollIndicator={true}
                            />
                        )
                    ) : (
                        <View style={{ flex: 1 }}>
                            {selectedSequenceId && (
                                <TouchableOpacity
                                    style={{
                                        padding: 10,
                                        backgroundColor: '#F0EFFF',
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        zIndex: 100
                                    }}
                                    onPress={() => setSelectedSequenceId(null)}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons name="arrow-back" size={20} color="#210F47" />
                                        <Text style={{ marginLeft: 10, fontWeight: '700', color: '#210F47' }}>Viewing Sequence</Text>
                                    </View>
                                    <Ionicons name="close-circle" size={24} color="#210F47" />
                                </TouchableOpacity>
                            )}

                            {selectedSequenceId ? (
                                postsLoading ? (
                                    <ActivityIndicator size="large" color="#210F47" style={{ marginTop: 20 }} />
                                ) : (
                                    <FlatList
                                        key="sequence-posts-list"
                                        data={sequencePosts || []}
                                        renderItem={({ item, index }) => (
                                            <View style={{ height: ITEM_HEIGHT }}>
                                                <StockCard
                                                    stock={{
                                                        id: item.content_id,
                                                        name: getSymbolFromScriptId(item.content_script_id),
                                                        symbol: `POST ${index + 1}/${sequencePosts.length}`,
                                                        price: 430.92,
                                                        ltp: 430.92,
                                                        change: 45.30,
                                                        changePercent: 11.77,
                                                        analysis: item.content || 'Stocks continue upward trend as investors show confidence amid strong earnings reports.',
                                                        stats: {
                                                            likes: '20.9k',
                                                            dislikes: '0',
                                                            comments: '23'
                                                        }
                                                    }}
                                                />
                                            </View>
                                        )}
                                        keyExtractor={(item) => item.content_id.toString()}
                                        pagingEnabled
                                        snapToAlignment="start"
                                        decelerationRate="fast"
                                        snapToInterval={ITEM_HEIGHT}
                                        onViewableItemsChanged={onViewableItemsChanged}
                                        viewabilityConfig={viewabilityConfig}
                                        showsVerticalScrollIndicator={false}
                                    />
                                )
                            ) : (
                                <FlatList
                                    key="stock-timeline-list"
                                    data={stockData}
                                    renderItem={renderStockItem}
                                    keyExtractor={(item) => item.id}
                                    pagingEnabled
                                    snapToAlignment="start"
                                    decelerationRate="fast"
                                    snapToInterval={ITEM_HEIGHT}
                                    getItemLayout={(data, index) => ({
                                        length: ITEM_HEIGHT,
                                        offset: ITEM_HEIGHT * index,
                                        index,
                                    })}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={{ paddingHorizontal: 0 }}
                                    onEndReached={handleLoadMore}
                                    onEndReachedThreshold={0.5}
                                    ListFooterComponent={
                                        stocksLoading ? (
                                            <ActivityIndicator size="small" color="#210F47" style={{ padding: 20 }} />
                                        ) : null
                                    }
                                />
                            )}
                        </View>
                    )}

                </View>
            </SafeAreaView>

            <BottomTabBar />
        </>
    );
};


const styles = StyleSheet.create({
    topSliders: {
        backgroundColor: "#fff",
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        marginTop: -3,
        paddingTop: 3
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    }
});

export default StockTimelineScreen;

import { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    SafeAreaView,
    StyleSheet,
    View
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

const StockTimelineScreen = () => {

    // 🔥 TOP MENU (Timeline / Posts / Messages)
    const [topTab, setTopTab] = useState("Timeline");

    // 🔥 STOCK MENU (Latest / Watchlists / Gainers / Losers)
    const [stockTab, setStockTab] = useState("Latest");

    const { stocks: allStocks, loading: stocksLoading, hasMore, loadMore } = useAllStocks(20);
    const { data: moversData, loading: moversLoading } = useMarketMovers();

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
                        <FlatList
                            data={[
                                { id: '1', title: '25 Stocks Moving Fast on High Volume and Price Breakouts' },
                                { id: '2', title: '15 Stocks Surging Due to Strong Price and Volume Action' },
                                { id: '3', title: '20 Stocks Gaining Momentum on Fresh Market Triggers' },
                            ]}
                            renderItem={({ item }) => <SequenceCard title={item.title} />}
                            keyExtractor={item => item.id}
                            contentContainerStyle={{ padding: 16 }}
                        />
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
                        <FlatList
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

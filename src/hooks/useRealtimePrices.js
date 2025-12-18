import { useEffect, useRef, useState, useCallback } from 'react';
import { wsUrl } from '../utils/apiUrl';

/**
 * useRealtimePrices - Hook for real-time price updates via WebSocket
 * 
 * Connects to the backend WebSocket and maintains a map of symbol -> price data.
 * Optimized for indices display - updates LTP and percentage without chart refresh.
 * 
 * @returns {Object} { prices, isConnected, getPrice }
 * - prices: Map of symbol -> { price, change, changePercent, open, high, low, close }
 * - isConnected: Boolean indicating WebSocket connection status
 * - getPrice: Function to get price data for a specific symbol
 */
export const useRealtimePrices = () => {
    const [prices, setPrices] = useState({});
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef(null);
    const reconnectTimer = useRef(null);

    // Throttling: specific ref to hold latest data without triggering re-renders
    const latestPricesRef = useRef({});
    const intervalRef = useRef(null);
 
    // Connect to WebSocket
    const connect = useCallback(() => {
        try {
            const WS_URL = `ws://${wsUrl}/ws/prices`;
            console.log(`[RealtimePrices] Attempting to connect to: ${WS_URL}`);

            ws.current = new WebSocket(WS_URL);

            ws.current.onopen = () => {
                console.log('✅ [RealtimePrices] WebSocket Connected');
                setIsConnected(true);
            };

            ws.current.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);

                    // Handle price updates
                    if (message.type === 'price' && message.data) {
                        const { symbol, value, open, high, low, close, ts } = message.data;

                        if (!symbol || value === undefined) return;

                        // Update ref ONLY (no re-render yet)
                        const prevData = latestPricesRef.current[symbol];
                        const prevClose = prevData?.prevClose || open || value;

                        // Calculate change and percent
                        const change = value - prevClose;
                        const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

                        latestPricesRef.current[symbol] = {
                            price: value,
                            change,
                            changePercent,
                            open,
                            high,
                            low,
                            close,
                            prevClose: prevData?.prevClose || open || value, // Keep prev close stable
                            timestamp: ts || new Date() // Use backend timestamp
                        };
                    }
                } catch (err) {
                    // Ignore parse errors for ping/pong messages
                }
            };

            ws.current.onerror = (error) => {
                // Log full error details
                console.log('❌ [RealtimePrices] WebSocket Error:', error);
                if (error.message) console.log('Error Message:', error.message);
            };

            ws.current.onclose = (e) => {
                console.log(`🔄 [RealtimePrices] WebSocket Closed (Code: ${e.code}, Reason: ${e.reason}) - Reconnecting...`);
                setIsConnected(false);
                scheduleReconnect();
            };

        } catch (error) {
            console.error('[RealtimePrices] Connection error:', error);
            scheduleReconnect();
        }
    }, []);

    // Schedule reconnection
    const scheduleReconnect = useCallback(() => {
        if (reconnectTimer.current) return;

        reconnectTimer.current = setTimeout(() => {
            reconnectTimer.current = null;
            connect();
        }, 3000);
    }, [connect]);

    // Get price for a specific symbol
    const getPrice = useCallback((symbol) => {
        return prices[symbol] || null;
    }, [prices]);

    // Initialize connection and throttling interval
    useEffect(() => {
        connect();

        // THROTTLING: Update state every 1 second (1000ms)
        // This makes the UI smooth like MoneyControl/TradingView, avoiding rapid jitters.
        intervalRef.current = setInterval(() => {
            // Only update if we have data
            if (Object.keys(latestPricesRef.current).length > 0) {
                setPrices(prev => ({
                    ...prev,
                    ...latestPricesRef.current
                }));
            }
        }, 1000);

        return () => {
            if (reconnectTimer.current) {
                clearTimeout(reconnectTimer.current);
            }
            if (ws.current) {
                ws.current.close();
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [connect]);

    return { prices, isConnected, getPrice };
};

export default useRealtimePrices;

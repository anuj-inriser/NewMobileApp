import { useEffect, useRef, useState, useCallback } from 'react';
import { wsUrl } from '../utils/apiUrl';
export const useRealtimePrices = () => {
    const [prices, setPrices] = useState({});
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef(null);
    const reconnectTimer = useRef(null);
    const latestPricesRef = useRef({});
    const intervalRef = useRef(null);

    const connect = useCallback(() => {
        try {
            const WS_URL = `ws://${wsUrl}/ws/prices`;

            ws.current = new WebSocket(WS_URL);

            ws.current.onopen = () => {
                console.log('✅ [RealtimePrices] WebSocket Connected');
                setIsConnected(true);
            };

            ws.current.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);

                    if (message.type === 'price' && message.data) {
                        const { symbol, value, open, high, low, close, ts } = message.data;

                        if (!symbol || value === undefined) return;

                        const prevData = latestPricesRef.current[symbol];
                        const prevClose = prevData?.prevClose || open || value;

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
                            prevClose: prevData?.prevClose || open || value,
                            timestamp: ts || new Date()
                        };
                    }
                } catch (err) {
                }
            };

            ws.current.onerror = (error) => {
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

    const scheduleReconnect = useCallback(() => {
        if (reconnectTimer.current) return;

        reconnectTimer.current = setTimeout(() => {
            reconnectTimer.current = null;
            connect();
        }, 3000);
    }, [connect]);

    const getPrice = useCallback((symbol) => {
        return prices[symbol] || null;
    }, [prices]);

    useEffect(() => {
        connect();
        intervalRef.current = setInterval(() => {
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
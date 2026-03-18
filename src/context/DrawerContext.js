import React, { createContext, useContext, useState } from "react";

const DrawerContext = createContext();

export const DrawerProvider = ({ children }) => {
  const [activeDrawer, setActiveDrawer] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);
  const [selectedIsin, setSelectedIsin] = useState(null)
  const [defaultTab, setDefaultTab] = useState(null); // which tab to open in StockInfoView

  const isProfileDrawerOpen = activeDrawer === 'profile';
  const isNotificationDrawerOpen = activeDrawer === 'notification';
  const isStockInfoDrawerOpen = activeDrawer === 'stockinfo';

  const toggleProfileDrawer = () =>
    setActiveDrawer((prev) => (prev === 'profile' ? null : 'profile'));
  const openProfileDrawer = () => setActiveDrawer('profile');
  const closeProfileDrawer = () =>
    setActiveDrawer((prev) => (prev === 'profile' ? null : prev));

  const toggleNotificationDrawer = () =>
    setActiveDrawer((prev) => (prev === 'notification' ? null : 'notification'));
  const openNotificationDrawer = () => setActiveDrawer('notification');
  const closeNotificationDrawer = () =>
    setActiveDrawer((prev) => (prev === 'notification' ? null : prev));

  const [drawerMetadata, setDrawerMetadata] = useState({});

  // tab: optional tab id to open ('placeorder', 'chart', etc.)
  const openStockInfoDrawer = (token, symbol, tab = null, isin, metadata = {}) => {
    if (symbol) setSelectedSymbol(symbol);
    if (token) setSelectedToken(token);
    if (isin) setSelectedIsin(isin)
    setDefaultTab(tab);
    setDrawerMetadata(metadata);
    setActiveDrawer('stockinfo');
  };

  const closeStockInfoDrawer = () => {
    setActiveDrawer((prev) => (prev === 'stockinfo' ? null : prev));
    setDrawerMetadata({});
  };

  return (
    <DrawerContext.Provider
      value={{
        isProfileDrawerOpen,
        toggleProfileDrawer,
        openProfileDrawer,
        closeProfileDrawer,
        isNotificationDrawerOpen,
        toggleNotificationDrawer,
        openNotificationDrawer,
        closeNotificationDrawer,
        isStockInfoDrawerOpen,
        openStockInfoDrawer,
        closeStockInfoDrawer,
        selectedSymbol,
        selectedToken,
        setSelectedSymbol,
        setSelectedToken,
        setSelectedIsin,
        selectedIsin,
        defaultTab,       // ← which tab StockInfoView should open on
        drawerMetadata,   // ← metadata like entry, target, sl
      }}
    >
      {children}
    </DrawerContext.Provider>
  );
};

export const useDrawer = () => {
  const context = useContext(DrawerContext);
  if (!context) throw new Error("useDrawer must be used within a DrawerProvider");
  return context;
};

import React, { createContext, useContext, useState, useCallback } from 'react';

const WatchlistContext = createContext({
  refreshTrigger: 0,
  triggerRefresh: () => {},
});

export const WatchlistProvider = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback((wishlistId) => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <WatchlistContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlistRefresh = () => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlistRefresh must be used within WatchlistProvider');
  }
  return context;
};

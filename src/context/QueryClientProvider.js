import React from "react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { queryClient } from "../utils/queryClient";

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  throttleTime: 3000, // Sync to disk every 3 seconds max
});

export const AppQueryProvider = ({ children }) => {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ 
          persister: asyncStoragePersister,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours persistence
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
};

// src/context/QueryClientProvider.js
import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../utils/queryClient";

export const AppQueryProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

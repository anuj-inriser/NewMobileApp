import { configureStore } from "@reduxjs/toolkit";
import permissionReducer from "./permissionSlice";

export const store = configureStore({
  reducer: {
    permissions: permissionReducer,
  },
});

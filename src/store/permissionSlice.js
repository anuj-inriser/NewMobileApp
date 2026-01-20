import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../api/axios";

/**
 * Fetch permissions using roleId from token (backend reads JWT)
 */
export const fetchPermissions = createAsyncThunk(
  "permissions/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/me/permissions");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

const permissionSlice = createSlice({
  name: "permissions",
  initialState: {
    data: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearPermissions: (state) => {
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPermissions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPermissions } = permissionSlice.actions;
export default permissionSlice.reducer;

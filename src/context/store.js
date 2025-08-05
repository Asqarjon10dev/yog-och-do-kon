// 📁 src/app/store.js
import { configureStore } from "@reduxjs/toolkit";
import { api } from "../context/api"; // umumiy api
import { SalaryHistoryApi } from "../context/salaryHistoryApi";

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    [SalaryHistoryApi.reducerPath]: SalaryHistoryApi.reducer, // ✅ bu qo‘shildi
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware, SalaryHistoryApi.middleware), // ✅ bu ham qo‘shildi
});

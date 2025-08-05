// 📁 context/SalaryHistoryApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const SalaryHistoryApi = createApi({
  reducerPath: "salaryHistoryApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getSalaryHistory: builder.query({
        query: ({ role, employeeId }) => {
          if (role === "admin") {
            return `/salary/history`; // Admin barcha tarixni ko‘radi
          } else {
            return `/salary/history?employeeId=${employeeId}`; // Faqat o‘zini ko‘radi
          }
        },
      }),
      
  }),
});

export const { useGetSalaryHistoryQuery } = SalaryHistoryApi;

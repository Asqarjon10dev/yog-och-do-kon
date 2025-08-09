import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    // baseUrl: "http://localhost:5000/api",
    baseUrl: "https://yogoch-dokon-backend.vercel.app/api",
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json"); // ✅ MUHIM QATOR
    
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
    
      return headers;
    },
    
  }),
  tagTypes: ["Product", "Sale", "Expense", "Debt", "Login", "Attendance"],
  endpoints: () => ({}), // modulda qo‘shiladi
});
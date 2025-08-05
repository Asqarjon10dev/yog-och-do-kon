import { api } from "./api"; // asosiy RTK base API

export const saleApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // 🟢 Sotuv qo‘shish
    addSale: builder.mutation({
      query: (body) => ({
        url: "/sale/add",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Sales"],
    }),

    // 🟡 Barcha sotuvlar
    getAllSales: builder.query({
      query: () => "/sale/all",
      providesTags: ["Sales"],
    }),
  }),
});

export const { useAddSaleMutation, useGetAllSalesQuery } = saleApi;

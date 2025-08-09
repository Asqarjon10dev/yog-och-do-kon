import { api } from "./api"; // asosiy api faylingiz

export const debtApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAllDebts: builder.query({
      query: () => "/debtAll",
    }),
    deleteDebt: builder.mutation({
      query: (id) => ({
        url: `/debtDelete/${id}`,
        method: "DELETE",
      }),
    }),
    payDebt: builder.mutation({
      query: ({ id, amount }) => ({
        url: `/payDebt/${id}`,
        method: "PATCH",
        body: { amount }, // endi bu joyga to'g'ri qiymat tushadi
      }),
      invalidatesTags: ["Debt"],
    }),
    bulkPayDebts: builder.mutation({
      query: (debtIds) => ({
        url: "/payDebtAll",
        method: "POST",
        body: { debtIds }, // qarzlar ro'yxatini yuboradi
      }),
      invalidatesTags: ["Debt"],
    }),
    
  }),
});

export const { useGetAllDebtsQuery, useDeleteDebtMutation, usePayDebtMutation, useBulkPayDebtsMutation } = debtApi;
import { api } from "./api";

export const debtApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAllDebts: builder.query({
      query: () => "/debt/all",
      providesTags: ["Debts"],
    }),
    addDebt: builder.mutation({
      query: (body) => ({
        url: "/debt/add",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Debts"],
    }),
    payDebt: builder.mutation({
      query: ({ id, amount }) => ({
        url: `/debt/pay/${id}`,
        method: "PATCH",
        body: { amount }, // ✅ To‘g‘ri nom
      }),
      invalidatesTags: ["Debts"],
    }),
  }),
});

export const { useGetAllDebtsQuery, useAddDebtMutation, usePayDebtMutation } = debtApi;

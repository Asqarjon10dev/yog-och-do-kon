import { api } from "./api";

export const expenseApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAllExpenses: builder.query({
      query: () => "/expenseAll",
      providesTags: ["Expense"],
    }),
    addExpense: builder.mutation({
      query: (body) => ({
        url: "/expenseAdd",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Expense"],
    }),
    deleteExpense: builder.mutation({
      query: (id) => ({
        url: `/expenseDelete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Expense"],
    }),
    getExpenseStats : builder.query({
      query: () => "/expenseStats",
      providesTags: ["ExpenseStats"],
    }), 
    expenseFilter: builder.query({
      query: (params) => ({
        url: "/expenseFilter",
        method: "POST",
        body: params,
      }),
      providesTags: ["Expense"],
    }),
  }),
});

export const {
  useGetAllExpensesQuery,
  useAddExpenseMutation,
  useDeleteExpenseMutation,
  useGetExpenseStatsQuery
} = expenseApi;
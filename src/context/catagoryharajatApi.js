// context/catagoryharajatApi.js
import { api } from "./api";

export const expenseCategoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Barcha kategoriyalar
    getExpenseCategories: builder.query({
      query: () => "/harajatCategoriesAll",
      providesTags: (result) => [{ type: "ExpenseCategory", id: "LIST" }],
    }),

    // Yangi kategoriya qo'shish
    addExpenseCategory: builder.mutation({
      query: (body) => ({
        url: "/harajatCategoryAddCategory",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "ExpenseCategory", id: "LIST" }],
    }),
  }),
});

export const {
  useGetExpenseCategoriesQuery,
  useAddExpenseCategoryMutation,
} = expenseCategoryApi;

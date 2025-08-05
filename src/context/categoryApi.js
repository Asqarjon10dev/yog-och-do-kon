// frontend/context/categoryApi.js
import { api } from "./api";

export const categoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    addCategory: builder.mutation({
      query: (newCategory) => ({
        url: "/category/add",
        method: "POST",
        body: newCategory,
      }),
      invalidatesTags: ["Category"],
    }),
    getAllCategories: builder.query({
      query: () => "/category/all",
      providesTags: ["Category"],
    }),
    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `/category/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Category"],
    }),
  }),
});

export const {
  useAddCategoryMutation,
  useGetAllCategoriesQuery,
  useDeleteCategoryMutation,
} = categoryApi;

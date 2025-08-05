// src/context/ProductApi.js
import { api } from "./api"; // umumiy RTK baseApi

export const ProductApi = api.injectEndpoints({
  endpoints: (builder) => ({
    addProduct: builder.mutation({
      query: (body) => ({
        url: "/product/add",
        method: "POST",
        body,
      }),
    }),
    getAllProducts: builder.query({
      query: () => "/product/all",
    }),
    updateProduct: builder.mutation({
      query: ({ id, body }) => ({
        url: `/product/update/${id}`,
        method: "PUT",
        body,
      }),
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/product/delete/${id}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const { useAddProductMutation, useGetAllProductsQuery, useUpdateProductMutation, useDeleteProductMutation } = ProductApi;

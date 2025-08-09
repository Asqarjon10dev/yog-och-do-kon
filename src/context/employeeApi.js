// 📁 context/employeeApi.js
import { api } from "./api";

  export const employeeApi = api.injectEndpoints({
    endpoints: (builder) => ({
      getAllEmployees: builder.query({
        query: () => "/employee/all",
        providesTags: ["Employees"],
      }),
  
      getSalaryHistory: builder.query({
        query: (params) => ({ url: "/employee/salaryHistory", method: "GET", params }),
        providesTags: ["SalaryHistory"],
      }),
  
      getAdvanceHistory: builder.query({
        query: () => ({ url: "/employee/advance/history", method: "GET" }),
        providesTags: ["AdvanceHistory"],
      }),
  
      addEmployee: builder.mutation({
        query: (data) => ({ url: "/employee/add", method: "POST", body: data }),
        invalidatesTags: ["Employees"],
      }),
  
      giveSalary: builder.mutation({
        query: (data) => ({ url: "/employee/salary", method: "POST", body: data }),
        invalidatesTags: ["SalaryHistory", "Employees"],
      }),
  
      giveAdvance: builder.mutation({
        query: (data) => ({ url: "/employee/advance", method: "POST", body: data }),
        invalidatesTags: ["AdvanceHistory", "Employees"],
      }),
useEmployeeLoginMutation: builder.mutation({
  query: (data) => ({
    url: "/employee/login",
    method: "POST",
    body: data,
  }),
  invalidatesTags: ["Employees"],
})

   
    }),

  }); 


export const {
  useAddEmployeeMutation,
  useGetAllEmployeesQuery,
  useGiveSalaryMutation,
  useGetSalaryHistoryQuery,
  useEmployeeLoginMutation,
  useGetSalaryByEmployeeIdQuery,
  // ⬇️ Yangi hooklar
  useGiveAdvanceMutation,
  useGetAdvanceHistoryQuery,
} = employeeApi;

import { api } from "./api";

export const employeeApi = api.injectEndpoints({
  endpoints: (builder) => ({
    addEmployee: builder.mutation({
      query: (data) => ({
        url: "/employee/add",
        method: "POST",
        body: data,
      }),
    }),
    getAllEmployees: builder.query({
      query: () => "/employee/all",
    }),
    giveSalary: builder.mutation({
      query: (data) => ({
        url: "/employee/salary",
        method: "POST",
        body: data,
      }),
    }),
    getSalaryHistory: builder.query({
      query: (params) => ({
        url: "/employee/salaryHistory",
        method: "GET",
        params,
      }),
    }),
    employeeLogin: builder.mutation({
      query: (body) => ({
        url: "/employee/login",
        method: "POST",
        body,
      }),
    }),
    
// 📁 context/employeeApi.js
// 📁 context/employeeApi.js yoki salaryApi.js
getSalaryByEmployeeId: builder.query({
  query: (employeeId) => `/salary/by-employee/${employeeId}`,
}),


  }),
});

export const {
  useAddEmployeeMutation,
  useGetAllEmployeesQuery,
  useGiveSalaryMutation,
  useGetSalaryHistoryQuery,
  useEmployeeLoginMutation,
  useGetSalaryByEmployeeIdQuery
} = employeeApi;

import { api } from "./api";

export const employeeApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // 🔐 Employee login — KALIT NOMI MUHIM!
    employeeLogin: builder.mutation({
      query: (data) => ({
        url: "/employee/login",
        method: "POST",
        body: data,
      }),
      // invalidatesTags: ["Employees"], // ixtiyoriy
    }),

    getAllEmployees: builder.query({
      query: () => "/employee/all",
      providesTags: ["Employees"],
    }),

    getSalaryHistory: builder.query({
      query: (params) => ({ url: "/employee/salaryHistory", method: "GET", params }),
      providesTags: ["SalaryHistory"],
    }),

    getSalaryByEmployeeId: builder.query({
      query: (employeeId) => ({ url: `/employee/salaryHistory/${employeeId}`, method: "GET" }),
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

    updateEmployeeSalary: builder.mutation({
      query: ({ id, salary }) => ({
        url: `/employee/update/${id}`,
        method: "PUT",
        body: { salary },
      }),
      invalidatesTags: ["Employees"],
    }),
    
  }),
});

export const {
  // 🔐 shu hook endi mavjud bo‘ladi
  useEmployeeLoginMutation,

  useAddEmployeeMutation,
  useGetAllEmployeesQuery,
  useGiveSalaryMutation,
  useGetSalaryHistoryQuery,
  useGetSalaryByEmployeeIdQuery,
  useUpdateEmployeeSalaryMutation,
  useGiveAdvanceMutation,
  useGetAdvanceHistoryQuery,
} = employeeApi;

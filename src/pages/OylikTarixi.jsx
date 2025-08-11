// 📁 src/pages/OylikTarixi.jsx
import React, { useMemo } from "react";
import { Table, Typography } from "antd";
import {
  useGetSalaryHistoryQuery,
  useGetSalaryByEmployeeIdQuery,
} from "../context/employeeApi";

const OylikTarixi = () => {
  const role = localStorage.getItem("role");          // "admin" | "employee" ...
  const employeeId = localStorage.getItem("employeeId");

  // Har doim hooklar chaqiriladi
  const { data: allData, isLoading: isLoadingAll } = useGetSalaryHistoryQuery();
  const { data: mineData, isLoading: isLoadingMine } =
    useGetSalaryByEmployeeIdQuery(employeeId, { skip: !employeeId });

  // Admin hammasini ko‘radi, employee faqat o‘zini
  const isAdmin = role === "admin";
  const raw = isAdmin ? allData?.innerData : mineData?.innerData;

  const rows = useMemo(() => (raw || []).map((r, i) => ({ ...r, key: r._id || i })), [raw]);
  const loading = isAdmin ? isLoadingAll : isLoadingMine;

  // Ishchi uchun faqat 2 ustun
  const employeeColumns = [
    { title: "Ism", render: (r) => r.employeeId?.fullName || "–" },
    { title: "Ish turi", render: (r) => r.employeeId?.jobType?.toUpperCase() || "–" },
    { title: "Oy", render: (r) => `${r.month}.${r.year}` },
    { title: "Summasi (so‘m)", dataIndex: "amount" },
    {
      title: "Berilgan sana",
      render: (r) => (r?.date ? new Date(r.date).toLocaleString() : "–"),
    },
  ];
  
  // Admin uchun xodim tafsilotlari ham ko‘rinadi
  const adminColumns = [
    { title: "Ism", render: (r) => r.employeeId?.fullName || "–" },
    { title: "Telefon", render: (r) => r.employeeId?.phone || "–" },
    { title: "Summasi (so‘m)", dataIndex: "amount" },
    {
      title: "Sana",
      render: (r) => (r?.date ? new Date(r.date).toLocaleString() : "–"),
    },
  ];

  return (
    <div>
      <Typography.Title level={3}>Oylik tarixi</Typography.Title>
      <Table
        columns={isAdmin ? adminColumns : employeeColumns}
        dataSource={rows}
        loading={loading}
        rowKey="key"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default OylikTarixi;

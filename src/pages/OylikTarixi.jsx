// 📁 src/pages/OylikTarixi.jsx
import React from "react";
import { Table, Typography, Tag } from "antd";
import {
  useGetSalaryHistoryQuery,
  useGetSalaryByEmployeeIdQuery,
} from "../context/employeeApi";
import  formatDate from "../utils/formatDate";


const OylikTarixi = () => {
  const role = localStorage.getItem("role");
  const employeeId = localStorage.getItem("employeeId");

  // 🟢 HAR DOIM HOOK'lar chaqiriladi (shart ichida emas!)
  const { data: allData, isLoading: isLoadingAll } = useGetSalaryHistoryQuery();
  const {
    data: employeeData,
    isLoading: isLoadingEmployee,
  } = useGetSalaryByEmployeeIdQuery(employeeId);

  // 🟡 SHU YERDA role asosida tanlab olamiz
  const data =
    role === "admin" || role === "menejer" ? allData : employeeData;
  const isLoading =
    role === "admin" || role === "menejer"
      ? isLoadingAll
      : isLoadingEmployee;

  const roleColors = {
    admin: "volcano",
    menejer: "blue",
    oylik: "green",
    dagavor: "orange",
  };

  const columns = [
    {
      title: "Ism",
      render: (item) => item.employeeId?.fullName || "–",
    },
    {
      title: "Telefon",
      render: (item) => item.employeeId?.phone || "–",
    },
    {
      title: "Ish turi",
      render: (item) =>
        item.employeeId?.jobType ? (
          <Tag color={roleColors[item.employeeId.jobType]}>
            {item.employeeId.jobType.toUpperCase()}
          </Tag>
        ) : (
          "–"
        ),
    },
    {
      title: "Summasi",
      dataIndex: "amount",
    },
    {
      title: "Vaqt",
      render: (item) => formatDate(item.date),
    }
  ];

  return (
    <div>
      <Typography.Title level={3}>Oylik tarixi</Typography.Title>

      <Table
        columns={columns}
        dataSource={data?.innerData || []}
        loading={isLoading}
        rowKey="_id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default OylikTarixi;

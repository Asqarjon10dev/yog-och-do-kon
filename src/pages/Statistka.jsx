// 📁 src/pages/Statistika.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Row,
  Col,
  Card,
  Typography,
  Button,
  Space,
  Divider,

  Statistic,
  Tag,
} from "antd";
import { Line, Column } from "@ant-design/plots";
import dayjs from "dayjs";
import { useGetAllSalesQuery } from "../context/saleApi";
import { useNavigate } from "react-router-dom";
import { CloseOutlined } from "@ant-design/icons";

const { Title } = Typography;

const Statistika = () => {
  const { data, isLoading } = useGetAllSalesQuery();
  const sales = data?.innerData || [];
  const navigate = useNavigate();

  // 🧠 Bugungi statistika
  const today = dayjs().format("YYYY-MM-DD");
  const todaySales = useMemo(
    () =>
      sales.filter((s) =>
        dayjs(s.saleDate).format("YYYY-MM-DD") === today
      ),
    [sales]
  );

  const lineData = useMemo(() => {
    const grouped = {};
    sales.forEach((s) => {
      const month = dayjs(s.saleDate).format("MMM");
      if (!grouped[month]) grouped[month] = { total: 0, profit: 0 };
  
      grouped[month].total += s.totalAmount;
      grouped[month].profit += s.totalAmount - s.products.reduce(
        (sum, p) => sum + p.price * p.quantity, 0
      );
    });
    return Object.entries(grouped).map(([month, { total, profit }]) => [
      { month, value: total, type: "Sotuv" },
      { month, value: profit, type: "Foyda" },
    ]).flat();
  }, [sales]);
  

  const weeklySales = useMemo(() => {
    return sales.filter((s) =>
      dayjs(s.saleDate).isAfter(dayjs().subtract(7, "day"))
    );
  }, [sales]);

  const dailySales = useMemo(() => {
    const grouped = {};
    sales.forEach((s) => {
      const day = dayjs(s.saleDate).format("YYYY-MM-DD");
      if (!grouped[day]) grouped[day] = 0;
      grouped[day] += s.totalAmount;
    });
    return Object.entries(grouped).map(([date, value]) => ({ date, value }));
  }, [sales]);

  const lineConfig = {
    data: lineData,
    xField: "month",
    yField: "value",
    seriesField: "type",
    smooth: true,
    height: 300,
    color: ["#1677ff", "#f759ab"],
    meta: {
      value: {
        formatter: (val) => `${(val / 1000).toFixed(1)}k so'm`,
      },
    },
    yAxis: {
      label: {
        formatter: (val) => `${(val / 1000).toFixed(0)}k`,
      },
    },
  };
  const barConfig = {
    data: dailySales,
    xField: "date",
    yField: "value",
    height: 300,
    color: "#722ed1",
    meta: {
      value: {
        formatter: (val) => `${(val / 1000).toFixed(1)}k so'm`,
      },
    },
    yAxis: {
      label: {
        formatter: (val) => `${(val / 1000).toFixed(0)}k`,
      },
    },
  };
  
  

  const weeklyTotal = weeklySales.reduce((sum, s) => sum + s.totalAmount, 0);
  const todayTotal = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
  const todaySold = todaySales.reduce((sum, s) => sum + s.products.reduce((x, p) => x + p.quantity, 0), 0);
  const todayReturns = 0; // static
  const picked = todaySold - todayReturns;
  const inTransit = Math.floor(picked / 2);



  return (
    <div>
           <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
             <Col>
               <Typography.Title level={3}>Statistika</Typography.Title>
             </Col>
             <Col>
               <Button
                 type="text"
                 icon={<CloseOutlined style={{ fontSize: 20 }} />}
                 onClick={() => navigate("/")}
               />
             </Col>
           </Row>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="Bugungi Savdo" value={todayTotal} suffix="so'm" />
            <Divider />
            <Row>
              <Col span={12}>Sotildi: <Tag>{todaySold}</Tag></Col>
              <Col span={12}>Qaytdi: <Tag>{todayReturns}</Tag></Col>
              <Col span={12}>Yig‘ildi: <Tag>{picked}</Tag></Col>
              <Col span={12}>Yetkazilmoqda: <Tag>{inTransit}</Tag></Col>
            </Row>
          </Card>
        </Col>

        <Col span={6}>
          <Card>
            <Statistic
              title="Haftalik Savdo"
              value={weeklyTotal}
              suffix="so'm"
            />
            <Divider />
            <Tag color="success">+14%</Tag>
          </Card>
        </Col>

        <Col span={6}>
          <Card>
            <Statistic title="Qarzga" value={sales.filter(s => s.paymentType === 'qarz').length} suffix="ta" />
            <Divider />
            <Statistic title="Naqd/Karta" value={sales.filter(s => s.paymentType !== 'qarz').length} suffix="ta" />
          </Card>
        </Col>

        <Col span={6}>
          <Card>
            <Statistic title="Naqd" value={sales.filter(s => s.paymentType === 'naqd').length} suffix="ta" />
            <Divider />
            <Statistic title="Karta" value={sales.filter(s => s.paymentType === 'karta').length} suffix="ta" />
          </Card>
        </Col>
      </Row>

      <Divider />

      <Row gutter={16}>
        <Col span={12}>
          <Card title="Oylik Sotuv va Foyda">
            <Line {...lineConfig} />
          </Card>
        </Col>

        <Col span={12}>
          <Card title="Oxirgi kunlik savdolar">
            <Column {...barConfig} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Statistika;

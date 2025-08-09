// src/pages/SalesStats.jsx
import React, { useMemo } from "react";
import { Card, Button, Row, Col, Typography, Table } from "antd";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useGetAllSalesQuery } from "../context/saleApi";
import { CloseOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

dayjs.extend(isBetween);
const Text = Typography.Text;

/* ================== Helper functions (declare BEFORE use) ================== */

// Kub hajmi (m³) — paymentType bo‘yicha
// 1) to'lov turi bo'yicha kub
const sumKubByPayment = (sales = [], paymentType) =>
  sales
    .filter(s => s.paymentType === paymentType)
    .reduce((tot, s) => {
      const perSale = (s.products || []).reduce((t, p) => {
        let kub = Number(p.kub || 0);
        if (!kub) {
          kub = Number(p.length || 0) * Number(p.width || 0) * Number(p.height || 0);
        }
        return t + kub; // <-- unit sharti olib tashlandi
      }, 0);
      return tot + perSale;
    }, 0);

// 2) eng faol mijozlar ro'yxatida kub yig'ish
const buildTopCustomers = (sales = []) => {
  const map = new Map();
  for (const s of sales) {
    const key = `${s.customerName}-${s.customerPhone}`;
    const totalMoney = (s.products || []).reduce(
      (t, p) => t + Number(p.price || 0) * Number(p.quantity || 0),
      0
    );
    const totalKub = (s.products || []).reduce((t, p) => {
      let kub = Number(p.kub || 0);
      if (!kub) {
        kub = Number(p.length || 0) * Number(p.width || 0) * Number(p.height || 0);
      }
      return t + kub; // <-- unit sharti olib tashlandi
    }, 0);

    const cur = map.get(key) || { name: s.customerName, phone: s.customerPhone, total: 0, totalKub: 0 };
    cur.total += totalMoney;
    cur.totalKub += totalKub;
    map.set(key, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
};


// USD bo‘yicha jami va foyda
const sumUSD = (arr = []) =>
  arr.reduce(
    (tot, s) =>
      tot +
      (s.products || []).reduce(
        (t, p) =>
          t +
          (p.currency === "$"
            ? Number(p.price || 0) * Number(p.quantity || 0)
            : 0),
        0
      ),
    0
  );

const profitUSD = (arr = []) =>
  arr.reduce(
    (tot, s) =>
      tot +
      (s.products || []).reduce(
        (t, p) =>
          t +
          (p.currency === "$"
            ? (Number(p.price || 0) - Number(p.cost || 0)) *
              Number(p.quantity || 0)
            : 0),
        0
      ),
    0
  );

/* ================== Component ================== */

const SalesStats = () => {
  const { data, isLoading } = useGetAllSalesQuery();
  const sales = data?.innerData || [];

  const navigate = useNavigate();

  // Davrlar
  const today = dayjs();
  const weekStart = today.subtract(7, "day").startOf("day");
  const weekEnd = today.endOf("day");

  const salesToday = useMemo(
    () => sales.filter((s) => dayjs(s.createdAt).isSame(today, "day")),
    [sales, today]
  );
  const salesWeek = useMemo(
    () =>
      sales.filter((s) =>
        dayjs(s.createdAt).isBetween(weekStart, weekEnd, null, "[]")
      ),
    [sales, weekStart, weekEnd]
  );

  // USD kartalar
  const dayUSD = useMemo(() => sumUSD(salesToday), [salesToday]);
  const dayPUSD = useMemo(() => profitUSD(salesToday), [salesToday]);
  const weekUSD = useMemo(() => sumUSD(salesWeek), [salesWeek]);
  const weekPUSD = useMemo(() => profitUSD(salesWeek), [salesWeek]);

  // Kublar
  const naqdKub = useMemo(() => sumKubByPayment(sales, "naqd"), [sales]);
  const qarzKub = useMemo(() => sumKubByPayment(sales, "qarz"), [sales]);

  // Eng faol mijozlar
  const topCustomers = useMemo(() => buildTopCustomers(sales), [sales]);

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Statistika
          </Typography.Title>
        </Col>
        <Col>
          <Button
            type="text"
            icon={<CloseOutlined style={{ fontSize: 20 }} />}
            onClick={() => navigate("/")}
          />
        </Col>
      </Row>

      {/* Yuqori qator: 3 ta blok */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {/* Bugungi */}
        <Col xs={24} lg={8}>
          <Card bordered style={{ height: 120 }}>
            <Row gutter={16}>
              <Col span={12} style={{ textAlign: "center" }}>
                <Text strong>Bugungi savdo</Text>
                <div style={{ fontSize: 18, marginTop: 8 }}>
                  {dayUSD.toLocaleString()} $
                </div>
              </Col>
              <Col span={12} style={{ textAlign: "center" }}>
                <Text strong>Bugungi foyda</Text>
                <div style={{ fontSize: 18, marginTop: 8 }}>
                  {dayPUSD.toLocaleString()} $
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Haftalik */}
        <Col xs={24} lg={8}>
          <Card bordered style={{ height: 120 }}>
            <Row gutter={16}>
              <Col span={12} style={{ textAlign: "center" }}>
                <Text strong>Haftalik Savdo</Text>
                <div style={{ fontSize: 18, marginTop: 8 }}>
                  {weekUSD.toLocaleString()} $
                </div>
              </Col>
              <Col span={12} style={{ textAlign: "center" }}>
                <Text strong>Haftalik foyda</Text>
                <div style={{ fontSize: 18, marginTop: 8 }}>
                  {weekPUSD.toLocaleString()} $
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Naqd/Qarz kub */}
        <Col xs={24} lg={8}>
          <Card bordered style={{ height: 120 }}>
            <Row gutter={16}>
              <Col span={12} style={{ textAlign: "center" }}>
                <Text strong>Naqdga</Text>
                <div style={{ fontSize: 18, marginTop: 8 }}>
                  {naqdKub.toLocaleString()} m³
                </div>
                <Text type="secondary">kub</Text>
              </Col>
              <Col span={12} style={{ textAlign: "center" }}>
                <Text strong>Qarzga</Text>
                <div style={{ fontSize: 18, marginTop: 8 }}>
                  {qarzKub.toLocaleString()} m³
                </div>
                <Text type="secondary">kub</Text>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Eng faol xaridorlar */}
      <Card
        bordered
        title={<div style={{ textAlign: "center" }}>Eng faol haridorlar</div>}
      >
        <Table
          loading={isLoading}
          dataSource={topCustomers}
          rowKey={(r, i) => i}
          columns={[
            {
              title: "№",
              render: (_, __, i) => i + 1,
              width: 60,
              align: "center",
            },
            { title: "F.I.Sh", dataIndex: "name" },
            { title: "Tel", dataIndex: "phone" },
            {
              title: "Kub (m³)",
              dataIndex: "totalKub",
              align: "right",
              render: (v) => Number(v || 0).toLocaleString()  + " m³",
            },
            {
              title: "Jami xarid",
              dataIndex: "total",
              align: "right",
              render: (v) => `${Number(v).toLocaleString()} $`,
            },
          ]}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
        />
      </Card>
    </div>
  );
};

export default SalesStats;

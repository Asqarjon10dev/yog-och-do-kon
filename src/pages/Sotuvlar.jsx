// 📁 src/pages/SalesHistory.jsx
import React, { useMemo, useState } from "react";
import {
  Card,
  Table,
  DatePicker,
  Select,
  Typography,
  Row,
  Button,
  Col,
  Input,
  Modal,
  Space,
  Tooltip,
} from "antd";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useGetAllSalesQuery } from "../context/saleApi";
import { FaEye } from "react-icons/fa";
import { CloseOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

dayjs.extend(isBetween);
dayjs.extend(utc);
dayjs.extend(timezone);

const { RangePicker } = DatePicker;

const SalesHistory = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useGetAllSalesQuery();
  const sales = data?.innerData || [];

  // UI state
  const [dateRange, setDateRange] = useState(null);
  const [paymentFilter, setPaymentFilter] = useState("all"); // all | naqd | qarz | karta
  const [searchTerm, setSearchTerm] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCustomerSales, setSelectedCustomerSales] = useState([]);

  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [customerSales, setCustomerSales] = useState([]);

  const [topListModal, setTopListModal] = useState(false);

  const [selectedCustomerKey, setSelectedCustomerKey] = useState(null);

  // ---------- Helpers: USD only ----------
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

  // ---------- 1) FILTERED SALES (must come first!) ----------
  const filteredSales = useMemo(() => {
    if (!sales.length) return [];
    const q = searchTerm.trim().toLowerCase();
    return sales.filter((sale) => {
      const matchPayment =
        paymentFilter === "all" || sale.paymentType === paymentFilter;

      const matchDate =
        !dateRange ||
        (dayjs(sale.createdAt).isAfter(dayjs(dateRange[0]).startOf("day")) &&
          dayjs(sale.createdAt).isBefore(dayjs(dateRange[1]).endOf("day")));

      const matchSearch =
        !q ||
        (sale.customerName || "").toLowerCase().includes(q) ||
        (sale.customerPhone || "").includes(searchTerm);

      return matchPayment && matchDate && matchSearch;
    });
  }, [sales, paymentFilter, dateRange, searchTerm]);

  // ---------- 2) Stats ranges ----------
  const targetSales = dateRange ? filteredSales : sales;
  const today = dayjs();
  const weekStart = today.subtract(7, "day").startOf("day");
  const weekEnd = today.endOf("day");

  const dailySales = useMemo(
    () => targetSales.filter((s) => dayjs(s.createdAt).isSame(today, "day")),
    [targetSales, today]
  );
  const weeklySales = useMemo(
    () =>
      targetSales.filter((s) =>
        dayjs(s.createdAt).isBetween(weekStart, weekEnd, null, "[]")
      ),
    [targetSales, weekStart, weekEnd]
  );

  // ---------- 3) USD-only totals ----------
  const totalUSD = useMemo(() => sumUSD(targetSales), [targetSales]);
  const totalPUSD = useMemo(() => profitUSD(targetSales), [targetSales]);
  const weekUSD = useMemo(() => sumUSD(weeklySales), [weeklySales]);
  const weekPUSD = useMemo(() => profitUSD(weeklySales), [weeklySales]);
  const dayUSD = useMemo(() => sumUSD(dailySales), [dailySales]);
  const dayPUSD = useMemo(() => profitUSD(dailySales), [dailySales]);

  // ---------- 4) Top customers list ----------
  

  // ---------- 5) Latest sale per customer for table ----------
  const latestSalesPerCustomer = useMemo(() => {
    const map = new Map();
    for (const s of [...filteredSales].reverse()) {
      const key = `${s.customerName}-${s.customerPhone}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          customerName: s.customerName || "-",
          customerPhone: s.customerPhone || "-",
          products: [],
          paymentType: s.paymentType,
          createdAt: s.createdAt,
        });
      }
      (s.products || []).forEach((p) => {
        map.get(key).products.push({
          productName: p.name,
          model: p.model || "-",
          quantity: p.quantity,
          price: p.price,
          currency: p.currency,
          total: p.price * p.quantity,
          cost: p.cost || 0,
          profit: (p.price - (p.cost || 0)) * p.quantity,
          paymentType: s.paymentType,
          createdAt: s.createdAt,
        });
      });
    }
    return Array.from(map.values());
  }, [filteredSales]);

  // ---------- 6) Customer selector options ----------
  const uniqueCustomers = useMemo(() => {
    const map = new Map();
    sales.forEach((s) => {
      const key = `${s.customerName}-${s.customerPhone}`;
      if (!map.has(key)) {
        map.set(key, {
          label: `${s.customerName || "-"} (${s.customerPhone || "-"})`,
          value: key,
        });
      }
    });
    return Array.from(map.values());
  }, [sales]);

  // ---------- 7) Handlers ----------
  const handleViewDetails = (record) => {
    setSelectedCustomerSales(record.products || []);
    setModalVisible(true);
  };

  const handleCustomerSelect = (key) => {
    setSelectedCustomerKey(key);
    if (!key) return;

    const [name, phone] = key.split("-");
    const matched = sales.filter(
      (s) => s.customerName === name && s.customerPhone === phone
    );

    const list = [];
    matched.forEach((s) => {
      (s.products || []).forEach((p) => {
        list.push({
          productName: p.name,
          model: p.model || "-",
          quantity: p.quantity,
          price: p.price,
          currency: p.currency,
          total: p.price * p.quantity,
          cost: p.cost || 0,
          profit: (p.price - (p.cost || 0)) * p.quantity,
          paymentType: s.paymentType,
          createdAt: s.createdAt,
        });
      });
    });

    setCustomerSales(list);
    setCustomerModalVisible(true);
  };

  // ---------- 8) Columns ----------
  const mainColumns = [
    { title: "F.I.Sh", dataIndex: "customerName" },
    { title: "Tel", dataIndex: "customerPhone" },
    {
      title: "Mahsulot",
      render: (r) => r.products?.[0]?.productName || "-",
    },
    {
      title: "Soni",
      render: (r) => r.products?.[0]?.quantity ?? "-",
      align: "right",
    },
    {
      title: "Narxi",
      render: (r) =>
        r.products?.[0]?.price != null
          ? `${Number(r.products[0].price).toLocaleString()} ${
              r.products[0].currency || ""
            }`
          : "-",
      align: "right",
    },
    {
      title: "Jami",
      render: (r) =>
        r.products?.[0]?.total != null
          ? `${Number(r.products[0].total).toLocaleString()} ${
              r.products[0].currency || ""
            }`
          : "-",
      align: "right",
    },
    {
      title: "Foyda",
      render: (r) =>
        r.products?.[0]?.profit != null
          ? `${Number(r.products[0].profit).toLocaleString()} ${
              r.products[0].currency || ""
            }`
          : "-",
      align: "right",
    },
    {
      title: "Amal",
      render: (r) => (
        <Tooltip title="Barcha mahsulotlarni ko‘rish">
          <FaEye
            onClick={() => handleViewDetails(r)}
            style={{ cursor: "pointer" }}
          />
        </Tooltip>
      ),
      align: "center",
      width: 60,
    },
  ];

  const detailsColumns = [
    { title: "Mahsulot", dataIndex: "productName" },
    { title: "Narx", dataIndex: "price", render: (v, r) => `${Number(v).toLocaleString()} ${r.currency || ""}`, align: "right" },
    { title: "Soni", dataIndex: "quantity", align: "right" },
    {
      title: "Umumiy",
      render: (r) =>
        r.price && r.quantity
          ? `${(r.price * r.quantity).toLocaleString()} ${r.currency || ""}`
          : "-",
      align: "right",
    },
    {
      title: "Foyda",
      render: (r) =>
        r.profit != null
          ? `${Number(r.profit).toLocaleString()} ${r.currency || ""}`
          : "-",
      align: "right",
    },
    { title: "To‘lov", dataIndex: "paymentType" },
    {
      title: "Sana",
      dataIndex: "createdAt",
      render: (v) => (v ? dayjs(v).local().format("DD.MM.YYYY HH:mm") : "-"),
    },
  ];

  return (
    <div>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Sotuvlar Tarixi
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

      {/* Filters */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Input
            placeholder="Ism yoki telefon"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} md={8}>
          <Select
            value={paymentFilter}
            onChange={setPaymentFilter}
            style={{ width: "100%" }}
            options={[
              { label: "Barchasi", value: "all" },
              { label: "Naqd", value: "naqd" },
              { label: "Qarz", value: "qarz" },
              { label: "Karta", value: "karta" },
            ]}
          />
        </Col>
        <Col xs={24} md={8}>
          <RangePicker
            style={{ width: "100%" }}
            value={dateRange}
            onChange={setDateRange}
            allowClear
          />
        </Col>

        <Col xs={24} md={8}>
          <Select
            showSearch
            allowClear
            placeholder="Mijozni tanlang"
            style={{ width: "100%" }}
            options={uniqueCustomers}
            value={selectedCustomerKey}
            onChange={handleCustomerSelect}
            filterOption={(input, option) =>
              (option?.label || "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        </Col>

     
      </Row>

      {/* USD-only stats */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          {[
            { title: "Umumiy", sum: totalUSD, profit: totalPUSD },
            { title: "Haftalik", sum: weekUSD, profit: weekPUSD },
            { title: "Kunlik", sum: dayUSD, profit: dayPUSD },
          ].map((x, i) => (
            <Col span={8} key={i}>
              <Typography.Text type="secondary">
                {x.title} summa
              </Typography.Text>
              <div>
                <strong>{x.sum.toLocaleString()} $</strong>
              </div>
              <Typography.Text type="secondary">
                {x.title} foyda
              </Typography.Text>
              <div>
                <strong>{x.profit.toLocaleString()} $</strong>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Main table */}
      <Table
        dataSource={latestSalesPerCustomer}
        columns={mainColumns}
        loading={isLoading}
        rowKey="key"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
        }}
      />

      {/* Top customers modal */}


      {/* Selected customer list modal */}
      <Modal
        title="Tanlangan mijoz savdolari"
        open={customerModalVisible}
        onCancel={() => setCustomerModalVisible(false)}
        footer={null}
        width={900}
      >
        <Table
          dataSource={customerSales}
          columns={detailsColumns}
          rowKey={(r, i) => i}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
        />
      </Modal>

      {/* Clicked row details modal */}
      <Modal
        title="Mijoz mahsulotlari"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={900}
      >
        <Table
          dataSource={selectedCustomerSales}
          columns={detailsColumns}
          rowKey={(r, i) => i}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
        />
      </Modal>
    </div>
  );
};

export default SalesHistory;

// 📁 src/pages/SalesHistory.jsx
import React, { useState, useMemo } from "react";
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
} from "antd";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useGetAllSalesQuery } from "../context/saleApi";
import { FaEye } from "react-icons/fa";
import { CloseOutlined } from "@ant-design/icons"; // yuqoriga qo‘shing
import { useNavigate } from "react-router-dom"; 

dayjs.extend(isBetween);
const { RangePicker } = DatePicker;

const SalesHistory = () => {
  const { data, isLoading } = useGetAllSalesQuery();
  const sales = data?.innerData || [];

  const [dateRange, setDateRange] = useState(null);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCustomerSales, setSelectedCustomerSales] = useState([]);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [customerSales, setCustomerSales] = useState([]);
  const [topCustomerModal, setTopCustomerModal] = useState(false);
  const [topCustomerData, setTopCustomerData] = useState([]);
  const [selectedCustomerKey, setSelectedCustomerKey] = useState(null);
  const [topListModal, setTopListModal] = useState(false);
  const [topCustomers, setTopCustomers] = useState([]);
  const navigate = useNavigate();


  

  

  const filteredSales = useMemo(() => {
    if (!sales || sales.length === 0) return [];
    return sales.filter((sale) => {
      const matchPayment = paymentFilter === "all" || sale.paymentType === paymentFilter;
      const matchDate =
        !dateRange ||
        (dayjs(sale.createdAt).isAfter(dayjs(dateRange[0]).startOf("day")) &&
          dayjs(sale.createdAt).isBefore(dayjs(dateRange[1]).endOf("day")));
      const matchSearch =
        sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customerPhone?.includes(searchTerm);
      return matchPayment && matchDate && matchSearch;
    });
  }, [sales, paymentFilter, dateRange, searchTerm]);

  const topCustomer = useMemo(() => {
    if (!filteredSales || filteredSales.length === 0) return [];
  
    const totals = {};
  
    filteredSales.forEach((sale) => {
      const key = `${sale.customerName}-${sale.customerPhone}`;
      const total = sale.products.reduce(
        (sum, p) => sum + p.price * p.quantity,
        0
      );
  
      if (!totals[key]) {
        totals[key] = {
          name: sale.customerName,
          phone: sale.customerPhone,
          total: 0,
        };
      }
  
      totals[key].total += total;
    });
  
    // Eng ko‘p harid qilganlarni kamayish tartibida chiqaramiz
    return Object.values(totals).sort((a, b) => b.total - a.total);
  }, [filteredSales]);
  

  const handleTopCustomerClick = () => {
    setTopListModal(true);

    const topSales = filteredSales.filter(
      (s) =>
        s.customerName === topCustomer.name &&
        s.customerPhone === topCustomer.phone
    );

    const result = [];
    topSales.forEach((s) => {
      s.products.forEach((p) => {
        result.push({
          productName: p.name,
          model: p.model,
          price: p.price,
          quantity: p.quantity,
          currency: p.currency,
          total: p.price * p.quantity,
          cost: p.cost || 0,
          profit: (p.price - (p.cost || 0)) * p.quantity,
          paymentType: s.paymentType,
          createdAt: s.createdAt,
        });
      });
    });

    setTopCustomerData(result);
    setTopCustomerModal(true);
  };

  const handleCustomerSelect = (key) => {
    setSelectedCustomerKey(key);
    if (!key) return;

    const [name, phone] = key.split("-");
    const matchedSales = sales.filter(
      (s) => s.customerName === name && s.customerPhone === phone
    );

    const productList = [];
    matchedSales.forEach((s) => {
      s.products.forEach((p) => {
        productList.push({
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

    setCustomerSales(productList);
    setCustomerModalVisible(true);
  };

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

  const calculateSums = (salesData) => {
    const result = { uzs: 0, usd: 0 };
    salesData.forEach((sale) => {
      sale.products.forEach((p) => {
        const total = p.price * p.quantity;
        if (p.currency === "so'm") result.uzs += total;
        else if (p.currency === "$") result.usd += total;
      });
    });
    return result;
  };

  const calculateProfit = (salesData) => {
    const result = { uzs: 0, usd: 0 };
    salesData.forEach((sale) => {
      sale.products.forEach((p) => {
        const profit = (p.price - (p.cost || 0)) * p.quantity;
        if (p.currency === "so'm") result.uzs += profit;
        else if (p.currency === "$") result.usd += profit;
      });
    });
    return result;
  };

  const targetSales = dateRange ? filteredSales : sales;
  const today = dayjs();
  const weekStart = today.subtract(7, "day").startOf("day");
  const weekEnd = today.endOf("day");

  const dailySales = targetSales.filter((s) =>
    dayjs(s.createdAt).isSame(today, "day")
  );
  const weeklySales = targetSales.filter((s) =>
    dayjs(s.createdAt).isBetween(weekStart, weekEnd, null, "[]")
  );

  const totalSum = calculateSums(targetSales);
  const totalProfit = calculateProfit(targetSales);
  const dailySum = calculateSums(dailySales);
  const dailyProfit = calculateProfit(dailySales);
  const weeklySum = calculateSums(weeklySales);
  const weeklyProfit = calculateProfit(weeklySales);

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
      s.products.forEach((p) => {
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

  const handleViewDetails = (record) => {
    setSelectedCustomerSales(record.products);
    setModalVisible(true);
  };

  return (
    <div >
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
          onClick={() => navigate("/")} // bu yerga asosiy sahifani yo‘liga yo‘naltiring
        />
      </Col>
    </Row>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Input
            placeholder="Ism yoki telefon"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
        <Col xs={24} md={8}>
          <Select
            value={paymentFilter}
            onChange={setPaymentFilter}
            style={{ width: "100%" }}
          >
            <Select.Option value="all">Barchasi</Select.Option>
            <Select.Option value="naqd">Naqd</Select.Option>
            <Select.Option value="qarz">Qarz</Select.Option>
            <Select.Option value="karta">Karta</Select.Option>
          </Select>
        </Col>
        <Col xs={24} md={8}>
          <RangePicker
            style={{ width: "100%" }}
            value={dateRange}
            onChange={(val) => setDateRange(val)}
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
    option.label.toLowerCase().includes(input.toLowerCase())
  }
/>

</Col>
<Col>
    <Button
      type="primary"
      onClick={handleTopCustomerClick}
      disabled={!topCustomer}
    >
      Eng faol mijozni ko‘rish
    </Button>
  </Col>

      </Row>

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          {[{
            title: "Umumiy",
            sum: totalSum,
            profit: totalProfit
          }, {
            title: "Haftalik",
            sum: weeklySum,
            profit: weeklyProfit
          }, {
            title: "Kunlik",
            sum: dailySum,
            profit: dailyProfit
          }].map((item, i) => (
            <Col span={8} key={i}>
              <Typography.Text type="secondary">{item.title} summa</Typography.Text>
              <div>
                <strong>{item.sum.uzs.toLocaleString()} so'm</strong><br />
                <strong>{item.sum.usd.toLocaleString()} $</strong>
              </div>
              <Typography.Text type="secondary">{item.title} foyda</Typography.Text>
              <div>
                <strong>{item.profit.uzs.toLocaleString()} so'm</strong><br />
                <strong>{item.profit.usd.toLocaleString()} $</strong>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Table
        dataSource={latestSalesPerCustomer}
        columns={[
          {
            title: "F.I.Sh",
            dataIndex: "customerName",
          },
          {
            title: "Tel",
            dataIndex: "customerPhone",
          },
          {
            title: "Mahsulot",
            render: (r) => r.products?.[0]?.productName || "-",
          },
          {
            title: "Soni",
            render: (r) => r.products?.[0]?.quantity || "-",
          },
          {
            title: "Narxi",
            render: (r) => r.products?.[0]?.price != null
              ? `${r.products[0].price.toLocaleString()} ${r.products[0].currency}`
              : "-",
          },
          {
            title: "Jami",
            render: (r) => r.products?.[0]?.total != null
              ? `${r.products[0].total.toLocaleString()} ${r.products[0].currency}`
              : "-",
          },
          {
            title: "Foyda",
            render: (r) => r.products?.[0]?.profit != null
              ? `${r.products[0].profit.toLocaleString()} ${r.products[0].currency}`
              : "-",
          },
          {
            title: "Amal",
            render: (r) => (
              <FaEye onClick={() => handleViewDetails(r)} style={{ cursor: "pointer" }} />
            ),
          },
        ]}
        pagination={{ pageSize: 10 }}
        rowKey="key"
      />
    <Modal
  open={topListModal}
  onCancel={() => setTopListModal(false)}
  footer={null}
  title="🏆 Eng faol xaridorlar"
  width={800}
>
  <Table
    columns={[
      { title: "№", dataIndex: "index", render: (_, __, i) => i + 1 },
      { title: "F.I.Sh", dataIndex: "name" },
      { title: "Tel", dataIndex: "phone" },
      {
        title: "Jami xarid",
        dataIndex: "total",
        render: (text) => text.toLocaleString() + " so'm",
      },
    ]}
    dataSource={topCustomer}
    rowKey={(record, i) => i}
    pagination={{
      pageSize: 10,
      showSizeChanger: true,
      pageSizeOptions: ["10", "20", "50", "100"],
    }}
  />
</Modal>

      <Modal
  title="Tanlangan mijoz savdolari"
  open={customerModalVisible}
  onCancel={() => setCustomerModalVisible(false)}
  footer={null}
  width={800}
>
  <Table
    dataSource={customerSales}
    columns={[
      { title: "Mahsulot", dataIndex: "productName" },
      { title: "Narx", dataIndex: "price" },
      { title: "Soni", dataIndex: "quantity" },
      {
        title: "Umumiy",
        render: (r) =>
          r.price && r.quantity
            ? `${(r.price * r.quantity).toLocaleString()} ${r.currency}`
            : "-",
      },
      {
        title: "Foyda",
        render: (r) =>
          r.profit != null
            ? `${r.profit.toLocaleString()} ${r.currency || ""}`
            : "-",
      },
      { title: "To‘lov", dataIndex: "paymentType" },
      { title: "Sana", dataIndex: "createdAt" },
    ]}
    pagination={false}
    rowKey={(r, i) => i}
/>
</Modal>


      <Modal
        title="Mijoz mahsulotlari"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
  width={800} // 👉 Kattalashtirish
  style={{
    top: 40,
    borderRadius: 10,
    padding: "20px",
  }}
      >
        <Table
          dataSource={selectedCustomerSales}
          columns={[
            { title: "Mahsulot", dataIndex: "productName" },
            { title: "Narx", dataIndex: "price" },
            { title: "Soni", dataIndex: "quantity" },
            {
              title: "Umumiy",
              render: (r) => r.price != null && r.quantity != null
                ? `${(r.price * r.quantity).toLocaleString()} ${r.currency || ""}`
                : "-",
            },
            {
              title: "Foyda",
              render: (r) => r.profit != null
                ? `${r.profit.toLocaleString()} ${r.currency || ""}`
                : "-",
            },
            { title: "To‘lov", dataIndex: "paymentType" },
            { title: "Sana", dataIndex: "createdAt" },
          ]}
          pagination={false}
          rowKey={(r, i) => i}
        />
      </Modal>
    </div>
  );
};

export default SalesHistory;
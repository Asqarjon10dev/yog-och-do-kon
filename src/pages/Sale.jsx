// 📄 Home.jsx – Form bo‘limi to‘liq tuzilgan, "ko'z" ikonchasi bilan optimallashtirilgan
import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Button,
  Typography,
  Tag,
  Radio,
  Popconfirm,
  Space,
  InputNumber,
  Form,
  Input,
  Select,
  Row,
  Col,
  DatePicker,
  Divider,
  Modal,
} from "antd";
import { useGetAllProductsQuery, useDeleteProductMutation } from "../context/productApi";
import { useAddSaleMutation } from "../context/saleApi";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { FaEye } from "react-icons/fa";
import "./Sale.css";
import { useMediaQuery } from "react-responsive";

import { EyeOutlined } from "@ant-design/icons";


const Home = () => {
  const { data, isLoading, refetch } = useGetAllProductsQuery();
  const [deleteProduct] = useDeleteProductMutation();
  const [addSale] = useAddSaleMutation();
  const [searchTerm, setSearchTerm] = useState(""); // 🔍 qidiruv matni
  const [modalVisible, setModalVisible] = useState(false);
  const [viewedItem, setViewedItem] = useState(null);
  
  const [filterType, setFilterType] = useState("all");
  const [selectedList, setSelectedList] = useState([]);
  const [form] = Form.useForm();
  const [exchangeRate, setExchangeRate] = useState(null);
  const [viewProduct, setViewProduct] = useState(null); // ko'z modal uchun
  

  


// 🆕 Modal holati
const [viewModal, setViewModal] = useState(false);
const [selectedProduct, setSelectedProduct] = useState(null);

// 🆕 Ekran o‘lchamini aniqlash
const [isMobile, setIsMobile] = useState(window.innerWidth <= 840);

useEffect(() => {
  const handleResize = () => setIsMobile(window.innerWidth <= 840);
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);

// 🆕 Mahsulotni ko‘rish
const showProductDetails = (record) => {
  setSelectedProduct(record);
  setViewModal(true);
};

// 🆕 Katta ekran uchun ustunlar
const fullColumns = [
  { title: "Nomi", dataIndex: "name", key: "name" },
  { title: "Kodi", dataIndex: "code", key: "code" },
  { title: "Kategoriya", dataIndex: "category", key: "category" },
  {
    title: "Hajm (kub)",
    dataIndex: "height",
    key: "height",
    render: (text) => `${text?.toFixed(3)} m³`,
  },
  { title: "Miqdor", dataIndex: "quantity", key: "quantity" },
  {
    title: "O‘lcham (m)",
    key: "size",
    render: (record) => (
      <span>
        {record.width || "-"} x {record.height || "-"} x {record.length || "-"}
      </span>
    ),
  },
  {
    title: "Narxi",
    dataIndex: "sellPrice",
    key: "sellPrice",
    render: (_, record) => {
      const currency = record.currency === "$" ? "$" : "so'm";
      return `${record.sellPrice} ${currency}`;
    },
  },
  {
    title: "Umumiy",
    key: "total",
    render: (_, record) => `${calculateTotal(record).toLocaleString()} so'm`,
  },
  {
    title: "Amallar",
    key: "action",
    render: (_, record) => (
      <Space>
        <Button type="primary" onClick={() => handleSelectProduct(record)}>
          Tanlash
        </Button>
      </Space>
    ),
  },
];

// 🆕 Kichik ekran uchun ustunlar
const mobileColumns = [
  { title: "Nomi", dataIndex: "name", key: "name" },
  { title: "Kodi", dataIndex: "code", key: "code" },
  {
    title: "Kub",
    dataIndex: "height",
    key: "height",
    render: (text) => `${text?.toFixed(3)} m³`,
  },
  {
    title: "Amal",
    key: "action",
    render: (_, record) => (
      <Space>
        <Button type="primary" onClick={() => handleSelectProduct(record)}>
          Tanlash
        </Button>
        <Button icon={<EyeOutlined />} onClick={() => showProductDetails(record)} />
      </Space>
    ),
  },
];


  const fetchRate = async () => {
    try {
      const res = await fetch("https://cbu.uz/oz/arkhiv-kursov-valyut/json/USD/");
      const data = await res.json();
      const rate = parseFloat(data[0]?.Rate || "0");
      setExchangeRate(rate);
    } catch (err) {
      console.error("💵 Kursni olishda xatolik:", err);
    }
  };

  useEffect(() => {
    fetchRate();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!data?.innerData) return [];
  
    let products = data.innerData;
  
    if (filterType === "low") {
      products = products.filter((p) => p.quantity <= 5 && p.quantity > 0);
    } else if (filterType === "finished") {
      products = products.filter((p) => p.quantity === 0);
    }
  
    // 🔍 Qidiruv (nom yoki kod bo‘yicha)
    if (searchTerm.trim() !== "") {
      products = products.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  
    return products;
  }, [data, filterType, searchTerm]);
  

  const handleSelectProduct = (product) => {
    if (selectedList.find((item) => item._id === product._id)) {
      toast.info("Bu mahsulot allaqachon tanlangan");
      return;
    }
    setSelectedList([
      ...selectedList,
      {
        ...product,
        quantity: 1,
        currency: product.currency,
        unit: product.unit,
      },
    ]);
  };

  const updateSelectedItem = (code, field, value) => {
    setSelectedList((prev) =>
      prev.map((item) => (item.code === code ? { ...item, [field]: value } : item))
    );
  };

  const removeSelectedItem = (code) => {
    setSelectedList((prev) => prev.filter((item) => item.code !== code));
  };

  const handleCurrencyChange = (index, newCurrency) => {
    const updated = [...selectedList];
    updated[index].currency = newCurrency;
    setSelectedList(updated);
  };

  const calculateTotal = (item) => {
    if (!exchangeRate) return 0;
    const price = item.currency === "$" ? item.sellPrice * exchangeRate : item.sellPrice;
    const count =
      item.unit === "kub"
        ? ((item.width * item.height * item.length) / 1_000_000_000) * item.quantity
        : item.quantity;
    return price * count;
  };

  const totalAmountAll = selectedList.reduce((sum, item) => sum + calculateTotal(item), 0);

  const onFinish = async (values) => {
    const prepared = selectedList.map((item) => {
      const kub = item.unit === "kub"
        ? ((item.width * item.height * item.length) / 1_000_000_000) * item.quantity
        : 0;
      return {
        productId: item._id,
        name: item.name,
        code: item.code,
        category: item.category,
        unit: item.unit,
        quantity: item.quantity,
        kub,
        price: item.sellPrice,
        currency: item.currency,
        cost: item.price,
      };
    });

    const paidAmount = values.paidAmount;
    const dueAmount = totalAmountAll - paidAmount;

    const payload = {
      products: prepared,
      paymentType: dueAmount > 0 ? "qarz" : "naqd",
      paidAmount,
      totalAmount: totalAmountAll,
      dueAmount,
      dueDate: dueAmount > 0 ? values.dueDate : undefined,
      customerName: values.customerName,
      customerPhone: values.customerPhone,
    };

    const res = await addSale(payload);
    if (res?.data?.state) {
      toast.success("Sotuv bajarildi");
      refetch();
      setSelectedList([]);
      form.resetFields();
    } else {
      toast.error(res?.data?.message || "Xatolik yuz berdi");
    }
  };

  const columns = [
    { title: "Nomi", dataIndex: "name", key: "name" },
    { title: "Kodi", dataIndex: "code", key: "code" },
    { title: "Kategoriya", dataIndex: "category", key: "category" },
    {
      title: "Hajm (kub)",
      dataIndex: "height",
      key: "height",
      render: (text) => `${text?.toFixed(3)} m³`,
    },
    {
      title: "Miqdor",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "O‘lcham (m)",
      key: "size",
      render: (record) => (
        <span>
          {record.width || "-"} x {record.height || "-"} x {record.length || "-"}
        </span>
      ),
    },
    {
      title: "Narxi",
      dataIndex: "sellPrice",
      key: "sellPrice",
      render: (_, record) => `${record.sellPrice} ${record.currency || "so'm"}`,
    },
    {
      title: "Umumiy",
      key: "total",
      render: (_, record) => `${calculateTotal(record).toLocaleString()} so'm`,
    },
    {
      title: "Amallar",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button type="primary" onClick={() => handleSelectProduct(record)}>
            Tanlash
          </Button>
          <Button icon={<FaEye />} onClick={() => setViewProduct(record)} />
        </Space>
      ),
    },
  ];

  return (
    <div className="responsive-container">
      <Typography.Title level={2}>Mahsulotlar</Typography.Title>
      <Row
  gutter={[16, 16]}
  style={{
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  }}
>
  <Col xs={24} sm={12} md={8}>
    <Input
      placeholder="🔍 Mahsulot nomi yoki kodi"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      style={{
        width: "100%",
        fontSize: isMobile ? "14px" : "16px",
        padding: isMobile ? "6px" : "10px",
      }}
    />
  </Col>

  <Col>
    <Radio.Group
      value={filterType}
      onChange={(e) => setFilterType(e.target.value)}
      style={{ flexWrap: "wrap" }}
    >
      <Radio.Button value="all">Barchasi</Radio.Button>
      <Radio.Button value="low">Kam qolgan</Radio.Button>
      <Radio.Button value="finished">Tugagan</Radio.Button>
    </Radio.Group>
  </Col>
</Row>

      <Table
  dataSource={filteredProducts}
  columns={isMobile ? mobileColumns : fullColumns}
  rowKey="_id"
  loading={isLoading}
  pagination={{ pageSize: 6 }}
/>

      {/* Ko'z ikonasi uchun modal */}
      <Modal
  open={viewModal}
  onCancel={() => setViewModal(false)}
  footer={null}
  title="Mahsulot tafsilotlari"
>
  {selectedProduct && (
    <div>
      <p><b>Nomi:</b> {selectedProduct.name}</p>
      <p><b>Kod:</b> {selectedProduct.code}</p>
      <p><b>Kategoriya:</b> {selectedProduct.category}</p>
      <p><b>O‘lcham:</b> {selectedProduct.width} x {selectedProduct.height} x {selectedProduct.length}</p>
      <p><b>Hajm:</b> {selectedProduct.height?.toFixed(3)} m³</p>
      <p><b>Miqdor:</b> {selectedProduct.quantity}</p>
      <p><b>Narxi:</b> {selectedProduct.sellPrice} {selectedProduct.currency}</p>
      <p><b>Valyuta:</b> {selectedProduct.currency}</p>
      <p><b>O‘lchov birligi:</b> {selectedProduct.unit}</p>
    </div>
  )}
</Modal>


      {selectedList.length > 0 && (
    <div style={{ marginTop: 32 }}>
      <Typography.Title level={4}>Tanlangan mahsulotlar</Typography.Title>
      <Table
  className="responsive-container"
  dataSource={selectedList}
  rowKey="_id"
  columns={
    isMobile
      ? [
          { title: "Kodi", dataIndex: "code" },
          { title: "Nomi", dataIndex: "name" },
          {
            title: "Kub", 
            render: (_, record) =>
              record.unit === "kub"
                ? (((record.width * record.height * record.length) / 1_000_000_000) * record.quantity).toFixed(3) + " m³"
                : "-",
          },
          {
            title: "👁",
            render: (_, record) => (
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => {
                  setViewedItem(record);
                  setModalVisible(true);
                }}
              />
            ),
          },
        ]
      : [
          { title: "Kodi", dataIndex: "code" },
          { title: "Nomi", dataIndex: "name" },
          {
            title: "Valyuta",
            render: (text, record, rowIndex) => (
              <Select
                value={record.currency}
                onChange={(val) => handleCurrencyChange(rowIndex, val)}
                style={{ width: 80 }}
              >
                <Select.Option value="so'm">$</Select.Option>
                <Select.Option value="$">so'm</Select.Option>
              </Select>
            ),
          },
          {
            title: "O‘lchov",
            render: (_, record) => (
              <Select
                value={record.unit}
                onChange={(val) => updateSelectedItem(record.code, "unit", val)}
                style={{ width: 100 }}
                options={[
                  { value: "dona", label: "dona" },
                  { value: "kub", label: "kub" },
                ]}
              />
            ),
          },
          {
            title: "Miqdor",
            render: (_, record) => (
              <InputNumber
                min={1}
                value={record.quantity}
                onChange={(val) =>
                  updateSelectedItem(record.code, "quantity", val)
                }
              />
            ),
          },
          {
            title: "Hajm (kub)",
            render: (_, record) =>
              record.unit === "kub"
                ? (
                    ((record.width * record.height * record.length) / 1_000_000_000) *
                    record.quantity
                  ).toFixed(3) + " m³"
                : "-",
          },
          {
            title: "Umumiy",
            render: (_, record) => {
              const total = calculateTotal(record);
              const currency = record.currency;
              return (
                <b>
                  {currency === "$"
                    ? `${total.toLocaleString()} so'm`
                    : `${total.toLocaleString()} $`}
                </b>
              );
            },
          },
          {
            title: "Amal",
            render: (_, record) => (
              <Button
                danger
                onClick={() => removeSelectedItem(record.code)}
              >
                ❌
              </Button>
            ),
          },
        ]
  }
  pagination={false}
  bordered
/>

<Modal
  visible={modalVisible}
  onCancel={() => setModalVisible(false)}
  footer={null}
  title="Mahsulot tafsilotlari"
>
  {viewedItem && (
    <div>
      <p><b>Nomi:</b> {viewedItem.name}</p>
      <p><b>Kodi:</b> {viewedItem.code}</p>
      <p><b>Kategoriya:</b> {viewedItem.category}</p>
      <p><b>O‘lcham:</b> {viewedItem.width} x {viewedItem.height} x {viewedItem.length}</p>
      <p><b>Miqdor:</b> {viewedItem.quantity}</p>
      <p><b>Valyuta:</b> {viewedItem.currency}</p>
      <p><b>Hajm (kub):</b> {viewedItem.unit === "kub" ? (((viewedItem.width * viewedItem.height * viewedItem.length) / 1_000_000_000) * viewedItem.quantity).toFixed(3) + " m³" : "-"}</p>
      <p><b>Umumiy summa:</b> {calculateTotal(viewedItem).toLocaleString()} so'm</p>
    </div>
  )}
</Modal>



      <Divider />
      <Typography.Text strong>
Umumiy summa:{" "}
{selectedList[0].currency === "$"
  ? `${totalAmountAll.toLocaleString()} so'm`
  : `${totalAmountAll.toLocaleString()} $`}
</Typography.Text>

      <Form layout="vertical" form={form} onFinish={onFinish} style={{ marginTop: 16 }}>
        <Form.Item
          label="Haridor ismi"
          name="customerName"
          rules={[{ required: true, message: "Haridor ismini kiriting" }]}
        >
          <Input placeholder="Masalan: Abdurahmon" />
        </Form.Item>

        <Form.Item
          label="Telefon raqami"
          name="customerPhone"
          rules={[{ required: true, message: "Telefon raqamini kiriting" }]}
        >
          <Input placeholder="Masalan: 998901234567" />
        </Form.Item>

        <Form.Item
          label="To‘langan summa"
          name="paidAmount"
          rules={[{ required: true, message: "To‘langan summani kiriting" }]}
        >
          <InputNumber placeholder="Masalan: 100000" style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.paidAmount !== curr.paidAmount}>
          {({ getFieldValue }) => {
            const paid = getFieldValue("paidAmount") || 0;
            return paid < totalAmountAll ? (
              <Form.Item
                label="Qaytarish sanasi"
                name="dueDate"
                rules={[{ required: true, message: "Qaytarish sanasini kiriting" }]}
              >

                <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
              </Form.Item>
              // ism

            ) : null;
          }}
        </Form.Item>


        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Sotishni yakunlash
          </Button>
        </Form.Item>
      </Form>
    </div>
  )}

      {/* Tanlangan mahsulotlar va forma qismi shu yerdan pastda bo'ladi */}
      {/* ...bu qism o'zgarmagan, sizning kodingizni saqladik */}
    </div>
  );
};

export default Home;

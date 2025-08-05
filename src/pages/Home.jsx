// 📄 Home.jsx – Form bo‘limi to‘liq tuzilgan va optimallashtirilgan
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
  DatePicker,
  Divider,
} from "antd";
import { useGetAllProductsQuery, useDeleteProductMutation } from "../context/productApi";
import { useAddSaleMutation } from "../context/saleApi";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { CloseOutlined } from "@ant-design/icons";


const Home = () => {
  const { data, isLoading, refetch } = useGetAllProductsQuery();
  const [deleteProduct] = useDeleteProductMutation();
  const [addSale] = useAddSaleMutation();

  const [filterType, setFilterType] = useState("all");
  const [selectedList, setSelectedList] = useState([]);
  const [form] = Form.useForm();
  const [exchangeRate, setExchangeRate] = useState(null); // yoki 0 ham bo'ladi

  // ❌ Mahsulotni tanlangan ro‘yxatdan o‘chirish
const removeSelectedItem = (code) => {
  setSelectedList((prev) => prev.filter((item) => item.code !== code));
};


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
    fetchRate(); // sahifa ochilganda API dan olib keladi
  }, []);

  const filteredProducts = useMemo(() => {
    if (!data?.innerData) return [];
    if (filterType === "low") return data.innerData.filter((p) => p.quantity <= 5 && p.quantity > 0);
    if (filterType === "finished") return data.innerData.filter((p) => p.quantity === 0);
    return data.innerData;
  }, [data, filterType]);



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
      prev.map((item) =>
        item.code === code ? { ...item, [field]: value } : item
      )
    );
  };
  const handleCurrencyChange = (index, newCurrency) => {
    const updated = [...selectedList];
    updated[index].currency = newCurrency;
    setSelectedList(updated);
  };
  
  

  const calculateTotal = (item) => {
    if (!exchangeRate) return 0; // API hali kelmagan bo‘lsa
  
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

  return (
    <div>
      <Typography.Title level={2}>Mahsulotlar</Typography.Title>
      
      <Radio.Group value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ marginBottom: 16 }}>
        <Radio.Button value="all">Barchasi</Radio.Button>
        <Radio.Button value="low">Kam qolgan</Radio.Button>
        <Radio.Button value="finished">Tugagan</Radio.Button>
      </Radio.Group>

      <Table dataSource={filteredProducts} columns={columns} rowKey="_id" loading={isLoading} pagination={{ pageSize: 6 }} />

      {selectedList.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <Typography.Title level={4}>Tanlangan mahsulotlar</Typography.Title>
          <Table
            dataSource={selectedList}
            rowKey="_id"
            columns={[
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
                    options={[{ value: "dona", label: "dona" }, { value: "kub", label: "kub" }]}
                  />
                ),
              },
              {
                title: "Miqdor",
                render: (_, record) => (
                  <InputNumber
                    min={1}
                    value={record.quantity}
                    onChange={(val) => updateSelectedItem(record.code, "quantity", val)}
                  />
                ),
              },
              {
                title: "Hajm (kub)",
                render: (_, record) =>
                  record.unit === "kub"
                    ? (((record.width * record.height * record.length) / 1_000_000_000) * record.quantity).toFixed(3) + " m³"
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
                  <Button danger onClick={() => removeSelectedItem(record.code)}>
                    ❌
                  </Button>
                ),
              }
              
              
            ]}
            pagination={false}
            bordered
          />

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
    </div>
  );
};

export default Home;

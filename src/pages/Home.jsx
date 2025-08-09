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
    const [currency, setCurrency] = useState("$");
  const [filterType, setFilterType] = useState("all");
  const [selectedList, setSelectedList] = useState([]);
  const [form] = Form.useForm();
  const [exchangeRate, setExchangeRate] = useState(null); // yoki 0 ham bo'ladi
  const [searchTerm, setSearchTerm] = useState("");


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
  
    let filtered = [...data.innerData];
  
    // filterType
    if (filterType === "low") {
      filtered = filtered.filter((p) => Number(p.totalKub) > 0 && Number(p.totalKub) < 5);
    } else if (filterType === "finished") {
      filtered = filtered.filter((p) => Number(p.totalKub) <= 0);
    }
  
    // search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter((p) =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  
    return filtered;
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
        currency: product.currency,           // Foydalanuvchi ko‘radigan valyuta
        originalCurrency: product.currency,   // Asl valyuta shu bo‘lib qoladi!
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

  const handleInputChange = (val, record) => {
    const total = val * record.price;
  
    if (total > record.totalKub * record.price) {
      toast.warning("Kiritilgan miqdor mavjud hajmdan ortiq. Iltimos, tekshiring.");
      return;
    }
  
    updateSelectedItem(record.code, "quantity", val);
  };
  
  const handleCurrencyChange = (index, newCurrency) => {
    const updated = [...selectedList];
    updated[index].currency = newCurrency;
    setSelectedList(updated);
  };
  
  

  const calculateTotal = (item) => {
    if (!exchangeRate) return 0;
  
    const count = Number(item.quantity);        // m³
    if (isNaN(count)) return 0;
  
    // ❗ sotuv narxi ishlatiladi
    const originalPrice = Number(item.sellPricePerKub ?? item.pricePerKub ?? 0);
  
    // Valyuta aylantirishni soddalashtirish:
    // Ma'lumot bazadagi narx qaysi valutada bo‘lsa, o‘sha -> tanlangan currency ga o‘tkazamiz
    let finalPrice = originalPrice;
  
    const fromDollar = item.originalCurrency === "$";
    const toDollar   = item.currency === "$";
  
    if (exchangeRate && fromDollar && !toDollar) {
      // $ -> so'm
      finalPrice = originalPrice * exchangeRate;
    } else if (exchangeRate && !fromDollar && toDollar) {
      // so'm -> $
      finalPrice = originalPrice / exchangeRate;
    }
  
    return finalPrice * count;
  };
  
  
  

  const totalAmountAll = selectedList.reduce((sum, item) => sum + calculateTotal(item), 0);

  const onFinish = async (values) => {
    const prepared = selectedList.map((item) => {
      const kub = item.quantity; // quantity = kub, to'g'ridan-to'g'ri foydalaniladi
    
      return {
        productId: item._id,
        name: item.name,
        code: item.code,
        category: item.category,
        unit: item.unit,
        quantity: item.quantity,
        kub, // bu yuboriladi va backendda `totalKub` kamaytiriladi
        price: item.sellPricePerKub,
        currency: item.currency,
        cost: item.pricePerKub,
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
      setSelectedList([]);
      form.resetFields();
      await refetch(); // ✅ yangilangan mahsulotlar kelsin
    } else {
      toast.error(res?.data?.message || "Noma'lum xatolik yuz berdi");
    }
    };
       

      // 💡 Shunchaki yangi `copy.innerData`dan foydalaning (agar kerak bo‘lsa)
   
    
    


const columns = [
  { title: "Nomi", dataIndex: "name", key: "name" },
  { title: "Kodi", dataIndex: "code", key: "code" },
  { title: "Kategoriya", dataIndex: "category", key: "category" },
  {
    title: "Hajm (kub)",
    dataIndex: "totalKub",
    render: (val) => {
      const num = Number(val);
      return `${num % 1 === 0 ? num : num.toFixed(3)} m³`;
    }
  }
  
  ,  
  {
    title: "O‘lcham (eni b u)",
    key: "size",
    render: (record) => (
      <span>
        {record.width || "-"} x {record.height || "-"} x {record.length || "-"}
      </span>
    ),
  },
 // columns dagi "Narxi"
{
  title: "Narxi",
  render: (item) =>
    item.sellPricePerKub != null
      ? `${item.sellPricePerKub.toLocaleString()} ${item.currency}`
      : item.pricePerKub != null
        ? `${item.pricePerKub.toLocaleString()} ${item.currency}`
        : item.price != null
          ? `${item.price.toLocaleString()} ${item.currency}`
          : "-",
},

{
  title: "Umumiy",
  render: (item) => {
    const kub = Number(item.totalKub ?? 0);
    const price = Number(item.sellPricePerKub ?? item.pricePerKub ?? 0);
    if (!kub || !price) return "-";
    return `${(kub * price).toLocaleString()} ${item.currency}`;
  },
},

  
  {
    title: "Amallar",
    render: (_, record) => {
      const isTugagan = record.totalKub <= 0;
  
      return (
        <Button
          type="primary"
          disabled={isTugagan}
          onClick={() => handleSelectProduct(record)}
        >
          Tanlash
        </Button>
      );
    },
  }
  
];

  return (
    <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
  <Typography.Title level={3} style={{ marginBottom: 16}}>
    Mahsulotlar
  </Typography.Title>

  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
  <Input.Search
  placeholder="Mahsulot qidirish"
  allowClear
  style={{ width: 200 }}
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>

    <Radio.Group value={filterType} onChange={(e) => setFilterType(e.target.value)}>
      <Radio.Button value="all">Barchasi</Radio.Button>
      <Radio.Button value="low">Kam qolgan</Radio.Button>
      <Radio.Button value="finished">Tugagan</Radio.Button>
    </Radio.Group>
  </div>
</div>


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
      render: (_, record) => <span>{record.currency}</span>
    },
    {
      title: "Miqdor (m³)",
      render: (_, record) => (
        <InputNumber
        min={0.001}
        step={0.001}
        value={record.quantity}
        formatter={(value) => {
          const number = Number(value);
          return number % 1 === 0 ? `${number}` : number.toFixed(3);
        }}
        parser={(value) => value.replace(/[^\d.]/g, '')}
        onChange={(val) => {
          if (val > record.totalKub) {
            const displayValue =
              Number(record.totalKub) % 1 === 0
                ? Number(record.totalKub)
                : Number(record.totalKub).toFixed(3);
      
            toast.warning(`Omborda faqat ${displayValue} m³ mahsulot bor`);
            updateSelectedItem(record.code, "quantity", record.totalKub);
          } else {
            updateSelectedItem(record.code, "quantity", val);
          }
        }}
      />
      
      )
    },
    {
      title: "Hajm (kub)",
      render: (_, record) => {
        const totalKub = Number(record.quantity);
        const formattedKub = totalKub % 1 === 0 ? totalKub : totalKub.toFixed(3);
        return `${formattedKub} m³`;
      },
    },
    {
      title: "Umumiy",
      render: (_, record) => {
        const total = calculateTotal(record);
        return (
          <b>
            {record.currency === "so'm"
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
  {selectedList[0]?.currency === "so'm"
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
  <InputNumber
    min={0}
    max={totalAmountAll}
    value={form.getFieldValue("paidAmount")}
    onChange={(value) => {
      if (value > totalAmountAll) {
        toast.warning("To‘langan summa umumiy summadan oshmasligi kerak!");
        form.setFieldsValue({ paidAmount: totalAmountAll });
      } else {
        form.setFieldsValue({ paidAmount: value });
      }
    }}
    formatter={(value) =>
      value && !isNaN(value) ? `${Number(value).toLocaleString()} ${currency}` : ""
    }
    parser={(value) => value.replace(/[^\d]/g, "")}
    placeholder="Masalan: 100000"
    style={{ width: "100%" }}
  />
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

// 📁 components/AddProduct.jsx
import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Typography,
  Divider,
  Modal,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useAddProductMutation } from "../context/productApi";
import {
  useGetAllCategoriesQuery,
  useAddCategoryMutation,
} from "../context/categoryApi";
import { toast } from "react-toastify";

const { Title } = Typography;

const AddProduct = ({ refetchProducts }) => {
  const [form] = Form.useForm();
  const [kub, setKub] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalSellPrice, setTotalSellPrice] = useState(0);
  const [currency, setCurrency] = useState("$");
  const [exchangeRate, setExchangeRate] = useState(0);

  const [addProduct] = useAddProductMutation();
  const { data: categories, refetch } = useGetAllCategoriesQuery();
  const [addCategory] = useAddCategoryMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const fetchRate = async () => {
    try {
      const res = await fetch("https://cbu.uz/oz/arkhiv-kursov-valyut/json/USD/");
      const data = await res.json();
      const rate = parseFloat(data[0]?.Rate || "0");
      setExchangeRate(rate);
    } catch (err) {
      console.error("Kursni olishda xatolik:", err);
    }
  };

  useEffect(() => {
    fetchRate();
  }, []);

  const onValuesChange = (_, allValues) => {
    const { width, height, length, pricePerKub, sellPricePerKub } = allValues;

    if (width && height && length) {
      const kubHajmi = width * height * length;
      setKub(Number(kubHajmi.toFixed(4)));

      if (pricePerKub) {
        const total = kubHajmi * pricePerKub;
        setTotalPrice(Number(total.toFixed(2)));
      }

      if (sellPricePerKub) {
        const sellTotal = kubHajmi * sellPricePerKub;
        setTotalSellPrice(Number(sellTotal.toFixed(2)));
      }
    }
  };

  const onFinish = async (values) => {
    const payload = {
      ...values,
      kub,
      totalKub: kub,
      totalPrice,
      currency: "$",
    };

    try {
      await addProduct(payload).unwrap();
      toast.success("✅ Mahsulot qo‘shildi!");
      form.resetFields();
      setKub(0);
      setTotalPrice(0);
      setTotalSellPrice(0);
      if (refetchProducts) refetchProducts(); // ✅ qayta yuklash
    } catch (err) {
      const message = err?.data?.message || " Noma'lum xatolik yuz berdi";
      toast.error(`❌ ${message}`);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory) return;
    try {
      await addCategory({ name: newCategory }).unwrap();
      toast.success("Kategoriya qo‘shildi!");
      setNewCategory("");
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      toast.error("Xatolik kategoriya qo‘shishda!");
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <Title  style={{marginTop: 16}} level={3}>Mahsulot qo‘shish</Title>
      <Divider />
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onValuesChange={onValuesChange}
      >
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item label="Mahsulot nomi" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>

            <Form.Item
              label={
                <span>
                  Kategoriya{" "}
                  <Button
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => setIsModalOpen(true)}
                    type="link"
                  >
                    Qo‘shish
                  </Button>
                </span>
              }
              name="category"
              rules={[{ required: true }]}
            >
              <Select placeholder="Kategoriya tanlang">
                {(categories?.innerData || []).map((cat) => (
                  <Select.Option key={cat._id} value={cat.name}>
                    {cat.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Kod" name="code">
              <Input placeholder="Mahsulot kodi" />
            </Form.Item>

            <Form.Item label="Valyuta" name="currency" initialValue="$">
              <Select disabled>
                <Select.Option value="$">$</Select.Option>
              </Select>
            </Form.Item>


            <Form.Item label="Yetkazib beruvchi" name="supplier">
              <Input />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Narxi (1 m³)"
              name="pricePerKub"
              rules={[{ required: true, message: "Narxni kiriting" }]}
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                formatter={(value) => `${value} ${currency}`}
                parser={(value) => value.replace(` ${currency}`, '')}
              />
            </Form.Item>


            <Form.Item
              label="Sotish narxi (1 m³)"
              name="sellPricePerKub"
              formatter={(value) => `${value} ${currency}`}
              parser={(value) => value.replace(` ${currency}`, '')}
              rules={[{ required: true, message: "Sotish narxini kiriting" }]}
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                formatter={(value) => `${value} ${currency}`}
                parser={(value) => value.replace(` ${currency}`, '')}
              />
            </Form.Item>





            <Form.Item label="En (m)" name="width" rules={[{ required: true }]}>
              <InputNumber style={{ width: "100%" }} step={0.01} precision={0} />
            </Form.Item>

            <Form.Item label="Bo‘yi (m)" name="height" rules={[{ required: true }]}>
              <InputNumber style={{ width: "100%" }} step={0.01} precision={0} />
            </Form.Item>

            <Form.Item label="Uzunlik (m)" name="length" rules={[{ required: true }]}>
              <InputNumber style={{ width: "100%" }} step={0.01} precision={0} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={8}>
            <p>🧮 Kub hajmi: <strong>{kub} m³</strong></p>
          </Col>
          <Col span={8}>
            <p>💰 Umumiy xarid narxi: <strong>{totalPrice.toLocaleString()} {currency}</strong></p>
          </Col>
          <Col span={8}>
            <p>💸 Umumiy sotish narxi: <strong>{totalSellPrice.toLocaleString()} {currency}</strong></p>
          </Col>
        </Row>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Saqlash
          </Button>
        </Form.Item>
      </Form>

      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleAddCategory}
        title="Yangi kategoriya qo‘shish"
        okText="Qo‘shish"
      >
        <Input
          placeholder="Kategoriya nomi"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default AddProduct;

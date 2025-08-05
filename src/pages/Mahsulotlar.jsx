import React, { useState, useMemo } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  Row,
  Col,
  Modal,
  Popconfirm,
  Typography,
  InputNumber,
  Space,
  DatePicker,
  Table
} from "antd";
import { useAddProductMutation } from "../context/productApi";
import {
  useAddCategoryMutation,
  useGetAllCategoriesQuery,
  useDeleteCategoryMutation,
} from "../context/categoryApi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useGetAllProductsQuery } from "../context/productApi";

const AddProduct = () => {
  const [form] = Form.useForm();
  const [openModal, setOpenModal] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [unit, setUnit] = useState("dona");
  const [openKirimModal, setOpenKirimModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const [addProduct] = useAddProductMutation();
  const [addCategory] = useAddCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const { data: categories, refetch } = useGetAllCategoriesQuery();
  const { data: allProducts } = useGetAllProductsQuery();
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    if (!selectedDate || !allProducts?.innerData) return [];
    return allProducts.innerData.filter(
      (item) => dayjs(item.createdAt).isSame(selectedDate, "day")
    );
  }, [selectedDate, allProducts]);

  const totalByCurrency = (currency) => {
    const items = filtered.filter((i) => i.currency === currency);
    const total = items.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
      0
    );
    const profit = items.reduce((sum, item) => {
      if (item.sellPrice != null && item.price != null) {
        return sum + (item.sellPrice - item.price) * (item.quantity || 0);
      }
      return sum;
    }, 0);
    return { total, profit };
  };

  const handleDeleteCategory = async (id) => {
    try {
      await deleteCategory(id).unwrap();
      toast.success("Kategoriya o‘chirildi");
      refetch();
    } catch (err) {
      toast.error("Kategoriya o‘chirilmadi");
    }
  };

  const handleAddCategory = async () => {
    if (!categoryName) return toast.error("Kategoriya nomi kiritilmagan!");
    try {
      await addCategory({ name: categoryName }).unwrap();
      toast.success("Kategoriya qo‘shildi");
      setOpenModal(false);
      setCategoryName("");
      refetch();
    } catch (err) {
      toast.error("Kategoriya qo‘shishda xatolik");
    }
  };

  const onFinish = async (values) => {
    try {
      const payload = {
        ...values,
        quantity: values.unit === "kub" ? Number(values.volume) : values.quantity,
      };
      await addProduct(payload).unwrap();
      toast.success("Mahsulot muvaffaqiyatli qo‘shildi");
      form.resetFields();
    } catch (err) {
      toast.error("Xatolik: Mahsulot qo‘shilmadi");
    }
  };
  

  return (
    <>
      <Button onClick={() => setOpenKirimModal(true)}>Kirimlar tarixi</Button>

      <Modal
        title="Kirimlar sanasi bo‘yicha"
        open={openKirimModal}
        onCancel={() => setOpenKirimModal(false)}
        footer={null}
        width={1100}
      >
        <Row gutter={32} style={{ marginBottom: 32 }}>
          <Col>
            <DatePicker onChange={(date) => setSelectedDate(date)} />
          </Col>
        </Row>

        <Row gutter={32} style={{ marginBottom: 32 }}>
          <Col>
            <Typography.Text>Umumiy summa</Typography.Text>
            <Typography.Title level={5}>{totalByCurrency("so'm").total.toLocaleString()} so'm</Typography.Title>
            <Typography.Title level={5}>{totalByCurrency("$").total.toLocaleString()} $</Typography.Title>
          </Col>
          <Col>
            <Typography.Text>Umumiy foyda</Typography.Text>
            <Typography.Title level={5}>{totalByCurrency("so'm").profit.toLocaleString()} so'm</Typography.Title>
            <Typography.Title level={5}>{totalByCurrency("$").profit.toLocaleString()} $</Typography.Title>
          </Col>
        </Row>

        <Table
          size="small"
          bordered
          dataSource={filtered}
          rowKey="_id"
          pagination={false}
          columns={[
            { title: "Mahsulot", dataIndex: "name" },
            { title: "Kod", dataIndex: "code" },
            { title: "Kategoriya", dataIndex: "category" },
            { title: "Soni", dataIndex: "quantity" },
            {
              title: "Narxi",
              render: (item) => `${item.price} ${item.currency}`,
            },
            {
              title: "Sotish narxi",
              render: (item) => item.sellPrice ? `${item.sellPrice} ${item.currency}` : "-",
            },
            {
              title: "Kirim summa",
              render: (item) => `${(item.price * item.quantity).toLocaleString()} ${item.currency}`,
            },
            {
              title: "Foyda",
              render: (item) => item.sellPrice ? `${((item.sellPrice - item.price) * item.quantity).toLocaleString()} ${item.currency}` : "-",
            },
            {
              title: "Sana",
              render: (item) => dayjs(item.createdAt).format("YYYY-MM-DD"),
            },
          ]}
        />
      </Modal>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onValuesChange={(changed, allValues) => {
          const { width, height, length } = allValues;
          const w = Number(width);
          const h = Number(height);
          const l = Number(length);
          if (w && h && l) {
            const volume = ((w * h * l) / 1000000).toFixed(3);
            form.setFieldsValue({ volume });
          }
        }}
        initialValues={{ currency: "so'm", unit: "dona" }}
      >
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Typography.Title level={3}>Mahsulot qo‘shish</Typography.Title>
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
          <Col span={12}>
            <Form.Item label="Mahsulot nomi" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>

            <Form.Item label="* Kategoriya" name="category" rules={[{ required: true }]}>
              <Select
                placeholder="Kategoriya tanlang"
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    <Button
                      type="link"
                      onClick={() => setOpenModal(true)}
                      style={{ width: "100%" }}
                    >
                      + Yangi kategoriya qo‘shish
                    </Button>
                  </>
                )}
              >
                {categories?.innerData?.map((cat) => (
                  <Select.Option key={cat._id} value={cat.name}>
                    <span style={{ display: "flex", justifyContent: "space-between" }}>
                      {cat.name}
                      <Popconfirm
                        title="Kategoriya o‘chirilsinmi?"
                        onConfirm={() => handleDeleteCategory(cat._id)}
                      >
                        <span style={{ color: "red", marginLeft: 10, cursor: "pointer" }}>
                          ❌
                        </span>
                      </Popconfirm>
                    </span>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Kod" name="code">
              <Input />
            </Form.Item>

            <Form.Item name="unit" label="O'lchov">
  <Select value={unit} onChange={(val) => setUnit(val)}>
    <Select.Option value="dona">dona</Select.Option>
    <Select.Option value="kub">kub</Select.Option>
  </Select>
</Form.Item>

            <Form.Item label="En (sm)" name="width">
              <Input type="number" />
            </Form.Item>

            <Form.Item label="Bo‘yi (sm)" name="height">
              <Input type="number" />
            </Form.Item>

            <Form.Item label="Uzunlik (sm)" name="length">
              <Input type="number" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Kub hajmi (m³)" name="volume">
              <Input disabled />
            </Form.Item>

            <Form.Item
          
  name="quantity"
  label="Soni"
  rules={[
    {
      required: unit === "dona",
      message: "Soni majburiy (dona uchun)",
    },
  ]}
>
  <InputNumber disabled={unit === "kub"} placeholder="Soni" />
</Form.Item>

            <Form.Item
              label="* Narxi (dona/kub)"
              name="price"
              rules={[{ required: true }]}
            >
              <Input type="number" />
            </Form.Item>

            <Form.Item label="Sotish narxi" name="sellPrice">
              <Input type="number" />
            </Form.Item>

            <Form.Item label="Valyuta" name="currency">
              <Select>
                <Select.Option value="so'm">so'm</Select.Option>
                <Select.Option value="$">$</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item label="Yetkazib beruvchi" name="supplier">
              <Input />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                Saqlash
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <Modal
        title="Yangi kategoriya qo‘shish"
        open={openModal}
        onCancel={() => setOpenModal(false)}
        onOk={handleAddCategory}
        okText="Qo‘shish"
        cancelText="Bekor qilish"
      >
        <Input
          placeholder="Masalan: qarag'ay"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
        />
      </Modal>
    </>
  );
};

export default AddProduct;

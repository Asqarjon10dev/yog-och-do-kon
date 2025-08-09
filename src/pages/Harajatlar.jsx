// src/pages/ModalHarajatlar.jsx
import React, { useMemo, useState } from "react";
import {
  Modal, Row, Col, Card, Table, Button, Form, Input, Select,
  DatePicker, Typography, Popconfirm, Radio, Divider, message,
} from "antd";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { PlusOutlined, CloseOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  useGetAllExpensesQuery, useAddExpenseMutation, useDeleteExpenseMutation,
} from "../context/harajatApi";
import {
  useGetExpenseCategoriesQuery, useAddExpenseCategoryMutation,
} from "../context/catagoryharajatApi";
import "./ModalHarajatlar.css";

dayjs.extend(isBetween);
const { Title } = Typography;
const { RangePicker } = DatePicker;

const ModalHarajatlar = () => {
  // Expenses
  const { data, isLoading, refetch } = useGetAllExpensesQuery();
  const [addExpense] = useAddExpenseMutation();
  const [deleteExpense] = useDeleteExpenseMutation();
  const expenses = data?.innerData || [];             // ✅ qo‘shildi

  // Categories
  const { data: catRes, isLoading: catsLoading, refetch: refetchCats } =
    useGetExpenseCategoriesQuery();
  const [createCategory, { isLoading: creatingCat }] =
    useAddExpenseCategoryMutation();
  const categories = catRes?.innerData || [];

  // UI
  const [form] = Form.useForm();
  const [showAddModal, setShowAddModal] = useState(false);
  const [dateFilter, setDateFilter] = useState("month");
  const [range, setRange] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const navigate = useNavigate();

  // Filtered data
  const filteredData = useMemo(() => {
    let result = [...expenses];
    const today = dayjs();
    if (dateFilter === "today") {
      result = result.filter(e => dayjs(e.createdAt).isSame(today, "day"));
    } else if (dateFilter === "week") {
      result = result.filter(e => dayjs(e.createdAt).isAfter(today.subtract(7, "day")));
    } else if (dateFilter === "month") {
      result = result.filter(e => dayjs(e.createdAt).isSame(today, "month"));
    } else if (dateFilter === "range" && range?.length === 2 && range[0] && range[1]) {
      result = result.filter(e => dayjs(e.createdAt).isBetween(range[0], range[1], null, "[]"));
    }
    if (categoryFilter && categoryFilter !== "ALL") {
      result = result.filter(e => e.category === categoryFilter);
    }
    return result;
  }, [expenses, dateFilter, range, categoryFilter]);

  // Stats
  const total = useMemo(
    () => filteredData.reduce((acc, cur) => acc + Number(cur.amount || 0), 0),
    [filteredData]
  );
  const categoryStats = useMemo(() => {
    const stats = {};
    filteredData.forEach(e => {
      stats[e.category] = (stats[e.category] || 0) + Number(e.amount || 0);
    });
    return stats;
  }, [filteredData]);
  const topCategory = useMemo(() => {
    const arr = Object.entries(categoryStats);
    return arr.length ? arr.sort((a, b) => b[1] - a[1])[0] : null;
  }, [categoryStats]);

  // Handlers
  const handleAdd = async () => {
    try {
      const values = await form.validateFields();
      await addExpense(values).unwrap();
      message.success("Xarajat qo‘shildi");
      setShowAddModal(false);
      form.resetFields();
      refetch();
    } catch (e) {
      message.error(e?.data?.message || "Xatolik yuz berdi");
    }
  };
  const handleDelete = async (id) => {
    try {
      await deleteExpense(id).unwrap();
      message.success("O‘chirildi");
      refetch();
    } catch {
      message.error("O‘chirishda xatolik");
    }
  };
  const handleCreateCategory = async () => {
    const name = (newCatName || "").trim();
    if (!name) return message.warning("Kategoriya nomini kiriting");
    try {
      await createCategory({ name }).unwrap();
      message.success("Kategoriya qo‘shildi");
      setCatModalOpen(false);
      setNewCatName("");
      await refetchCats();
      form.setFieldsValue({ category: name });
    } catch (e) {
      message.error(e?.data?.message || "Kategoriya qo‘shishda xatolik");
    }
  };

  const columns = [
    { title: "Summa", dataIndex: "amount", render: v => `${Number(v || 0).toLocaleString()} so‘m` },
    { title: "Kategoriya", dataIndex: "category" },
    { title: "Sabab", dataIndex: "reason" },
    { title: "Sana", dataIndex: "createdAt", render: v => dayjs(v).format("YYYY-MM-DD HH:mm") },
    {
      title: "Amal",
      render: (_, rec) => (
        <Popconfirm title="O‘chirishni istaysizmi?" onConfirm={() => handleDelete(rec._id)}>
          <Button danger size="small">🗑</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <div className="expense-wrapper">
        <div className="expense-container">
          <div className="expense-header">
            <Title level={3}>
              Xarajatlar{" "}
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowAddModal(true)}>
                Qo‘shish
              </Button>
            </Title>
            <Button type="text" icon={<CloseOutlined style={{ fontSize: 20 }} />} onClick={() => navigate("/")} />
          </div>

          <Row gutter={16} className="expense-cards">
            <Col span={6}><Card title="Jami xarajat">{total.toLocaleString()} so‘m</Card></Col>
            <Col span={6}><Card title="Kategoriya soni">{Object.keys(categoryStats).length} ta</Card></Col>
            <Col span={12}>
              <Card title="Eng ko‘p sarflangan">
                {topCategory ? `${topCategory[0]} — ${Number(topCategory[1]).toLocaleString()} so‘m` : "Ma’lumot yo‘q"}
              </Card>
            </Col>
          </Row>

          <div className="expense-filters">
            <Radio.Group value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              <Radio.Button value="today">Bugun</Radio.Button>
              <Radio.Button value="week">Bu hafta</Radio.Button>
              <Radio.Button value="month">Bu oy</Radio.Button>
              <Radio.Button value="range">Oraliq</Radio.Button>
            </Radio.Group>

            {dateFilter === "range" && <RangePicker onChange={(val) => setRange(val)} />}

            <Select
              style={{ width: 200, marginLeft: 16 }}
              placeholder="Kategoriya tanlang"
              value={categoryFilter ?? "ALL"}
              showSearch
              onChange={setCategoryFilter}
              loading={catsLoading}
              options={[
                { label: "Barchasi", value: "ALL" },
                ...categories.map(c => ({ label: c.name, value: c.name })),
              ]}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <div style={{ padding: 8 }}>
                    <Button type="primary" block onClick={() => setCatModalOpen(true)}>+ Qo‘shish</Button>
                  </div>
                </>
              )}
            />
          </div>

          <Table
            loading={isLoading}
            dataSource={filteredData}
            columns={columns}
            rowKey="_id"
            pagination={{ pageSize: 6 }}
            className="expense-table"
          />
        </div>
      </div>

      <Modal
        title="➕ Xarajat qo‘shish"
        open={showAddModal}
        onCancel={() => setShowAddModal(false)}
        footer={null}
        centered
        width={520}
      >
        <Form layout="vertical" form={form}>
          <Form.Item name="amount" label="💰 Summa" rules={[{ required: true, message: "Summani kiriting" }]}>
            <Input type="number" placeholder="Masalan: 25000" />
          </Form.Item>

          <Form.Item name="category" label="📦 Kategoriya" rules={[{ required: true, message: "Kategoriya tanlang" }]}>
            <Select
              placeholder="Kategoriya tanlang"
              loading={catsLoading}
              options={categories.map(c => ({ label: c.name, value: c.name }))}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <Divider style={{ margin: 8 }} />
                  <div style={{ padding: "0 8px 8px", textAlign: "right" }}>
                    <Button type="primary" onClick={() => setCatModalOpen(true)}>+ Qo‘shish</Button>
                  </div>
                </>
              )}
            />
          </Form.Item>

          <Form.Item name="reason" label="📝 Sabab">
            <Input.TextArea rows={3} placeholder="Masalan: Nonushta uchun" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" onClick={handleAdd} block>Qo‘shish</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Yangi kategoriya"
        open={catModalOpen}
        onCancel={() => { setCatModalOpen(false); setNewCatName(""); }}
        onOk={handleCreateCategory}
        okText={creatingCat ? "Saqlanmoqda..." : "Saqlash"}
        confirmLoading={creatingCat}
      >
        <Input
          autoFocus
          placeholder="Kategoriya nomi"
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          onPressEnter={(e) => e.preventDefault()}
        />
      </Modal>
    </>
  );
};

export default ModalHarajatlar;

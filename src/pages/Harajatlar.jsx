import React, { useEffect, useState, useMemo } from "react";
import {
  Modal,
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  Typography,
  Popconfirm,
  Radio,
  message,
} from "antd";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { PlusOutlined, CloseOutlined } from "@ant-design/icons";
import {
  useGetAllExpensesQuery,
  useAddExpenseMutation,
  useDeleteExpenseMutation,
} from "../context/harajatApi";
import { useNavigate } from "react-router-dom";
import "./ModalHarajatlar.css";

dayjs.extend(isBetween);

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const ModalHarajatlar = ({ isOpen, onClose }) => {
  const { data, isLoading, refetch } = useGetAllExpensesQuery();
  const [addExpense] = useAddExpenseMutation();
  const [deleteExpense] = useDeleteExpenseMutation();
  const [form] = Form.useForm();

  const [showAddModal, setShowAddModal] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [dateFilter, setDateFilter] = useState("month");
  const [range, setRange] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState([]);
  const navigate = useNavigate();

  const expenses = data?.innerData || [];

  useEffect(() => {
    if (!Array.isArray(expenses)) return;
  
    let result = [...expenses];
    const today = dayjs();
  
    if (dateFilter === "today") {
      result = result.filter((e) => dayjs(e.createdAt).isSame(today, "day"));
    } else if (dateFilter === "week") {
      result = result.filter((e) => dayjs(e.createdAt).isAfter(today.subtract(7, "day")));
    } else if (dateFilter === "month") {
      result = result.filter((e) => dayjs(e.createdAt).isSame(today, "month"));
    } else if (
      dateFilter === "range" &&
      Array.isArray(range) &&
      range.length === 2 &&
      range[0] &&
      range[1]
    ) {
      result = result.filter((e) =>
        dayjs(e.createdAt).isBetween(range[0], range[1], null, "[]")
      );
    }
  
    if (Array.isArray(categoryFilter) && categoryFilter.length) {
      result = result.filter((e) => categoryFilter.includes(e.category));
    }
  
    // 🔒 Bu yerda filterlangan natija asl expenses bilan bir xilmi – shuni tekshirib chiqamiz
    const isSame = JSON.stringify(result) === JSON.stringify(filteredData);
    if (!isSame) {
      setFilteredData(result);
    }
  }, [expenses, dateFilter, range, categoryFilter]);
  
  const total = useMemo(() => {
    return filteredData.reduce((acc, cur) => acc + Number(cur.amount), 0);
  }, [filteredData]);

  const categoryStats = useMemo(() => {
    const stats = {};
    filteredData.forEach((e) => {
      stats[e.category] = (stats[e.category] || 0) + Number(e.amount);
    });
    return stats;
  }, [filteredData]);

  const topCategory = useMemo(() => {
    return Object.entries(categoryStats).sort((a, b) => b[1] - a[1])[0];
  }, [categoryStats]);

  const handleAdd = async () => {
    try {
      const values = await form.validateFields();
      await addExpense(values).unwrap();
      message.success("Xarajat qo‘shildi");
      form.resetFields();
      setShowAddModal(false);
      refetch();
    } catch {
      message.error("Xatolik yuz berdi");
    }
  };

  const handleDelete = async (id) => {
    await deleteExpense(id);
    refetch();
  };

  const columns = [
    {
      title: "Summa",
      dataIndex: "amount",
      render: (val) => `${val.toLocaleString()} so‘m`,
    },
    {
      title: "Kategoriya",
      dataIndex: "category",
    },
    {
      title: "Sabab",
      dataIndex: "reason",
    },
    {
      title: "Sana",
      dataIndex: "createdAt",
      render: (val) => dayjs(val).format("YYYY-MM-DD HH:mm"),
    },
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
            <Title level={3}>Xarajatlar <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowAddModal(true)}>
                Qo‘shish
              </Button>  
              
            </Title>
            <Button type="text" icon={<CloseOutlined style={{ fontSize: 20 }} />} onClick={() => navigate("/")} />
          </div>

          <Row gutter={16} className="expense-cards">
            <Col span={6}><Card title="Jami xarajat">{total.toLocaleString()} so‘m</Card></Col>
            <Col span={6}><Card title="Kategoriya soni">{Object.keys(categoryStats).length} ta</Card></Col>
            <Col span={12}><Card title="Eng ko‘p sarflangan">
              {topCategory ? `${topCategory[0]} — ${topCategory[1].toLocaleString()} so‘m` : "Ma’lumot yo‘q"}
            </Card></Col>
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
              mode="multiple"
              allowClear
              placeholder="Kategoriya tanlang"
              style={{ minWidth: 220 }}
              onChange={setCategoryFilter}
            >
              {["Oziq-ovqat", "Transport", "Ijara", "Kommunal", "Boshqa"].map((cat) => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
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
        width={500}
      >
        <Form layout="vertical" form={form}>
          <Form.Item name="amount" label="💰 Summa" rules={[{ required: true, message: "Summani kiriting" }]}> 
            <Input type="number" placeholder="Masalan: 25000" />
          </Form.Item>

          <Form.Item name="category" label="📦 Kategoriya" rules={[{ required: true, message: "Kategoriya tanlang" }]}> 
            <Select placeholder="Kategoriya tanlang">
              {["Oziq-ovqat", "Transport", "Ijara", "Kommunal", "Boshqa"].map((cat) => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="reason" label="📝 Sabab">
            <Input.TextArea rows={3} placeholder="Masalan: Nonushta uchun" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" onClick={handleAdd} block>
              Qo‘shish
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ModalHarajatlar;
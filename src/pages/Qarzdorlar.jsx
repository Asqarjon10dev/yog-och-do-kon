
import React, { useState } from "react";

import {
  Table,
  Button,
  Modal,
  Tag,
  Space,
  InputNumber,
  Col,
  Row,
  Popconfirm,
  Typography,


  message,
} from "antd";
import { FaEye } from "react-icons/fa";
import {
  useGetAllDebtsQuery,
  usePayDebtMutation,
} from "../context/debtApi"; // ✅ Sizda bor
import { toast } from "react-toastify";
import { CloseOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";



const Qarzdorlar = () => {
  const { data, isLoading, refetch } = useGetAllDebtsQuery();
  const [payDebt] = usePayDebtMutation();

  const [selectedDebt, setSelectedDebt] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const navigate = useNavigate();

  const handleOpen = (debt) => {
    setSelectedDebt(debt);
    setPayAmount(debt.debtAmount);
    setOpenModal(true);
  };

  
  const handleConfirm = async () => {
    if (!payAmount || payAmount <= 0 || payAmount > selectedDebt.debtAmount) {
      toast.warning("To‘lov miqdori noto‘g‘ri");
      return;
    }
  
    try {
      const res = await payDebt({
        id: selectedDebt._id,
        amount: payAmount,
      }).unwrap();
  
      toast.success("✅ To‘lov bajarildi");
      setOpenModal(false);
      refetch();
    } catch (err) {
      toast.error("❌ To‘lovda xatolik");
    }
  };
  

  const handlePayAll = async (debt) => {
    try {
      await payDebt({
        id: debt._id,
        amount: debt.debtAmount,
      }).unwrap();

      toast.success("✅ To‘liq to‘landi");
      refetch();
    } catch {
      toast.error("❌ To‘liq to‘lashda xatolik");
    }
  };

  const columns = [
    {
      title: "Ismi",
      dataIndex: "customerName",
    },
    {
      title: "Telefon",
      dataIndex: "customerPhone",
    },
    {
      title: "Qarz summasi",
      dataIndex: "debtAmount",
      render: (_, record) => (
        <Tag color="blue">
          {Number(record.debtAmount).toLocaleString()}{" "}
          {record.currency || "so'm"}
        </Tag>
      ),
    },
    {
      title: "Holat",
      dataIndex: "status",
      render: (status) => (
        <Tag
          color={
            status === "to‘langan"
              ? "green"
              : status === "qisman to‘langan"
              ? "orange"
              : "red"
          }
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Amallar",
      render: (_, record) => (
        <Space>
          <Button icon={<FaEye />} onClick={() => handleOpen(record)} />
          <Popconfirm
            title="To‘liq to‘lashga ishonchingiz komilmi?"
            onConfirm={() => handlePayAll(record)}
          >
            <Button danger>To‘liq to‘lash</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
       <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
        <Typography.Title level={3} style={{ margin: 0 }}>Qarzdorlar ro‘yxati</Typography.Title>
        </Col>
        <Col>
          <Button
            type="text"
            icon={<CloseOutlined style={{ fontSize: 20 }} />}
            onClick={() => navigate("/")}
          />
        </Col>
      </Row>

      <Table
        loading={isLoading}
        dataSource={data?.innerData || []}
        columns={columns}
        rowKey="_id"
        pagination={{ pageSize: 7 }}
      />

      <Modal
        open={openModal}
        title="💸 Qarzni to‘lash"
        onCancel={() => setOpenModal(false)}
        onOk={handleConfirm}
        okText="To‘lash"
        cancelText="Bekor"
      >
        {selectedDebt && (
          <>
            <p>
              <b>Ism:</b> {selectedDebt.customerName}
            </p>
            <p>
              <b>Jami qarz:</b>{" "}
              {Number(selectedDebt.debtAmount).toLocaleString()}{" "}
              {selectedDebt.currency || "so'm"}
            </p>
            <p>
              <b>To‘lov miqdori:</b>
            </p>
            <InputNumber
              value={payAmount}
              onChange={(val) => setPayAmount(val)}
              min={1}
              max={selectedDebt.debtAmount}
              style={{ width: "100%" }}
              placeholder="Masalan: 50000"
            />
          </>
        )}
      </Modal>
    </>
  );
};

export default Qarzdorlar;
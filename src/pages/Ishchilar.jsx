// 📁 Ishchilar.jsx
import React, { useState } from "react";
import {
  Table,
  Typography,
  Tag,
  Button,
  Modal,
  Row,
  Col,
  Form,
  Input,
  Select,
  InputNumber,
  message,
} from "antd";
import {
    useAddEmployeeMutation,
    useGetAllEmployeesQuery,
    useGiveSalaryMutation,
    useGetAllDepartmentsQuery,
    useGetSalaryHistoryQuery,
} from "../context/employeeApi";
import { useNavigate } from "react-router-dom";
import { CloseOutlined } from "@ant-design/icons";

const Ishchilar = () => {
  const { data: employeeData, isLoading, refetch } = useGetAllEmployeesQuery();
  const { data: historyData } = useGetSalaryHistoryQuery();
  const [addEmployee] = useAddEmployeeMutation();
  const [paySalary] = useGiveSalaryMutation();
  const navigate = useNavigate();


  const [openAddModal, setOpenAddModal] = useState(false);
  const [openSalaryModal, setOpenSalaryModal] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [form] = Form.useForm();
  const [formSalary] = Form.useForm();

  const roleColors = {
    admin: "volcano",
    menejer: "blue",
    oylik: "green",
    dagavor: "orange",
  };

  const handleAddEmployee = async (values) => {
    try {
      const res = await addEmployee(values);
      if (res?.data?.state) {
        message.success("✅ Ishchi qo‘shildi");
        form.resetFields();
        setOpenAddModal(false);
        refetch();
      } else {
        message.error("Xatolik: Ishchi qo‘shilmadi");
      }
    } catch (err) {
      message.error("Server xatoligi");
    }
  };

  const handlePaySalary = async (values) => {
    const selected = employeeData?.innerData?.find((e) => e._id === values.employeeId);
    const amount = selected?.salary || 0;
    const payload = {
      employeeId: values.employeeId,
      amount,
    };
    try {
      const res = await paySalary(payload);
      if (res?.data?.state) {
        message.success("✅ Oylik berildi");
        formSalary.resetFields();
        setOpenSalaryModal(false);
        refetch();
      } else {
        message.error("Xatolik: Oylik berilmadi");
      }
    } catch (err) {
      message.error("Server xatoligi");
    }
  };

  const columns = [
    { title: "Ismi", dataIndex: "fullName" }, // ✅ to‘g‘ri

    { title: "Tel", dataIndex: "phone" },
    {
        title: "Ish turi",
        dataIndex: "jobType",
        render: (role) =>
          role ? <Tag color={roleColors[role]}>{role.toUpperCase()}</Tag> : null,
      },
      
    { title: "Oylik", dataIndex: "salary" },
  ];

  const historyColumns = [
    {
      title: "Ism",
      render: (item) => item.employeeId?.fullName || "–",
    },
    {
      title: "Telefon",
      render: (item) => item.employeeId?.phone || "–",
    },
    {
      title: "Ish turi",
      render: (item) => item.employeeId?.jobType?.toUpperCase() || "–",
    },
    {
      title: "Summasi",
      dataIndex: "amount",
    },
    {
      title: "Vaqt",
      render: (item) =>
        new Date(item.date).toLocaleString("uz-UZ", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
  ];
  
  return (
    <div>
     <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
             <Col>
               <Typography.Title level={3}>Ishchilar</Typography.Title>
             </Col>
             <Col>
               <Button
                 type="text"
                 icon={<CloseOutlined style={{ fontSize: 20 }} />}
                 onClick={() => navigate("/")}
               />
             </Col>
           </Row>

      <Button type="primary" onClick={() => setOpenAddModal(true)}>
         Ishchi olish
      </Button>
      <Button onClick={() => setOpenSalaryModal(true)} style={{ marginLeft: 8 }}>
        Oylik berish
      </Button>
      <Button onClick={() => setOpenHistory(true)} style={{ marginLeft: 8 }}>
         Oylik tarixi
      </Button>

      <Table
        columns={columns}
        dataSource={employeeData?.innerData || employeeData?.message || []}
        loading={isLoading}
        rowKey="_id"
        pagination={{ pageSize: 8 }}
        style={{ marginTop: 16 }}
      />

      {/* Modal: Ishchi qo‘shish */}
     {/* Modal: Ishchi qo‘shish */}
<Modal
  title="➕ Yangi ishchi olish"
  open={openAddModal}
  onCancel={() => setOpenAddModal(false)}
  footer={false}
>
  <Form layout="vertical" onFinish={handleAddEmployee} form={form}>
    <Form.Item
     label="Ismi"
     name="fullName" // <<<< O'zgartirildi
     rules={[{ required: true, message: "'fullName' is required" }]}
    >
      <Input />
    </Form.Item>

    <Form.Item
  label="Telefon raqami"
  name="phone"
  rules={[
    { required: true, message: "Telefon raqami majburiy" },
    { pattern: /^[\d\s+]+$/, message: "Faqat raqamlar va bo‘sh joy bo‘lishi mumkin" }
  ]}
>
  <Input />
</Form.Item>


    <Form.Item
  label="Ish turi"
  name="jobType" // <<<< O'zgartirildi
  rules={[{ required: true, message: "'jobType' is required" }]}
  
    >
      <Select
        options={[
          { value: "oylik", label: "Oylik uchun ishlaydi" },
          { value: "dagavor", label: "Dagavorga ishlaydi" },
          { value: "menejer", label: "Menejer (5 mln)" },
        ]}
      />
    </Form.Item>

    <Form.Item
      label="Oylik summasi"
      name="salary"
      rules={[{ required: true, message: "'salary' is required" }]}
    >
      <InputNumber style={{ width: "100%" }} /> 
    </Form.Item>

    <Form.Item
  label="Login"
  name="username" 
  rules={[{ required: true, message: "'login' is required" }]}
>
  <Input />
</Form.Item>


    <Form.Item
      label="Parol"
      name="password"
      rules={[{ required: true, message: "'password' is required" }]}
    >
      <Input.Password />
    </Form.Item>

    <Form.Item>
      <Button htmlType="submit" type="primary" block>
        Saqlash
      </Button>
    </Form.Item>
  </Form>
</Modal>


      {/* Modal: Oylik berish */}
      <Modal
        title="💰 Oylik berish"
        open={openSalaryModal}
        onCancel={() => setOpenSalaryModal(false)}
        footer={false}
      >
        <Form layout="vertical" onFinish={handlePaySalary} form={formSalary}>
        <Form.Item name="employeeId" label="Ishchini tanlang" rules={[{ required: true }]}>
  <Select
    showSearch
    placeholder="Ism, tel orqali qidiring"
    onChange={(val) => {
      setSelectedEmployee(val);
      formSalary.setFieldsValue({ employeeId: val }); // << BU QISM MAJMURIY
    }}
    options={employeeData?.innerData?.map((e) => ({
      label: `${e.fullName} | ${e.phone}`, // ⚠️ "e.name" EMAS!
      value: e._id,
    }))}
  />
</Form.Item>


          {selectedEmployee && (
            <>
              <Form.Item label="Oylik summasi"> <Input value={employeeData?.innerData?.find(e => e._id === selectedEmployee)?.salary} disabled /> </Form.Item>
              <Form.Item><Button type="primary" htmlType="submit" block>Berish</Button></Form.Item>
            </>
          )}
        </Form>
      </Modal>

      {/* Modal: Oylik tarixi */}
      <Modal
        title="📄 Oylik tarixi"
        open={openHistory}
        onCancel={() => setOpenHistory(false)}
        footer={false}
        width={800}
      >
 <Table
  columns={historyColumns}
  dataSource={historyData?.innerData || []}
  rowKey="_id"
/>
      </Modal>
    </div>
  );
};

export default Ishchilar;
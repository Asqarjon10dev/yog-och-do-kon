// 📁 Ishchilar.jsx
import React, { useMemo, useState } from "react";

import { DatePicker } from "antd";
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
  Divider,
  Tooltip,
} from "antd";
import {
  useAddEmployeeMutation,
  useGetAllEmployeesQuery,
  useGiveSalaryMutation,
  
  useGetSalaryHistoryQuery,
  // ⬇️ Yangi hooklar (employeeApi da bo‘lishi kerak)
  useGiveAdvanceMutation,
  useUpdateEmployeeSalaryMutation ,
  useGetAdvanceHistoryQuery,
} from "../context/employeeApi";
import { useNavigate } from "react-router-dom";
import { CloseOutlined } from "@ant-design/icons";



const ADVANCE_LIMIT_PERCENT = 50; // Tavsiya: oylikning 50%

const Ishchilar = () => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [openEditSalary, setOpenEditSalary] = useState(false);
const [editForm] = Form.useForm();
const [updateSalary, { isLoading: isUpd }] = useUpdateEmployeeSalaryMutation();

const openEdit = (row) => {
  editForm.setFieldsValue({ id: row._id, salary: row.salary });
  setOpenEditSalary(true);
};

const submitEdit = async () => {
  const v = await editForm.validateFields();
  const res = await updateSalary({ id: v.id, salary: v.salary }).unwrap();
  if (res?.state) {
    message.success("✅ Oylik yangilandi");
    setOpenEditSalary(false);
  } else {
    message.error(res?.message || "Xatolik");
  }
};

  const { data: salaryHistory } = useGetSalaryHistoryQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  
  const { data: advanceHistory } = useGetAdvanceHistoryQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  
  const { data: employeeData, isLoading } = useGetAllEmployeesQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  

  // Queries

  // Mutations
  const [addEmployee] = useAddEmployeeMutation();
  const [paySalary] = useGiveSalaryMutation();
  const [giveAdvance] = useGiveAdvanceMutation();

  // UI states
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openSalaryModal, setOpenSalaryModal] = useState(false);
  const [openSalaryHistory, setOpenSalaryHistory] = useState(false);
  const [openAdvanceModal, setOpenAdvanceModal] = useState(false);
  const [openAdvanceHistory, setOpenAdvanceHistory] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [form] = Form.useForm();
  const [formSalary] = Form.useForm();
  const [formAdvance] = Form.useForm();

  const employees = useMemo(
    () => Array.isArray(employeeData?.innerData) ? employeeData.innerData : [],
    [employeeData]
  );

  const roleColors = {
    admin: "volcano",
    menejer: "blue",
    oylik: "green",
    dagavor: "orange",
  };

  // ✅ Ishchi qo‘shish
  const handleAddEmployee = async (values) => {
    try {
      const res = await addEmployee(values);
      if (res?.data?.state) {
        message.success("✅ Ishchi qo‘shildi");
        form.resetFields();
        setOpenAddModal(false);
      } else {
        message.error(res?.data?.message || "Xatolik: Ishchi qo‘shilmadi");
      }
    } catch {
      message.error("Server xatoligi");
    }
  };

 // ✅ Oylik berish (KIRITILGAN SUMMA + OY/YIL yuboramiz)
const handlePaySalary = async (values) => {
  try {
    const month = selectedMonth ? selectedMonth.month() + 1 : undefined; // 1..12
    const year  = selectedMonth ? selectedMonth.year() : undefined;

    const payload = {
      employeeId: values.employeeId,
      amount: values.amount,      // ← endi admin kiritadi
      month,
      year,
    };

    const res = await paySalary(payload).unwrap();
    if (res?.state) {
      message.success("✅ Oylik berildi");
      formSalary.resetFields();
      setSelectedMonth(null);
      setOpenSalaryModal(false);
    } else {
      message.error(res?.message || "Xatolik: Oylik berilmadi");
    }
  } catch (e) {
    message.error("Server xatoligi");
  }
};


  // ✅ Avans berish (oylik olgan/olmaganidan qat’i nazar ruxsat)
  const handleGiveAdvance = async (values) => {
    const selected = employees.find((e) => e._id === values.employeeId);
    const salary = selected?.salary || 0;
    const recommendedMax = Math.floor((salary * ADVANCE_LIMIT_PERCENT) / 100);

    if (salary > 0 && values.amount > recommendedMax) {
      // Faqat ogohlantiramiz, to‘xtatmaymiz
      message.warning(
        `⚠️ Tavsiya etilgan limit: ${ADVANCE_LIMIT_PERCENT}% (${recommendedMax} so‘m). Baribir davom etyapsiz.`
      );
    }

    try {
      const res = await giveAdvance({
        employeeId: values.employeeId,
        amount: values.amount,
        note: values.note || "",
      });
      if (res?.data?.state) {
        message.success("✅ Avans berildi");
        formAdvance.resetFields();
        setOpenAdvanceModal(false);
      } else {
        message.error(res?.data?.message || "Xatolik: Avans berilmadi");
      }
    } catch {
      message.error("Server xatoligi");
    }
  };

  const columns = [
    { title: "Ismi", dataIndex: "fullName" },
    { title: "Tel", dataIndex: "phone" },
    {
      title: "Ish turi",
      dataIndex: "jobType",
      render: (role) =>
        role ? <Tag color={roleColors[role]}>{String(role).toUpperCase()}</Tag> : null,
    },
    { title: "Oylik so'm", dataIndex: "salary"  },
    {
      title: "Harakat",
      render: (row) => (
        <Row gutter={8}>
          {/* Oylik berish */}
          <Col><Button size="small" onClick={() => { setOpenSalaryModal(true); formSalary.setFieldsValue({ employeeId: row._id }); }}>Oylik</Button></Col>
          {/* Avans */}
          {/* Oyligini o‘zgartirish */}
          <Col><Button size="small" onClick={() => openEdit(row)}>Maosh</Button></Col>
        </Row>
      ),
    }
    
  ];

  const salaryHistoryColumns = [
    { title: "Ism", render: (r) => r.employeeId?.fullName || "–" },
    { title: "Telefon", render: (r) => r.employeeId?.phone || "–" },
    { title: "Ish turi", render: (r) => r.employeeId?.jobType?.toUpperCase() || "–" },
  
    // yangi: oy/yil (agar backend saqlasa)
    { title: "Oy", render: (r) => (r.month && r.year ? `${r.month}.${r.year}` : "—") },
  
    { title: "Summasi", dataIndex: "amount" },
    { title: "Vaqt", render: (r) => (r?.date ? new Date(r.date).toLocaleString("uz-UZ", { hour12:false }) : "—") },
  ];
  
  const advanceHistoryColumns = [
    { title: "Ism", render: (r) => r.employeeId?.fullName || "–" },
    { title: "Telefon", render: (r) => r.employeeId?.phone || "–" },
    { title: "Ish turi", render: (r) => r.employeeId?.jobType?.toUpperCase() || "–" },
    { title: "Avans summasi", dataIndex: "amount" },
    { title: "Izoh", dataIndex: "note" },
    { title: "Vaqt", render: (r) => (r?.date ? new Date(r.date).toLocaleString("uz-UZ", { hour12:false }) : "—") },
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

      <Row gutter={8} style={{ marginBottom: 12 }}>
        <Col>
          <Button type="primary" onClick={() => setOpenAddModal(true)}>
            Ishchi olish
          </Button>
        </Col>
        <Col>
          <Button onClick={() => setOpenSalaryModal(true)}>Oylik berish</Button>
        </Col>
        <Col>
          <Button onClick={() => setOpenAdvanceModal(true)} type="dashed">
            Avans berish
          </Button>
        </Col>
        <Col>
          <Button onClick={() => setOpenSalaryHistory(true)}>Oylik tarixi</Button>
        </Col>
        <Col>
          <Button onClick={() => setOpenAdvanceHistory(true)}>Avans tarixi</Button>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={employees}
        loading={isLoading}
        rowKey="_id"
        pagination={{ pageSize: 8 }}
      />

      {/* ➕ Yangi ishchi */}
      <Modal
        title="Yangi ishchi olish"
        open={openAddModal}
        onCancel={() => setOpenAddModal(false)}
        footer={false}
        destroyOnClose
      >
        <Form layout="vertical" onFinish={handleAddEmployee} form={form}>
          <Form.Item
            label="Ismi"
            name="fullName"
            rules={[{ required: true, message: "'fullName' majburiy" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Telefon raqami"
            name="phone"
            rules={[
              { required: true, message: "Telefon raqami majburiy" },
              { pattern: /^[\d\s+]+$/, message: "Faqat raqamlar bo‘lsin" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Ish turi"
            name="jobType"
            rules={[{ required: true, message: "'jobType' majburiy" }]}
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
            rules={[{ required: true, message: "'salary' majburiy" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item
            label="Login"
            name="username"
            rules={[{ required: true, message: "'login' majburiy" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Parol"
            name="password"
            rules={[{ required: true, message: "'password' majburiy" }]}
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
      <Modal
  title="Ishchi oyligini o‘zgartirish"
  open={openEditSalary}
  onCancel={() => setOpenEditSalary(false)}
  onOk={submitEdit}
  confirmLoading={isUpd}
  destroyOnClose
>
  <Form layout="vertical" form={editForm}>
    <Form.Item name="id" hidden><Input /></Form.Item>
    <Form.Item label="Yangi oylik (so‘m)" name="salary" rules={[{ required: true, message: "Oylikni kiriting" }]}>
      <InputNumber style={{ width: "100%" }} min={0} step={1000} />
    </Form.Item>
  </Form>
</Modal>

      {/* 💰 Oylik berish */}
<Modal
  title="Oylik berish"
  open={openSalaryModal}
  onCancel={() => { setOpenSalaryModal(false); formSalary.resetFields(); setSelectedMonth(null); }}
  footer={false}
  destroyOnClose
>
  <Form layout="vertical" onFinish={handlePaySalary} form={formSalary}>
    <Form.Item
      name="employeeId"
      label="Ishchini tanlang"
      rules={[{ required: true, message: "Ishchini tanlang" }]}
    >
      <Select
        showSearch
        placeholder="Ism yoki tel..."
        options={employees.map((e) => ({
          label: `${e.fullName} | ${e.phone}`,
          value: e._id,
        }))}
        optionFilterProp="label"
      />
    </Form.Item>

    {/* Faqat ma’lumot uchun – hozirgi oyligi ko‘rinadi */}
    <Form.Item shouldUpdate noStyle>
      {() => {
        const id = formSalary.getFieldValue("employeeId");
        const emp = employees.find((e) => e._id === id);
        return (
          <Input
            style={{ marginBottom: 12 }}
            value={emp ? `Hozirgi oyligi: ${emp.salary} so‘m` : ""}
            disabled
          />
        );
      }}
    </Form.Item>

    {/* ✅ Admin o‘zi qancha berishni kiritadi */}
    <Form.Item
      name="amount"
      label="Beriladigan summa (so‘m)"
      rules={[{ required: true, message: "Summani kiriting" }]}
    >
      <InputNumber style={{ width: "100%" }} min={1} step={1000} />
    </Form.Item>

    {/* ✅ Qaysi oy uchun — Month picker */}
    <Form.Item
      label="Qaysi oy uchun"
      tooltip="Oylik hisoblanayotgan oy"
      required
    >
      <DatePicker
        picker="month"
        style={{ width: "100%" }}
        onChange={(d) => setSelectedMonth(d)}
      />
    </Form.Item>

    <Button type="primary" htmlType="submit" block>
      Oylikni berish
    </Button>
  </Form>
</Modal>


      {/* 💵 Avans berish */}
      <Modal
        title=" Avans berish"
        open={openAdvanceModal}
        onCancel={() => setOpenAdvanceModal(false)}
        footer={false}
        destroyOnClose
      >
        <Form layout="vertical" onFinish={handleGiveAdvance} form={formAdvance}>
          <Form.Item
            name="employeeId"
            label="Ishchini tanlang"
            rules={[{ required: true, message: "Ishchini tanlang" }]}
          >
            <Select
              showSearch
              placeholder="Ism yoki tel..."
              onChange={(val) => {
                setSelectedEmployee(val);
                formAdvance.setFieldsValue({ employeeId: val });
              }}
              options={employees.map((e) => ({
                label: `${e.fullName} | ${e.phone}`,
                value: e._id,
              }))}
              optionFilterProp="label"
            />
          </Form.Item>

          {selectedEmployee && (
            <>
              <Divider style={{ margin: "8px 0" }} />
              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item label="Xodim oyligi">
                    <Input
                      disabled
                      value={
                        employees.find((e) => e._id === selectedEmployee)?.salary || 0
                      }
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Tavsiya (maks)">
                    <Tooltip title={`Tavsiya: ${ADVANCE_LIMIT_PERCENT}%`}>
                      <Input
                        disabled
                        value={Math.floor(
                          ((employees.find((e) => e._id === selectedEmployee)?.salary ||
                            0) *
                            ADVANCE_LIMIT_PERCENT) / 100
                        )}
                      />
                    </Tooltip>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="amount"
                label="Avans summasi"
                rules={[{ required: true, message: "Avans summasini kiriting" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={1}
                  // Qo‘pol max: oylik (xohlasangiz olib tashlang)
                  max={
                    employees.find((e) => e._id === selectedEmployee)?.salary || undefined
                  }
                />
              </Form.Item>

              <Form.Item name="note" label="Izoh (ixtiyoriy)">
                <Input.TextArea rows={3} placeholder="Masalan: ‘oy o‘rtasi’" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Avansni berish
                </Button>
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      {/* 📄 Oylik tarixi */}
      <Modal
        title=" Oylik tarixi"
        open={openSalaryHistory}
        onCancel={() => setOpenSalaryHistory(false)}
        footer={false}
        width={900}
        destroyOnClose
      >
        <Table
          columns={salaryHistoryColumns}
          dataSource={salaryHistory?.innerData || []}
          rowKey="_id"
        />
      </Modal>

      {/* 🧾 Avans tarixi */}
      <Modal
        title=" Avans tarixi"
        open={openAdvanceHistory}
        onCancel={() => setOpenAdvanceHistory(false)}
        footer={false}
        width={900}
        destroyOnClose
      >
        <Table
          columns={advanceHistoryColumns}
          dataSource={advanceHistory?.innerData || []}
          rowKey="_id"
        />
      </Modal>
    </div>
  );
};

export default Ishchilar;

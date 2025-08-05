import React from "react";
import { Card, Form, Input, Button, Typography } from "antd";
import { useEmployeeLoginMutation } from "../context/employeeApi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const EmployeeLogin = () => {
  const [loginEmployee] = useEmployeeLoginMutation();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const res = await loginEmployee(values);
      if (res?.data?.state) {
        toast.success("✅ Tizimga muvaffaqiyatli kirdingiz!");
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("employeeId", res.data.employeeId);
        localStorage.setItem("role", res.data.role);
        navigate("/employee/profile"); // Login bo‘lgandan keyin yo‘naltiriladigan sahifa
      } else {
        toast.error(res.data.message || "❌ Login yoki parol noto‘g‘ri");
      }
    } catch (err) {
      toast.error("🔴 Server bilan ulanishda xatolik");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f0f2f5",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        }}
      >
        <Typography.Title level={3} style={{ textAlign: "center" }}>
          👷 Ishchi Login
        </Typography.Title>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Login"
            name="username"
            rules={[{ required: true, message: "Login kiriting" }]}
          >
            <Input placeholder="Login" />
          </Form.Item>

          <Form.Item
            label="Parol"
            name="password"
            rules={[{ required: true, message: "Parol kiriting" }]}
          >
            <Input.Password placeholder="Parol" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Kirish
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default EmployeeLogin;

import React from "react";
import { Form, Input, Button, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "../context/authApi";

const LoginPage = ({ setRole })=> {
  const [login, { isLoading }] = useLoginMutation();
  const navigate = useNavigate();

 
  const onFinish = async (values) => {
    try {
      const res = await login(values).unwrap();
      localStorage.setItem("token", res.token);
      localStorage.setItem("role", res.role);
      localStorage.setItem("employeeId", res.employeeId);
      setRole(res.role); // 🟢 YANGI

      if (res.role === "admin") navigate("/");
      else if (res.role === "sotuvchi") navigate("/sale");
      else if (res.role === "ishchi") navigate("/oylik-tarixi");
      
    } catch (err) {
      alert("❌ Login yoki parol noto‘g‘ri");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "100px auto" }}>
      <Typography.Title level={3}>🔐 Kirish</Typography.Title>
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item label="Login" name="username" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Parol" name="password" rules={[{ required: true }]}>
          <Input.Password />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={isLoading}>
          Kirish
        </Button>
      </Form>
    </div>
  );
};

export default LoginPage;

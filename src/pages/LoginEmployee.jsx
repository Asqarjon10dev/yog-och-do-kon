import React from "react";
import { Form, Input, Button, Typography } from "antd";
import { useEmployeeLoginMutation } from "../context/employeeApi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";


const LoginEmployee = () => {
  const [login, { isLoading }] = useEmployeeLoginMutation();

  const navigate = useNavigate();
  const onFinish = async (values) => {
    try {
      const res = await login(values).unwrap();
      const { token, employeeId, role, jobType } = res.innerData;
  
      localStorage.setItem("token", token);
      localStorage.setItem("employeeId", employeeId);
      localStorage.setItem("role", role || "employee"); // ⬅️ yagona employee roli
      localStorage.setItem("jobType", jobType || "");
  
      // Ishchi kirganda oylik tarixi sahifasiga
      if (role === "employee") {
        navigate("/oylik-tarixi");
      } else {
        toast.error("Ruxsat etilmagan rol!");
      }
    } catch {
      alert("Login yoki parol noto‘g‘ri");
    }
  };
  
  
  

  return (
    <div style={{ maxWidth: 400, margin: "80px auto" }}>
      <Typography.Title level={3}>Ishchi login</Typography.Title>
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

export default LoginEmployee;

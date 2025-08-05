import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children, roles }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" />;

  if (roles && !roles.includes(role)) {
    // 👇 noto‘g‘ri role bo‘lsa, umumiy sahifaga
    return <Navigate to="/" />;
  }

  return children;
};

export default PrivateRoute;

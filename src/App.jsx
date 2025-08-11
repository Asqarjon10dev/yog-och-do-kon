// 📁 App.jsx
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,

  useLocation,
  Navigate,
} from "react-router-dom";
import Sidebar from "./components/Saidbar";
import TopBar from "./components/TopBar";
import PrivateRoute from "./components/PrivateRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Mahsulotlar from "./pages/Mahsulotlar";
import Sotuvlar from "./pages/SotishTarix";
import Qarzdorlar from "./pages/Qarzdorlar";
import Ishchilar from "./pages/Ishchilar";
import Harajatlar from "./pages/Harajatlar";
import Statistka from "./pages/Statistka";
import LoginEmployee from "./pages/LoginEmployee";
import Sale from "./pages/Sale";
import OylikTarixi from "./pages/OylikTarixi"; // ✅ Qo‘shildi
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Layout = ({ children, role }) => {
  const { pathname } = useLocation();
  const isLoginPage =
    pathname === "/login" || pathname === "/employee/login";

  const isAdmin = role === "admin";
  const isEmployee = ["oylik", "dagavor", "menejer"].includes(role);

  return (
    <>
      <ToastContainer position="top-right" />
      {!isLoginPage && (
        <div style={{ position: "fixed", top: 0, width: "100%", zIndex: 1000 }}>
          <TopBar />
        </div>
      )}
      <div style={{ display: "flex", paddingTop: isLoginPage ? 0 : 25 }}>
        {!isLoginPage && role === "admin" && <Sidebar />}
        <div
          style={{
            marginLeft: !isLoginPage && isAdmin ? 220 : 0,
            padding: 40,
            flex: 1,
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
};

const App = () => {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const savedRole = localStorage.getItem("role");
    if (savedRole) setRole(savedRole);
  }, []);

  return (
    <Router>
      <Layout role={role}>

        {/* harajatlar uchun sahifalar */}



        <Routes>
          {/* 🔑 Login sahifalari */}
          <Route path="/login" element={<Login setRole={setRole} />} />
          <Route path="/employee/login" element={<LoginEmployee />} />

          {/* 🔐 Ishchilar uchun faqat oylik sahifasi */}
          <Route
  path="/oylik-tarixi"
  element={
    <PrivateRoute roles={["employee"]} loginPath="/employee/login">
      <OylikTarixi />
    </PrivateRoute>
  }
/>

            <Route 
            path="/harajatlar"
            element={
              <PrivateRoute roles={["admin"]}>
                <Harajatlar />
              </PrivateRoute>
            }
              />



          {/* Sotuvchi */}
          <Route
            path="/sale"
            element={
              <PrivateRoute roles={["sotuvchi"]}>
                <Sale />
              </PrivateRoute>
            }
          />



          {/* 🔒 Admin uchun sahifalar */}
          <Route
            path="/"
            element={
              <PrivateRoute roles={["admin"]}>
                <Home />
              </PrivateRoute>
            }
          />


          <Route
            path="/mahsulotlar"
            element={
              <PrivateRoute roles={["admin"]}>
                <Mahsulotlar />
              </PrivateRoute>
            }
          />
          <Route
            path="/sotuvlar"
            element={
              <PrivateRoute roles={["admin"]}>
                <Sotuvlar />
              </PrivateRoute>
            }
          />
          <Route
            path="/qarzdorlar"
            element={
              <PrivateRoute roles={["admin"]}>
                <Qarzdorlar />
              </PrivateRoute>
            }
          />
          <Route
            path="/ishchilar"
            element={
              <PrivateRoute roles={["admin"]}>
                <Ishchilar />
              </PrivateRoute>
            }
          />
          <Route
            path="/harajatlar"
            element={
              <PrivateRoute roles={["admin"]}>
                <Harajatlar />
              </PrivateRoute>
            }
          />
          <Route
            path="/statistika"
            element={
              <PrivateRoute roles={["admin"]}>
                <Statistka />
              </PrivateRoute>
            }
          />

          {/* 🚫 Agar noma'lum sahifaga kirilsa */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;

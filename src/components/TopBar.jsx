import React, { useState, useEffect } from "react";
import { InputNumber, Typography, Button, Space } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./TopBar.css";

const { Text } = Typography;

const TopBar = () => {
  const [showProfile, setShowProfile] = useState(false);
  const [usdValue, setUsdValue] = useState(1);
  const [uzsValue, setUzsValue] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(0);
  const navigate = useNavigate();

  const fetchRate = async () => {
    try {
      const res = await fetch("https://cbu.uz/oz/arkhiv-kursov-valyut/json/USD/");
      const data = await res.json();
      const rate = parseFloat(data[0]?.Rate || "0");
      setExchangeRate(rate);
      setUzsValue(usdValue * rate);
    } catch (err) {
      console.error("Kursni olishda xatolik:", err);
    }
  };

  useEffect(() => {
    fetchRate();
  }, []);

  useEffect(() => {
    if (exchangeRate) {
      setUzsValue((usdValue * exchangeRate).toFixed(2));
    }
  }, [usdValue, exchangeRate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const role = localStorage.getItem("role");

  return (
    <div className="topbar-container">
      <div className="currency-box">
        <Space align="center" wrap>
          <Text strong>$</Text>
          <InputNumber
            min={0}
            value={usdValue}
            onChange={(val) => setUsdValue(val || 0)}
            style={{ width: 80 }}
          />
          <Text>=</Text>
          <Text type="success" strong>
            {parseFloat(uzsValue).toLocaleString()} so‘m
          </Text>
          <Button icon={<ReloadOutlined />} onClick={fetchRate}>
            Yangilash
          </Button>
        </Space>
      </div>

      <div className="profile-area">
        <span>{role ? ` ${role}` : "kassa"}</span>
        <FaUserCircle
          className="user-icon"
          size={26}
          onClick={() => setShowProfile((prev) => !prev)}
        />
        {showProfile && (
          <div className="profile-menu">
            <p>{role}</p>
            <p className="logout" onClick={handleLogout}>
              Chiqish
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopBar;

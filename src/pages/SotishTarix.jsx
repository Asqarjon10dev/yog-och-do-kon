import React, { useState } from "react";
import { Tabs, Button } from "antd";
import Sotish from "./Home";
import SotuvTarixi from "./Sotuvlar";
import Taxrirlash from "./mahsulotTaxrirlash";
import { useNavigate } from "react-router-dom";
import { CloseOutlined } from "@ant-design/icons";
import { useGetAllProductsQuery } from "../context/productApi";

const Mahsulotlar = () => {
  const [activeTab, setActiveTab] = useState("add");
  const { data: allProducts, refetch } = useGetAllProductsQuery();
  const navigate = useNavigate();

  const items = [
    {
      key: "add",
      label: "Mahsulot sotish",
      children: <Sotish refetchProducts={refetch} />,
    },
    {
      key: "kirim",
      label: "Sotuv tarixi",
      children: <SotuvTarixi allProducts={allProducts} />,
    },
    {
      key: "taxrirlash",
      label: "Taxrirlash",
      children: <Taxrirlash allProducts={allProducts} refetch={refetch} />,
    },
  ];

  return (
    <div style={{ background: "white", height: "100%", minHeight: "100vh" }}>
      <Tabs
        defaultActiveKey="add"
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        items={items}
        type="line"
        tabBarExtraContent={{
          right: (
            <Button
              type="text"
              icon={<CloseOutlined style={{ fontSize: 20 }} />}
              onClick={() => navigate("/")}
            />
          ),
        }}
      />
    </div>
  );
};

export default Mahsulotlar;

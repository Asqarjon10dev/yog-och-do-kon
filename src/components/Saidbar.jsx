// src/components/Sidebar.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./Saidbar.css";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <h2 className="logo">Yog'och Do'kon</h2>
      <ul>
        <li><Link to="/mahsulotlar"> Mahsulotlar</Link></li>
        <li><Link to="/sotuvlar"> Sotuvlar</Link></li>
        <li><Link to="/qarzdorlar"> Qarzdorlar</Link></li>
        <li><Link to="/ishchilar"> Ishchilar</Link></li>
        <li><Link to="/harajatlar"> Harajatlar</Link></li>
        <li><Link to="/statistika"> Statistka</Link></li>
      </ul>
    </div>
  );
};

export default Sidebar;

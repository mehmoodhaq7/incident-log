import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.left}>
        <span style={styles.logo}>⚡</span>
        <Link to="/" style={styles.brand}>
          Incident Log
        </Link>
      </div>
      <div style={styles.right}>
        <Link to="/" style={styles.link}>
          Dashboard
        </Link>
        <Link to="/incidents" style={styles.link}>
          Incidents
        </Link>
        <span style={styles.role}>{user?.role}</span>
        <span style={styles.username}>{user?.name}</span>
        <button onClick={handleLogout} style={styles.button}>
          Logout
        </button>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    background: "#111118",
    borderBottom: "1px solid #1e1e2e",
    padding: "0 32px",
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logo: {
    fontSize: "24px",
  },
  brand: {
    color: "#f1f5f9",
    textDecoration: "none",
    fontWeight: "700",
    fontSize: "18px",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
  },
  link: {
    color: "#94a3b8",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
  },
  role: {
    background: "#1e1e2e",
    color: "#818cf8",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  username: {
    color: "#e2e8f0",
    fontSize: "14px",
    fontWeight: "500",
  },
  button: {
    background: "transparent",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#94a3b8",
    padding: "6px 14px",
    fontSize: "13px",
    cursor: "pointer",
  },
};

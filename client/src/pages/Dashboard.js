import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState({
    open: 0,
    in_progress: 0,
    resolved: 0,
    total: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/incidents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIncidents(res.data);
      setStats({
        total: res.data.length,
        open: res.data.filter((i) => i.status === "open").length,
        in_progress: res.data.filter((i) => i.status === "in_progress").length,
        resolved: res.data.filter((i) => i.status === "resolved").length,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const severityColor = (s) =>
    ({
      P1: "#ef4444",
      P2: "#f97316",
      P3: "#eab308",
      P4: "#22c55e",
    })[s] || "#64748b";

  const statusColor = (s) =>
    ({
      open: "#ef4444",
      in_progress: "#f97316",
      resolved: "#22c55e",
    })[s] || "#64748b";

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>War Room</h1>
          <p style={styles.subtitle}>Real-time incident overview</p>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          {[
            { label: "Total", value: stats.total, color: "#818cf8" },
            { label: "Open", value: stats.open, color: "#ef4444" },
            {
              label: "In Progress",
              value: stats.in_progress,
              color: "#f97316",
            },
            { label: "Resolved", value: stats.resolved, color: "#22c55e" },
          ].map((stat) => (
            <div key={stat.label} style={styles.statCard}>
              <div style={{ ...styles.statValue, color: stat.color }}>
                {stat.value}
              </div>
              <div style={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Recent Incidents */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Recent Incidents</h2>
            <button
              onClick={() => navigate("/incidents")}
              style={styles.viewAll}
            >
              View All →
            </button>
          </div>
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span>Title</span>
              <span>Severity</span>
              <span>Status</span>
              <span>Reporter</span>
              <span>Time</span>
            </div>
            {incidents.slice(0, 5).map((incident) => (
              <div
                key={incident.id}
                style={styles.tableRow}
                onClick={() => navigate(`/incidents/${incident.id}`)}
              >
                <span style={styles.incidentTitle}>{incident.title}</span>
                <span
                  style={{
                    ...styles.badge,
                    background: severityColor(incident.severity) + "22",
                    color: severityColor(incident.severity),
                  }}
                >
                  {incident.severity}
                </span>
                <span
                  style={{
                    ...styles.badge,
                    background: statusColor(incident.status) + "22",
                    color: statusColor(incident.status),
                  }}
                >
                  {incident.status.replace("_", " ")}
                </span>
                <span style={styles.reporter}>{incident.reporter_name}</span>
                <span style={styles.time}>
                  {new Date(incident.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
            {incidents.length === 0 && (
              <div style={styles.empty}>
                No incidents yet — system is calm ✅
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { background: "#0a0a0f", minHeight: "100vh" },
  container: { maxWidth: "1200px", margin: "0 auto", padding: "40px 32px" },
  header: { marginBottom: "40px" },
  title: { fontSize: "32px", fontWeight: "800", color: "#f1f5f9" },
  subtitle: { color: "#64748b", fontSize: "15px", marginTop: "6px" },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "40px",
  },
  statCard: {
    background: "#111118",
    border: "1px solid #1e1e2e",
    borderRadius: "12px",
    padding: "24px",
    textAlign: "center",
  },
  statValue: { fontSize: "40px", fontWeight: "800", marginBottom: "8px" },
  statLabel: {
    color: "#64748b",
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  section: {
    background: "#111118",
    border: "1px solid #1e1e2e",
    borderRadius: "12px",
    overflow: "hidden",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid #1e1e2e",
  },
  sectionTitle: { fontSize: "16px", fontWeight: "600", color: "#f1f5f9" },
  viewAll: {
    background: "transparent",
    border: "none",
    color: "#818cf8",
    cursor: "pointer",
    fontSize: "13px",
  },
  table: { width: "100%" },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
    padding: "12px 24px",
    color: "#475569",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "1px",
    borderBottom: "1px solid #1e1e2e",
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
    padding: "16px 24px",
    borderBottom: "1px solid #0f0f17",
    cursor: "pointer",
    alignItems: "center",
    transition: "background 0.2s",
  },
  incidentTitle: { color: "#e2e8f0", fontSize: "14px", fontWeight: "500" },
  badge: {
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    width: "fit-content",
  },
  reporter: { color: "#64748b", fontSize: "13px" },
  time: { color: "#475569", fontSize: "12px" },
  empty: {
    padding: "40px",
    textAlign: "center",
    color: "#475569",
    fontSize: "14px",
  },
};

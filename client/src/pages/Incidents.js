import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "P2",
  });
  const { user } = useAuth();
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
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post(`/api/incidents`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForm({ title: "", description: "", severity: "P2" });
      setShowForm(false);
      fetchIncidents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this incident?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/incidents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchIncidents();
    } catch (err) {
      console.error(err);
    }
  };

  const severityColor = (s) =>
    ({ P1: "#ef4444", P2: "#f97316", P3: "#eab308", P4: "#22c55e" })[s] ||
    "#64748b";
  const statusColor = (s) =>
    ({ open: "#ef4444", in_progress: "#f97316", resolved: "#22c55e" })[s] ||
    "#64748b";

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Incidents</h1>
            <p style={styles.subtitle}>{incidents.length} total incidents</p>
          </div>
          {user?.role === "admin" && (
            <button
              onClick={() => setShowForm(!showForm)}
              style={styles.newBtn}
            >
              {showForm ? "Cancel" : "+ New Incident"}
            </button>
          )}
        </div>

        {/* Create Form */}
        {showForm && (
          <div style={styles.formCard}>
            <h3 style={styles.formTitle}>Report New Incident</h3>
            <form onSubmit={handleCreate}>
              <input
                style={styles.input}
                placeholder="Incident Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <textarea
                style={{ ...styles.input, height: "100px", resize: "vertical" }}
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
              <select
                style={styles.input}
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
              >
                <option value="P1">P1 — Critical</option>
                <option value="P2">P2 — High</option>
                <option value="P3">P3 — Medium</option>
                <option value="P4">P4 — Low</option>
              </select>
              <button type="submit" style={styles.submitBtn}>
                Create Incident
              </button>
            </form>
          </div>
        )}

        {/* Incidents List */}
        <div style={styles.list}>
          {incidents.map((incident) => (
            <div key={incident.id} style={styles.card}>
              <div
                style={styles.cardLeft}
                onClick={() => navigate(`/incidents/${incident.id}`)}
              >
                <div style={styles.cardTop}>
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
                </div>
                <h3 style={styles.cardTitle}>{incident.title}</h3>
                <p style={styles.cardDesc}>
                  {incident.description?.slice(0, 100)}...
                </p>
                <p style={styles.cardMeta}>
                  Reported by {incident.reporter_name} ·{" "}
                  {new Date(incident.created_at).toLocaleDateString()}
                </p>
              </div>
              {user?.role === "admin" && (
                <div style={styles.cardActions}>
                  <button
                    onClick={() => navigate(`/incidents/${incident.id}`)}
                    style={styles.editBtn}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(incident.id)}
                    style={styles.deleteBtn}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
          {incidents.length === 0 && (
            <div style={styles.empty}>
              No incidents — all systems operational ✅
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { background: "#0a0a0f", minHeight: "100vh" },
  container: { maxWidth: "1200px", margin: "0 auto", padding: "40px 32px" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "32px",
  },
  title: { fontSize: "32px", fontWeight: "800", color: "#f1f5f9" },
  subtitle: { color: "#64748b", fontSize: "15px", marginTop: "6px" },
  newBtn: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  formCard: {
    background: "#111118",
    border: "1px solid #1e1e2e",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
  },
  formTitle: {
    color: "#f1f5f9",
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "16px",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    background: "#0a0a0f",
    border: "1px solid #1e1e2e",
    borderRadius: "8px",
    color: "#e2e8f0",
    fontSize: "14px",
    marginBottom: "12px",
    outline: "none",
    display: "block",
  },
  submitBtn: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    padding: "10px 24px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  list: { display: "flex", flexDirection: "column", gap: "12px" },
  card: {
    background: "#111118",
    border: "1px solid #1e1e2e",
    borderRadius: "12px",
    padding: "20px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLeft: { flex: 1, cursor: "pointer" },
  cardTop: { display: "flex", gap: "8px", marginBottom: "10px" },
  badge: {
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
  },
  cardTitle: {
    color: "#f1f5f9",
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "6px",
  },
  cardDesc: { color: "#64748b", fontSize: "13px", marginBottom: "8px" },
  cardMeta: { color: "#475569", fontSize: "12px" },
  cardActions: { display: "flex", gap: "8px", marginLeft: "16px" },
  editBtn: {
    background: "transparent",
    border: "1px solid #334155",
    borderRadius: "6px",
    color: "#94a3b8",
    padding: "6px 14px",
    fontSize: "13px",
    cursor: "pointer",
  },
  deleteBtn: {
    background: "transparent",
    border: "1px solid #7f1d1d",
    borderRadius: "6px",
    color: "#ef4444",
    padding: "6px 14px",
    fontSize: "13px",
    cursor: "pointer",
  },
  empty: {
    padding: "60px",
    textAlign: "center",
    color: "#475569",
    fontSize: "14px",
  },
};

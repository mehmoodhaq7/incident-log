import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function IncidentDetail() {
  const [incident, setIncident] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchIncident();
  }, []);

  const fetchIncident = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${process.env.REACT_APP_API}/api/incidents/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setIncident(res.data);
      setForm(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${process.env.REACT_APP_API}/api/incidents/${id}`,
        form,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setEditing(false);
      fetchIncident();
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

  if (!incident)
    return (
      <div
        style={{
          background: "#0a0a0f",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748b",
        }}
      >
        Loading...
      </div>
    );

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>
        <button onClick={() => navigate("/incidents")} style={styles.backBtn}>
          ← Back
        </button>

        <div style={styles.card}>
          {/* Header */}
          <div style={styles.cardHeader}>
            <div style={styles.badges}>
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
            {user?.role === "admin" && (
              <button
                onClick={() => setEditing(!editing)}
                style={styles.editBtn}
              >
                {editing ? "Cancel" : "Edit Incident"}
              </button>
            )}
          </div>

          {!editing ? (
            // View Mode
            <div>
              <h1 style={styles.title}>{incident.title}</h1>
              <p style={styles.meta}>
                Reported by{" "}
                <span style={styles.highlight}>{incident.reporter_name}</span> ·{" "}
                {new Date(incident.created_at).toLocaleString()}
              </p>

              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Description</h3>
                <p style={styles.text}>
                  {incident.description || "No description provided"}
                </p>
              </div>

              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Root Cause</h3>
                <p style={styles.text}>
                  {incident.root_cause || "Not identified yet"}
                </p>
              </div>

              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Resolution</h3>
                <p style={styles.text}>{incident.resolution || "Pending"}</p>
              </div>

              {incident.updated_at && (
                <p style={styles.updated}>
                  Last updated: {new Date(incident.updated_at).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            // Edit Mode
            <form onSubmit={handleUpdate}>
              <input
                style={styles.input}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Title"
                required
              />
              <textarea
                style={{ ...styles.input, height: "100px", resize: "vertical" }}
                value={form.description || ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Description"
              />
              <div style={styles.row}>
                <select
                  style={{ ...styles.input, flex: 1 }}
                  value={form.severity}
                  onChange={(e) =>
                    setForm({ ...form, severity: e.target.value })
                  }
                >
                  <option value="P1">P1 — Critical</option>
                  <option value="P2">P2 — High</option>
                  <option value="P3">P3 — Medium</option>
                  <option value="P4">P4 — Low</option>
                </select>
                <select
                  style={{ ...styles.input, flex: 1 }}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <textarea
                style={{ ...styles.input, height: "80px", resize: "vertical" }}
                value={form.root_cause || ""}
                onChange={(e) =>
                  setForm({ ...form, root_cause: e.target.value })
                }
                placeholder="Root Cause"
              />
              <textarea
                style={{ ...styles.input, height: "80px", resize: "vertical" }}
                value={form.resolution || ""}
                onChange={(e) =>
                  setForm({ ...form, resolution: e.target.value })
                }
                placeholder="Resolution"
              />
              <button type="submit" style={styles.saveBtn}>
                Save Changes
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { background: "#0a0a0f", minHeight: "100vh" },
  container: { maxWidth: "900px", margin: "0 auto", padding: "40px 32px" },
  backBtn: {
    background: "transparent",
    border: "none",
    color: "#64748b",
    fontSize: "14px",
    cursor: "pointer",
    marginBottom: "24px",
    padding: 0,
  },
  card: {
    background: "#111118",
    border: "1px solid #1e1e2e",
    borderRadius: "16px",
    padding: "32px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  badges: { display: "flex", gap: "8px" },
  badge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
  },
  editBtn: {
    background: "transparent",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#94a3b8",
    padding: "8px 16px",
    fontSize: "13px",
    cursor: "pointer",
  },
  title: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#f1f5f9",
    marginBottom: "10px",
  },
  meta: { color: "#475569", fontSize: "13px", marginBottom: "32px" },
  highlight: { color: "#818cf8" },
  section: {
    marginBottom: "24px",
    paddingBottom: "24px",
    borderBottom: "1px solid #1e1e2e",
  },
  sectionTitle: {
    color: "#64748b",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "10px",
  },
  text: { color: "#94a3b8", fontSize: "15px", lineHeight: "1.6" },
  updated: { color: "#334155", fontSize: "12px", marginTop: "16px" },
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
  row: { display: "flex", gap: "12px" },
  saveBtn: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    padding: "10px 24px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

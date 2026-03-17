const express = require("express");
const router = express.Router();
const db = require("../models/db");
const auth = require("../middleware/auth");

// Get all incidents
router.get("/", auth, async (req, res) => {
  try {
    const [incidents] = await db.execute(
      "SELECT i.*, u.name as reporter_name FROM incidents i JOIN users u ON i.reported_by = u.id ORDER BY i.created_at DESC",
    );
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single incident
router.get("/:id", auth, async (req, res) => {
  try {
    const [incidents] = await db.execute(
      "SELECT i.*, u.name as reporter_name FROM incidents i JOIN users u ON i.reported_by = u.id WHERE i.id = ?",
      [req.params.id],
    );
    if (incidents.length === 0)
      return res.status(404).json({ message: "Incident not found" });
    res.json(incidents[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create incident
router.post("/", auth, async (req, res) => {
  const { title, description, severity } = req.body;
  try {
    const [result] = await db.execute(
      "INSERT INTO incidents (title, description, severity, status, reported_by) VALUES (?, ?, ?, ?, ?)",
      [title, description, severity, "open", req.user.id],
    );
    res.status(201).json({ message: "Incident created", id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update incident
router.put("/:id", auth, async (req, res) => {
  const { title, description, severity, status, root_cause, resolution } =
    req.body;
  try {
    await db.execute(
      "UPDATE incidents SET title=?, description=?, severity=?, status=?, root_cause=?, resolution=? WHERE id=?",
      [
        title,
        description,
        severity,
        status,
        root_cause,
        resolution,
        req.params.id,
      ],
    );
    res.json({ message: "Incident updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete incident
router.delete("/:id", auth, async (req, res) => {
  try {
    await db.execute("DELETE FROM incidents WHERE id = ?", [req.params.id]);
    res.json({ message: "Incident deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

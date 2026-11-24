const router = require("express").Router();
const pool = require("../db");

const ALLOWED_STATUSES = ["Pending", "In progress", "Completed"];

function parseId(rawId) {
  if (!/^\d+$/.test(String(rawId))) return null;
  const num = Number(rawId);
  return Number.isInteger(num) && num > 0 ? num : null;
}

function validatePayload(body) {
  if (!body || typeof body !== "object") {
    return { error: "Request body must be a JSON object." };
  }

  const { title, category, description, status } = body;

  if (typeof title !== "string") {
    return { error: "Title must be text." };
  }
  const cleanTitle = title.trim();
  if (cleanTitle.length < 3 || cleanTitle.length > 80) {
    return { error: "Title must have 3 to 80 characters." };
  }

  if (typeof category !== "string") {
    return { error: "Category must be text." };
  }
  const cleanCategory = category.trim();
  if (cleanCategory.length < 2 || cleanCategory.length > 40) {
    return { error: "Category must have 2 to 40 characters." };
  }

  if (typeof description !== "string") {
    return { error: "Description must be text." };
  }
  const cleanDescription = description.trim();
  if (cleanDescription.length < 5 || cleanDescription.length > 300) {
    return { error: "Description must have 5 to 300 characters." };
  }

  if (typeof status !== "string" || !ALLOWED_STATUSES.includes(status.trim())) {
    return { error: "Status must be Pending, In progress, or Completed." };
  }

  return {
    data: {
      title: cleanTitle,
      category: cleanCategory,
      description: cleanDescription,
      status: status.trim(),
    },
  };
}

// GET all records
router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, title, category, description, status FROM records ORDER BY id ASC"
    );
    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET one record
router.get("/:id", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "Invalid record id." });
  }

  try {
    const result = await pool.query(
      "SELECT id, title, category, description, status FROM records WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Record not found." });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST create a record
router.post("/", async (req, res, next) => {
  const check = validatePayload(req.body);
  if (check.error || !check.data) {
    return res.status(400).json({ message: check.error || "Invalid request body." });
  }

  const { title, category, description, status } = check.data;

  try {
    const result = await pool.query(
      `INSERT INTO records (title, category, description, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, category, description, status`,
      [title, category, description, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT update all four editable fields of a record
router.put("/:id", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "Invalid record id." });
  }

  const check = validatePayload(req.body);
  if (check.error || !check.data) {
    return res.status(400).json({ message: check.error || "Invalid request body." });
  }

  const { title, category, description, status } = check.data;

  try {
    const result = await pool.query(
      `UPDATE records
       SET title = $1, category = $2, description = $3, status = $4
       WHERE id = $5
       RETURNING id, title, category, description, status`,
      [title, category, description, status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Record not found." });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE a record
router.delete("/:id", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "Invalid record id." });
  }

  try {
    const result = await pool.query(
      "DELETE FROM records WHERE id = $1 RETURNING id",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Record not found." });
    }
    res.status(200).json({ message: "Record deleted." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
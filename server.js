require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");
const recordsRouter = require("./routes/records");

const app = express();

const origins = (process.env.CLIENT_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

app.use(cors({ origin: origins }));
app.use(express.json());

// Step 8: API guide at the base URL
app.get("/", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>ICT251 Activity 7 API Guide</title>
    </head>
    <body>
      <h1>ICT251 Activity 7 Backend API</h1>
      <p><strong>Student Number:</strong> Your Student Number</p>
      <p><strong>System Description:</strong> Backend API for ICT251 Activity 7 records management.</p>
      <p><strong>Base URL:</strong> ${baseUrl}</p>
      <p>
        <a href="/health">/health</a> |
        <a href="/api/records">/api/records</a>
      </p>

      <h2>Routes</h2>
      <table border="1" cellpadding="6">
        <tr><th>Method</th><th>Route</th><th>Purpose</th></tr>
        <tr><td>GET</td><td>/</td><td>API guide for the marker</td></tr>
        <tr><td>GET</td><td>/health</td><td>Check server and database status</td></tr>
        <tr><td>GET</td><td>/api/records</td><td>Read all records</td></tr>
        <tr><td>GET</td><td>/api/records/:id</td><td>Read one record by ID</td></tr>
        <tr><td>POST</td><td>/api/records</td><td>Create a new record</td></tr>
        <tr><td>PUT</td><td>/api/records/:id</td><td>Replace all four editable fields of a record</td></tr>
        <tr><td>DELETE</td><td>/api/records/:id</td><td>Delete a record by ID</td></tr>
      </table>

      <h2>Fields &amp; Allowed Statuses</h2>
      <ul>
        <li><code>title</code>: string, 3 to 80 characters</li>
        <li><code>category</code>: string, 2 to 40 characters</li>
        <li><code>description</code>: string, 5 to 300 characters</li>
        <li><code>status</code>: <code>Pending</code>, <code>In progress</code>, or <code>Completed</code></li>
      </ul>

      <h2>Sample POST / PUT Body</h2>
      <pre>{
  "title": "Broken classroom light",
  "category": "Electrical",
  "description": "The light in Room B12 does not switch on.",
  "status": "Pending"
}</pre>

      <h2>Status Codes &amp; Hosting Note</h2>
      <p>Success codes: 200 (OK) and 201 (Created). Error codes: 400 (invalid input, invalid ID, or malformed JSON), 404 (record or route not found), and 500 (server error; /health may return 503 on DB failure).</p>
      <p>Note: Free-tier hosting may sleep when idle, so the first request after a pause can take a little longer to respond.</p>
    </body>
    </html>
  `);
});

// Health check
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", db: "connected" });
  } catch (err) {
    console.error("Health check failed:", err.message);
    res.status(503).json({ status: "error", db: "disconnected" });
  }
});

// Mount records router
app.use("/api/records", recordsRouter);

// 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// Error handler (4 parameters)
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Malformed JSON in request body." });
  }

  res.status(500).json({ message: "Internal server error." });
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});
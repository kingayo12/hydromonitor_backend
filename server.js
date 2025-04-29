// server.js
require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;
const API_TOKEN = process.env.TREFLE_API_TOKEN;

if (!API_TOKEN) {
  throw new Error("❌ Missing TREFLE_API_TOKEN in environment variables.");
}

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoint for health check
app.get("/", (req, res) => {
  res.send("🌱 Plant API Server Running");
});

// Get list of plants (with optional pagination and search)
app.get("/api/plants", async (req, res) => {
  const { page = 1, q = "" } = req.query;
  const trefleUrl = `https://trefle.io/api/v1/plants?token=${API_TOKEN}&page=${page}&q=${q}`;

  try {
    const response = await fetch(trefleUrl);
    if (!response.ok) {
      return res.status(response.status).json({
        error: `Trefle API Error: ${response.statusText}`,
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Trefle API fetch error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get specific plant details by ID
app.get("/api/plants/:id", async (req, res) => {
  const { id } = req.params;
  const treflePlantUrl = `https://trefle.io/api/v1/plants/${id}?token=${API_TOKEN}`;

  try {
    const response = await fetch(treflePlantUrl);
    if (!response.ok) {
      console.error(
        `Trefle API error (plant details): ${response.status} - ${response.statusText}`,
      );
      return res
        .status(response.status)
        .json({ error: "Failed to fetch plant details from Trefle API" });
    }

    const data = await response.json();

    // Extract temperature, humidity, and growth data
    const details = {
      ...data.data,
      min_temp: data.data?.growth?.minimum_temperature?.deg_c,
      max_temp: data.data?.growth?.maximum_temperature?.deg_c,
      min_humidity: data.data?.growth?.minimum_relative_humidity,
      max_humidity: data.data?.growth?.maximum_relative_humidity,
      // Add more if needed
    };

    res.json(details);
  } catch (error) {
    console.error("Error fetching plant details from Trefle API:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});

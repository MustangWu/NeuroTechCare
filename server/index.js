import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME || "neurotechcare",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "",
    });

const app = express();
app.use(cors());
app.use(express.json());

// Graph 1: Burden of disease due to neurological conditions by sex and year (2003–2024)
// Returns total DALYs per disease per year for "Persons" / "Total" age group
app.get("/api/neurological-burden-trend", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT year, disease, daly
      FROM neurological_burden
      WHERE sex = 'Persons' AND age_group = 'Total'
      ORDER BY year, disease
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

// Graph 2: Leading causes of disease burden (DALYs) in 2024, by sex and age
// Returns total DALYs per disease in 2024 for each sex, "Total" age group
app.get("/api/neurological-burden-2024", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT disease, sex, daly
      FROM neurological_burden
      WHERE year = 2024 AND age_group = 'Total'
      ORDER BY daly DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

// Graph 3: Australians living with dementia by sex and age group, 2025–2065
app.get("/api/dementia-prevalence", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT year, men, women, persons, age_30_64, age_65_84, age_85_plus
      FROM dementia_prevalence
      WHERE year >= 2025
      ORDER BY year
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

// Graph 4: Deaths due to dementia by sex, with crude and age-standardised rates (2009–2023)
app.get("/api/dementia-mortality", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        year,
        deaths_men, deaths_women, deaths_persons,
        asr_men, asr_women, asr_persons,
        crude_men, crude_women, crude_persons
      FROM dementia_mortality
      ORDER BY year
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

// Serve Vite build in production
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "../dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});

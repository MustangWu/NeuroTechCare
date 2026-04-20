require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3001;

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME || "neurotechcare",
      user: process.env.DB_USER || process.env.USER || "postgres",
      password: process.env.DB_PASSWORD || "",
    });

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "NeuroTechCare API running" });
});

// Dropdown: distinct neurological conditions
app.get("/api/neurological-conditions", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT disease FROM neurological_burden ORDER BY disease`
    );
    res.json(result.rows.map((r) => r.disease));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

// Chart 1: Burden by age group (bar + line)
const AGE_GROUPS = ["Under 30", "30\u201364", "65\u201369", "70\u201374", "75\u201379", "80\u201384", "85+"];

app.get("/api/neurological-burden-by-age", async (_req, res) => {
  try {
    const year = parseInt(_req.query.year) || 2024;
    const sex = _req.query.sex || "Persons";
    const measure = _req.query.measure || "daly";
    const disease = _req.query.disease || "";

    const rateCol =
      measure === "yll" ? "crude_yll_rate" :
      measure === "yld" ? "crude_yld_rate" : "crude_daly_rate";
    const valCol =
      measure === "yll" ? "yll" :
      measure === "yld" ? "yld" : "daly";

    const ageDiseaseFilter = disease ? `AND disease = $3` : "";
    const ageParams = disease ? [year, sex, disease] : [year, sex];

    const kpiDiseaseFilter = disease ? `AND disease = $2` : "";
    const kpiParams = disease ? [year, disease] : [year];

    const ageResult = await pool.query(
      `SELECT age_group,
              SUM(${valCol}) AS value,
              SUM(${rateCol}) AS crude_rate
       FROM neurological_burden
       WHERE year = $1 AND sex = $2 AND age_group != 'Total'
       ${ageDiseaseFilter}
       GROUP BY age_group
       ORDER BY CASE age_group
         WHEN '0' THEN 0 WHEN '1\u20134' THEN 1 WHEN '5\u20139' THEN 2
         WHEN '10\u201314' THEN 3 WHEN '15\u201319' THEN 4 WHEN '20\u201324' THEN 5
         WHEN '25\u201329' THEN 6 WHEN '30\u201334' THEN 7 WHEN '35\u201339' THEN 8
         WHEN '40\u201344' THEN 9 WHEN '45\u201349' THEN 10 WHEN '50\u201354' THEN 11
         WHEN '55\u201359' THEN 12 WHEN '60\u201364' THEN 13 WHEN '65\u201369' THEN 14
         WHEN '70\u201374' THEN 15 WHEN '75\u201379' THEN 16 WHEN '80\u201384' THEN 17
         WHEN '85\u201389' THEN 18 WHEN '90\u201394' THEN 19 WHEN '95\u201399' THEN 20
         WHEN '100+' THEN 21 ELSE 99 END`,
      ageParams
    );

    const kpiResult = await pool.query(
      `SELECT sex, SUM(${valCol}) AS total
       FROM neurological_burden
       WHERE year = $1 AND age_group = 'Total'
       ${kpiDiseaseFilter}
       GROUP BY sex`,
      kpiParams
    );

    res.json({ ageGroups: ageResult.rows, kpis: kpiResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

// Chart 2: Top 10 causes of burden (DALY)
app.get("/api/burden-top10", async (_req, res) => {
  try {
    const sex = _req.query.sex || "Persons";
    const ageFrom = Math.max(0, Math.min(6, parseInt(_req.query.age_from) || 0));
    const ageTo   = Math.max(0, Math.min(6, parseInt(_req.query.age_to)   || 6));

    const selectedGroups = AGE_GROUPS.slice(
      Math.min(ageFrom, ageTo),
      Math.max(ageFrom, ageTo) + 1
    );
    const useTotal = selectedGroups.length === AGE_GROUPS.length;
    const filterGroups = useTotal ? ["Total"] : selectedGroups;

    const result = await pool.query(
      `SELECT disease, SUM(daly) AS daly
       FROM dementia_burden_of_disease
       WHERE sex = $1 AND age_group = ANY($2::text[])
       GROUP BY disease
       ORDER BY SUM(daly) DESC
       LIMIT 10`,
      [sex, filterGroups]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

// Chart 3: Dementia prevalence projections 2025–2065
app.get("/api/dementia-prevalence", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT year, men, women, persons, age_30_64, age_65_84, age_85_plus
       FROM dementia_prevalence WHERE year >= 2025 ORDER BY year`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

// Chart 4: Dementia mortality 2009–2023
app.get("/api/dementia-mortality", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT year,
              deaths_men, deaths_women, deaths_persons,
              asr_men, asr_women, asr_persons,
              crude_men, crude_women, crude_persons
       FROM dementia_mortality ORDER BY year`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});

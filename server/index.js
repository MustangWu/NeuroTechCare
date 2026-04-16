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

// Lookup: distinct neurological conditions for the dropdown
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

// Graph 1: Burden of disease by age group — combo bar (DALY) + line (crude rate)
// Query params: year, sex, measure (daly|yll|yld), disease (default: all)
app.get("/api/neurological-burden-by-age", async (_req, res) => {
  try {
    const year = parseInt(_req.query.year) || 2024;
    const sex = _req.query.sex || "Persons";
    const measure = _req.query.measure || "daly";
    const disease = _req.query.disease || ""; // empty = all conditions

    const rateCol =
      measure === "yll"
        ? "crude_yll_rate"
        : measure === "yld"
        ? "crude_yld_rate"
        : "crude_daly_rate";
    const valCol = measure === "yll" ? "yll" : measure === "yld" ? "yld" : "daly";

    // Age query: $1=year, $2=sex, $3=disease (optional)
    const ageDiseaseFilter = disease ? `AND disease = $3` : "";
    const ageParams = disease ? [year, sex, disease] : [year, sex];

    // KPI query: $1=year, $2=disease (optional) — groups by sex so no sex param needed
    const kpiDiseaseFilter = disease ? `AND disease = $2` : "";
    const kpiParams = disease ? [year, disease] : [year];

    // Age-group breakdown (exclude Total)
    const ageResult = await pool.query(
      `SELECT age_group,
              SUM(${valCol}) AS value,
              SUM(${rateCol}) AS crude_rate
       FROM neurological_burden
       WHERE year = $1 AND sex = $2 AND age_group != 'Total'
       ${ageDiseaseFilter}
       GROUP BY age_group
       ORDER BY CASE age_group
         WHEN '0' THEN 0 WHEN '1–4' THEN 1 WHEN '5–9' THEN 2
         WHEN '10–14' THEN 3 WHEN '15–19' THEN 4 WHEN '20–24' THEN 5
         WHEN '25–29' THEN 6 WHEN '30–34' THEN 7 WHEN '35–39' THEN 8
         WHEN '40–44' THEN 9 WHEN '45–49' THEN 10 WHEN '50–54' THEN 11
         WHEN '55–59' THEN 12 WHEN '60–64' THEN 13 WHEN '65–69' THEN 14
         WHEN '70–74' THEN 15 WHEN '75–79' THEN 16 WHEN '80–84' THEN 17
         WHEN '85–89' THEN 18 WHEN '90–94' THEN 19 WHEN '95–99' THEN 20
         WHEN '100+' THEN 21 ELSE 99 END`,
      ageParams
    );

    // KPI totals for all three sex categories (respect disease filter)
    const kpiResult = await pool.query(
      `SELECT sex, SUM(${valCol}) AS total
       FROM neurological_burden
       WHERE year = $1 AND age_group = 'Total'
       ${kpiDiseaseFilter}
       GROUP BY sex`,
      kpiParams
    );

    res.json({
      ageGroups: ageResult.rows,
      kpis: kpiResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

// Graph 2: Leading 10 causes of disease burden (DALYs), 2024
// Query params: sex (default Persons), age_from (index 0-6), age_to (index 0-6)
// Age group order: Under 30, 30–64, 65–69, 70–74, 75–79, 80–84, 85+
const AGE_GROUPS = ["Under 30", "30–64", "65–69", "70–74", "75–79", "80–84", "85+"];

app.get("/api/burden-top10", async (_req, res) => {
  try {
    const sex = _req.query.sex || "Persons";
    const ageFrom = Math.max(0, Math.min(6, parseInt(_req.query.age_from) || 0));
    const ageTo   = Math.max(0, Math.min(6, parseInt(_req.query.age_to)   || 6));

    const selectedGroups = AGE_GROUPS.slice(
      Math.min(ageFrom, ageTo),
      Math.max(ageFrom, ageTo) + 1
    );

    // If full range selected, use the pre-aggregated "Total" row for accuracy
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

const PORT = process.env.PORT || process.env.API_PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});

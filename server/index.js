import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { ElevenLabsClient } from "elevenlabs";

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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("audio/")) cb(null, true);
    else cb(new Error("Invalid file type. Only audio files are accepted."));
  },
});

const EC2_ENDPOINT = process.env.EC2_ENDPOINT || null;
const elevenlabs = process.env.ELEVENLABS_API_KEY
  ? new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })
  : null;

function formatTimestamp(seconds) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function buildTimestampedTranscript(words) {
  const segments = [];
  let current = null;

  for (const word of words) {
    if (word.type !== "word") continue;
    if (!current) {
      current = { start: word.start, end: word.end, words: [word.text] };
    } else if (word.start - current.end > 1.5) {
      segments.push(current);
      current = { start: word.start, end: word.end, words: [word.text] };
    } else {
      current.end = word.end;
      current.words.push(word.text);
    }
  }
  if (current) segments.push(current);

  return segments
    .map(s => `[${formatTimestamp(s.start)} - ${formatTimestamp(s.end)}] ${s.words.join(" ")}`)
    .join("\n");
}

async function transcribeAudio(audioBuffer, filename) {
  if (!elevenlabs) return "[Transcript — ELEVENLABS_API_KEY not set]";
  const result = await elevenlabs.speechToText.convert({
    file: new Blob([audioBuffer], { type: "audio/wav" }),
    model_id: "scribe_v1",
  });
  return result.words?.length ? buildTimestampedTranscript(result.words) : result.text;
}

async function callMLInference(audioBuffer, filename) {
  const text_transcript = await transcribeAudio(audioBuffer, filename);

  if (EC2_ENDPOINT) {
    const response = await fetch(EC2_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: text_transcript, max_new_tokens: 300 }),
    });
    if (!response.ok) throw new Error(`ML inference failed: ${response.statusText}`);
    const mlResult = await response.json();
    return { ...mlResult, text_transcript };
  }

  // Stub: returns mock data until EC2 endpoint is ready
  return {
    text_transcript,
    mlu_score: 8.5,
    pause_ratio: 0.12,
    type_token_ratio: 0.65,
    filler_word_count: 3,
    syntactic_complexity: 2.1,
    dementia_risk_level: "Low Risk",
    confidence_score: 0.82,
    trend_direction: "stable",
  };
}

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

// Upload audio, run ML inference, store results
app.post("/api/recordings", upload.single("audio"), async (req, res) => {
  const { patient_id, recording_date } = req.body;
  const audioFile = req.file;

  if (!patient_id || !audioFile) {
    return res.status(400).json({ error: "patient_id and audio file are required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const mlResult = await callMLInference(audioFile.buffer, audioFile.originalname);

    const { rows: [rec] } = await client.query(
      `INSERT INTO recording (recording_date, text_transcript, patient_id)
       VALUES ($1, $2, $3) RETURNING recording_id`,
      [recording_date || new Date().toISOString().split("T")[0], mlResult.text_transcript, patient_id]
    );

    const { rows: [analysis] } = await client.query(
      `INSERT INTO biomarker_analysis
         (mlu_score, pause_ratio, type_token_ratio, filler_word_count, syntactic_complexity, recording_id, patient_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING analysis_id`,
      [mlResult.mlu_score, mlResult.pause_ratio, mlResult.type_token_ratio,
       mlResult.filler_word_count, mlResult.syntactic_complexity, rec.recording_id, patient_id]
    );

    await client.query(
      `INSERT INTO risk_assessment (dementia_risk_level, confidence_score, trend_direction, analysis_id)
       VALUES ($1, $2, $3, $4)`,
      [mlResult.dementia_risk_level, mlResult.confidence_score, mlResult.trend_direction, analysis.analysis_id]
    );

    // Keep patient's current risk_level and last_visit up to date
    await client.query(
      `UPDATE patient SET risk_level = $1, last_visit = $2 WHERE patient_id = $3`,
      [mlResult.dementia_risk_level, recording_date || new Date().toISOString().split("T")[0], patient_id]
    );

    await client.query("COMMIT");

    res.status(201).json({
      recording_id: rec.recording_id,
      analysis_id: analysis.analysis_id,
      transcript: mlResult.text_transcript,
      biomarkers: {
        mlu_score: mlResult.mlu_score,
        pause_ratio: mlResult.pause_ratio,
        type_token_ratio: mlResult.type_token_ratio,
        filler_word_count: mlResult.filler_word_count,
        syntactic_complexity: mlResult.syntactic_complexity,
      },
      risk: {
        dementia_risk_level: mlResult.dementia_risk_level,
        confidence_score: mlResult.confidence_score,
        trend_direction: mlResult.trend_direction,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to process recording" });
  } finally {
    client.release();
  }
});

// Patient biomarker history (JOIN query — no separate history table needed)
app.get("/api/patients/:patientId/history", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         BA.analysis_id,
         BA.analysis_timestamp,
         BA.mlu_score,
         BA.pause_ratio,
         BA.type_token_ratio,
         BA.filler_word_count,
         BA.syntactic_complexity,
         RA.dementia_risk_level,
         RA.confidence_score,
         RA.trend_direction,
         R.recording_date,
         R.text_transcript
       FROM biomarker_analysis BA
       JOIN risk_assessment RA ON BA.analysis_id = RA.analysis_id
       JOIN recording R ON BA.recording_id = R.recording_id
       WHERE BA.patient_id = $1
       ORDER BY BA.analysis_timestamp DESC`,
      [req.params.patientId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

// Patient lookup by patient_id (e.g. "PT2024001")
app.get("/api/patients/:patientId", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT patient_id, name, age, gender, risk_level, last_visit FROM patient WHERE patient_id = $1`,
      [req.params.patientId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

// Create a new patient profile
app.post("/api/patients", async (req, res) => {
  try {
    const { patient_id, name, age, gender, created_by } = req.body;
    if (!patient_id || !name || !age || !gender) {
      return res.status(400).json({ error: "patient_id, name, age, and gender are required" });
    }
    const result = await pool.query(
      `INSERT INTO patient (patient_id, name, age, gender, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING patient_id, name, age, gender, risk_level, last_visit`,
      [patient_id, name, parseInt(age), gender, created_by || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "A patient with this ID already exists" });
    }
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

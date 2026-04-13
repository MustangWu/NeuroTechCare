import React, { useEffect, useState } from "react";
import { Navigation } from "../components/Navigation";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BurdenTrendRow = {
  year: number;
  disease: string;
  daly: number;
};

type Burden2024Row = {
  disease: string;
  sex: string;
  daly: number;
};

type PrevalenceRow = {
  year: number;
  men: number;
  women: number;
  persons: number;
  age_30_64: number;
  age_65_84: number;
  age_85_plus: number;
};

type MortalityRow = {
  year: number;
  deaths_men: number;
  deaths_women: number;
  deaths_persons: number;
  asr_men: number;
  asr_women: number;
  asr_persons: number;
  crude_men: number;
  crude_women: number;
  crude_persons: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [url]);

  return { data, loading, error };
}

function ChartShell({
  title,
  subtitle,
  loading,
  error,
  children,
}: {
  title: string;
  subtitle: string;
  loading: boolean;
  error: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white p-8 border-2 border-gray-400">
      <h2 className="text-xl font-bold text-gray-900 mb-1">{title}</h2>
      <p className="text-sm text-gray-600 mb-6">{subtitle}</p>
      {loading && (
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
          Loading…
        </div>
      )}
      {error && (
        <div className="h-64 flex items-center justify-center text-red-500 text-sm">
          Failed to load data: {error}
        </div>
      )}
      {!loading && !error && children}
    </div>
  );
}

const DISEASE_COLORS: Record<string, string> = {
  Dementia: "#1f2937",
  Epilepsy: "#4b5563",
  Migraine: "#6b7280",
  "Parkinson Disease": "#9ca3af",
  "Motor Neurone Disease": "#d1d5db",
  "Multiple Sclerosis": "#374151",
  "Guillain-Barre Syndrome": "#111827",
  "Other Neurological Conditions": "#e5e7eb",
};

const biomarkers = [
  {
    name: "Mean Length of Utterance (MLU)",
    description:
      "Measures the average number of words per sentence. Cognitive decline often shortens sentence length as patients struggle to maintain complex grammar and thought structures.",
  },
  {
    name: "Pause Ratio",
    description:
      "Tracks the frequency and duration of pauses during speech. Increased hesitation can indicate slowed verbal processing and word-retrieval difficulties common in early dementia.",
  },
  {
    name: "Type-Token Ratio (TTR)",
    description:
      "Measures lexical diversity — the proportion of unique words used. A declining TTR reflects reduced vocabulary, a hallmark of early Alzheimer's and MCI.",
  },
  {
    name: "Filler Word Count",
    description:
      'Counts words like "um", "uh", and "you know". A rising filler rate signals word-finding difficulty, one of the earliest detectable signs of cognitive impairment.',
  },
];

const comparisonRows = [
  {
    feature: "Administration time",
    biomarker: "Passive — recorded during routine consultation",
    mmse: "5–10 minutes",
    moca: "10–15 minutes",
  },
  {
    feature: "Patient burden",
    biomarker: "None — no extra tests required",
    mmse: "Moderate",
    moca: "Moderate",
  },
  {
    feature: "Sensitivity to early MCI",
    biomarker: "High",
    mmse: "Low",
    moca: "Moderate",
  },
  {
    feature: "Objectivity",
    biomarker: "Algorithmic — no examiner bias",
    mmse: "Examiner-dependent",
    moca: "Examiner-dependent",
  },
  {
    feature: "Detects pre-symptomatic decline",
    biomarker: "Yes",
    mmse: "No",
    moca: "Limited",
  },
  {
    feature: "Repeatable over time",
    biomarker: "Yes — every consultation",
    mmse: "Practice effect limits reuse",
    moca: "Practice effect limits reuse",
  },
];

// ---------------------------------------------------------------------------
// Graph 1 — Neurological burden trend 2003–2024
// ---------------------------------------------------------------------------

function BurdenTrendChart() {
  const { data, loading, error } = useFetch<BurdenTrendRow[]>(
    "/api/neurological-burden-trend"
  );

  const chartData = (() => {
    if (!data) return [];
    const byYear: Record<number, Record<string, number>> = {};
    for (const row of data) {
      if (!byYear[row.year]) byYear[row.year] = { year: row.year };
      byYear[row.year][row.disease] = Math.round(row.daly / 1000);
    }
    return Object.values(byYear).sort((a, b) => (a.year as number) - (b.year as number));
  })();

  const diseases = data ? [...new Set(data.map((r) => r.disease))] : [];

  return (
    <ChartShell
      title="Burden of Disease — Neurological Conditions by Year (2003–2024)"
      subtitle="Total DALYs (thousands) per neurological disease — Persons, all ages. Source: AIHW Australian Burden of Disease Study 2024"
      loading={loading}
      error={error}
    >
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}k`}
          />
          <Tooltip formatter={(v: number) => [`${v}k DALYs`]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {diseases.map((d) => (
            <Line
              key={d}
              type="monotone"
              dataKey={d}
              stroke={DISEASE_COLORS[d] ?? "#9ca3af"}
              strokeWidth={d === "Dementia" ? 2.5 : 1.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

// ---------------------------------------------------------------------------
// Graph 2 — Leading causes of disease burden, 2024 by sex
// ---------------------------------------------------------------------------

function Burden2024Chart() {
  const { data, loading, error } = useFetch<Burden2024Row[]>(
    "/api/neurological-burden-2024"
  );

  const chartData = (() => {
    if (!data) return [];
    const persons = data.filter((r) => r.sex === "Persons");
    const grouped: Record<string, { disease: string; males: number; females: number; persons: number }> = {};
    for (const row of data) {
      if (!grouped[row.disease]) {
        grouped[row.disease] = { disease: row.disease, males: 0, females: 0, persons: 0 };
      }
      if (row.sex === "Males") grouped[row.disease].males = Math.round(row.daly / 1000);
      if (row.sex === "Females") grouped[row.disease].females = Math.round(row.daly / 1000);
      if (row.sex === "Persons") grouped[row.disease].persons = Math.round(row.daly / 1000);
    }
    return Object.values(grouped)
      .sort((a, b) => b.persons - a.persons);
  })();

  return (
    <ChartShell
      title="Leading Causes of Disease Burden (DALYs) — Australia 2024"
      subtitle="Disability-Adjusted Life Years (thousands) by disease and sex. Source: AIHW Australian Burden of Disease Study 2024"
      loading={loading}
      error={error}
    >
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 160, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}k`}
          />
          <YAxis
            type="category"
            dataKey="disease"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            width={155}
          />
          <Tooltip formatter={(v: number) => [`${v}k DALYs`]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="males" name="Males" fill="#1f2937" radius={0} />
          <Bar dataKey="females" name="Females" fill="#9ca3af" radius={0} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

// ---------------------------------------------------------------------------
// Graph 3 — Australians living with dementia 2025–2065
// ---------------------------------------------------------------------------

function PrevalenceChart() {
  const { data, loading, error } = useFetch<PrevalenceRow[]>(
    "/api/dementia-prevalence"
  );

  const [view, setView] = useState<"sex" | "age">("sex");

  const chartData = (data ?? []).map((r) => ({
    year: r.year,
    Men: Math.round(r.men / 1000),
    Women: Math.round(r.women / 1000),
    Persons: Math.round(r.persons / 1000),
    "30–64": Math.round(r.age_30_64 / 1000),
    "65–84": Math.round(r.age_65_84 / 1000),
    "85+": Math.round(r.age_85_plus / 1000),
  }));

  const sexLines = ["Men", "Women", "Persons"] as const;
  const ageLines = ["30–64", "65–84", "85+"] as const;
  const activeLines = view === "sex" ? sexLines : ageLines;
  const lineColors = view === "sex"
    ? ["#1f2937", "#6b7280", "#d1d5db"]
    : ["#1f2937", "#6b7280", "#d1d5db"];

  return (
    <ChartShell
      title="Australians Living with Dementia — Projections 2025–2065"
      subtitle="Number of Australians (thousands) projected to be living with dementia. Source: AIHW Dementia in Australia 2022"
      loading={loading}
      error={error}
    >
      <div className="flex gap-2 mb-4">
        {(["sex", "age"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1 text-xs font-medium border-2 transition-colors ${
              view === v
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-400 hover:border-gray-600"
            }`}
          >
            {v === "sex" ? "By Sex" : "By Age Group"}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}k`}
          />
          <Tooltip formatter={(v: number) => [`${v}k Australians`]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {activeLines.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={lineColors[i]}
              strokeWidth={key === "Persons" ? 2.5 : 1.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

// ---------------------------------------------------------------------------
// Graph 4 — Dementia deaths and rates, 2009–2023
// ---------------------------------------------------------------------------

function MortalityChart() {
  const { data, loading, error } = useFetch<MortalityRow[]>(
    "/api/dementia-mortality"
  );

  const [metric, setMetric] = useState<"deaths" | "asr" | "crude">("deaths");

  const chartData = (data ?? []).map((r) => ({
    year: r.year,
    Men:
      metric === "deaths"
        ? r.deaths_men
        : metric === "asr"
        ? parseFloat(Number(r.asr_men).toFixed(1))
        : parseFloat(Number(r.crude_men).toFixed(1)),
    Women:
      metric === "deaths"
        ? r.deaths_women
        : metric === "asr"
        ? parseFloat(Number(r.asr_women).toFixed(1))
        : parseFloat(Number(r.crude_women).toFixed(1)),
    Persons:
      metric === "deaths"
        ? r.deaths_persons
        : metric === "asr"
        ? parseFloat(Number(r.asr_persons).toFixed(1))
        : parseFloat(Number(r.crude_persons).toFixed(1)),
  }));

  const yLabel =
    metric === "deaths" ? "Deaths" : "Rate per 100,000";
  const tooltipSuffix =
    metric === "deaths" ? " deaths" : " per 100k";

  return (
    <ChartShell
      title="Deaths Due to Dementia in Australia — 2009–2023"
      subtitle="Number of deaths and mortality rates by sex. Source: AIHW Dementia Mortality S3.3"
      loading={loading}
      error={error}
    >
      <div className="flex gap-2 mb-4">
        {(["deaths", "asr", "crude"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={`px-3 py-1 text-xs font-medium border-2 transition-colors ${
              metric === m
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-400 hover:border-gray-600"
            }`}
          >
            {m === "deaths" ? "Deaths" : m === "asr" ? "Age-Standardised Rate" : "Crude Rate"}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            label={{
              value: yLabel,
              angle: -90,
              position: "insideLeft",
              offset: -5,
              style: { fontSize: 10, fill: "#9ca3af" },
            }}
          />
          <Tooltip formatter={(v: number) => [`${v}${tooltipSuffix}`]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="Men" stroke="#1f2937" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="Women" stroke="#6b7280" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="Persons" stroke="#d1d5db" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------

export function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />

      <div className="max-w-[1440px] mx-auto px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Statistics Dashboard
          </h1>
          <p className="text-gray-700">
            Australian dementia prevalence and neurological disease burden — live data from PostgreSQL
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 mb-12">
          <BurdenTrendChart />
          <Burden2024Chart />
          <PrevalenceChart />
          <MortalityChart />
        </div>

        {/* Speech Biomarkers Section */}
        <div className="mb-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Understanding Speech Biomarkers
            </h2>
            <p className="text-gray-700 max-w-3xl">
              Conversational biomarkers are measurable linguistic and acoustic patterns extracted
              from natural speech. Unlike traditional assessments, they can be detected passively
              during routine consultations — with no additional patient burden.
            </p>
          </div>

          {/* Biomarker Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {biomarkers.map((b) => (
              <div key={b.name} className="bg-white border-2 border-gray-400 p-6">
                <h3 className="text-base font-bold text-gray-900 mb-2">{b.name}</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="bg-white border-2 border-gray-400">
            <div className="px-6 py-4 border-b-2 border-gray-300">
              <h3 className="text-lg font-bold text-gray-900">
                How Speech Biomarkers Enhance Traditional Cognitive Assessments
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Speech biomarkers work alongside MMSE and MoCA — adding an earlier, passive signal
                to your existing clinical workflow
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300 bg-gray-50">
                    <th className="text-left px-6 py-3 font-bold text-gray-700 w-1/4">Feature</th>
                    <th className="text-left px-6 py-3 font-bold text-gray-900 w-1/4">Speech Biomarkers</th>
                    <th className="text-left px-6 py-3 font-bold text-gray-700 w-1/4">MMSE</th>
                    <th className="text-left px-6 py-3 font-bold text-gray-700 w-1/4">MoCA</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr
                      key={row.feature}
                      className={`border-b border-gray-200 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">{row.feature}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium">{row.biomarker}</td>
                      <td className="px-6 py-4 text-gray-600">{row.mmse}</td>
                      <td className="px-6 py-4 text-gray-600">{row.moca}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Attribution */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Data source: Australian Institute of Health and Welfare (AIHW) — Dementia in Australia
            2022 &amp; Australian Burden of Disease Study 2024
          </p>
        </div>
      </div>
    </div>
  );
}

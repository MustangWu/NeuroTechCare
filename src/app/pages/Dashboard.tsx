import React, { useEffect, useState } from "react";
import { Navigation } from "../components/Navigation";
import { Slider } from "../components/ui/slider";
import {
  Tooltip as UITooltip,
  TooltipTrigger,
  TooltipContent,
} from "../components/ui/tooltip";
import {
  ComposedChart,
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

type AgeGroupRow = { age_group: string; value: number; crude_rate: number };
type KpiRow = { sex: string; total: number };
type BurdenByAgeResponse = { ageGroups: AgeGroupRow[]; kpis: KpiRow[] };

type Top10Row = { rank: number; disease: string; daly: number };

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
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
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
    <div className="bg-white rounded-lg p-8">
      <h2 className="text-xl text-gray-900 mb-1">{title}</h2>
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

/** Reusable labelled select dropdown */
function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  options: { value: string | number; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-600">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[130px]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Small pill-style toggle button — kept for measure/metric toggles */
function FilterBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
        active
          ? "bg-[#2d5a8f] text-white"
          : "bg-white text-gray-600 border border-gray-300 hover:border-gray-400"
      }`}
    >
      {children}
    </button>
  );
}

/** Age group labels and their slider indices */
const AGE_GROUP_OPTIONS = [
  "Under 30",
  "30–64",
  "65–69",
  "70–74",
  "75–79",
  "80–84",
  "85+",
] as const;

/** Years available in neurological_burden SQL data */
const NEUROLOGICAL_BURDEN_YEARS = [2003, 2011, 2015, 2018, 2024];

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
// Metric definitions & info tooltip
// ---------------------------------------------------------------------------

const METRIC_DEFS = {
  DALY: "Sum of all disability adjusted life years (DALY)",
  YLD: "Sum of all years lived with disability (YLD)",
  YLL: "Sum of all years of life lost (YLL)",
  crude_daly_rate: "Age-specific DALY rate (per 1,000 population)",
  crude_yld_rate: "Age-specific YLD rate (per 1,000 population)",
  crude_yll_rate: "Age-specific YLL rate (per 1,000 population)",
} as const;

function MetricInfo({ id }: { id: keyof typeof METRIC_DEFS }) {
  return (
    <UITooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-gray-400 text-gray-400 text-[9px] leading-none cursor-help hover:border-gray-600 hover:text-gray-600 shrink-0 select-none">
          i
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[240px] text-center">
        {METRIC_DEFS[id]}
      </TooltipContent>
    </UITooltip>
  );
}

// ---------------------------------------------------------------------------
// Graph 1 — Burden of disease by age group (combo bar + line)
// ---------------------------------------------------------------------------

function BurdenByAgeChart() {
  const [year, setYear] = useState(2024);
  const [sex, setSex] = useState("Persons");
  const [measure, setMeasure] = useState<"daly" | "yld" | "yll">("daly");
  const [disease, setDisease] = useState(""); // "" = All neurological conditions

  // Fetch disease list for dropdown
  const { data: conditionList } = useFetch<string[]>("/api/neurological-conditions");

  const url =
    `/api/neurological-burden-by-age?year=${year}&sex=${sex}&measure=${measure}` +
    (disease ? `&disease=${encodeURIComponent(disease)}` : "");
  const { data, loading, error } = useFetch<BurdenByAgeResponse>(url);

  const measureLabel =
    measure === "daly" ? "DALY" : measure === "yld" ? "YLD" : "YLL";

  // KPI values
  const kpiPersons = data?.kpis?.find((k) => k.sex === "Persons");
  const kpiFemales = data?.kpis?.find(
    (k) => k.sex === "Females" || k.sex === "Women"
  );
  const kpiMales = data?.kpis?.find(
    (k) => k.sex === "Males" || k.sex === "Men"
  );

  const chartData = (data?.ageGroups ?? []).map((r) => ({
    age: r.age_group,
    value: Number(r.value),
    crudeRate: parseFloat(Number(r.crude_rate).toFixed(2)),
  }));

  return (
    <ChartShell
      title="Burden of Disease — Neurological Conditions by Age"
      subtitle={`${measureLabel}s and crude rate per 1,000 population — ${sex}, ${year}. Source: AIHW Australian Burden of Disease Study 2024`}
      loading={loading}
      error={error}
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Australians",
            val: kpiPersons?.total,
            color: "text-gray-900",
          },
          {
            label: "Australian females",
            val: kpiFemales?.total,
            color: "text-red-600",
          },
          {
            label: "Australian males",
            val: kpiMales?.total,
            color: "text-teal-700",
          },
        ].map(({ label, val, color }) => (
          <div
            key={label}
            className="border border-gray-200 rounded-lg p-4 text-center bg-gray-50"
          >
            <p className="text-xs text-gray-500 mb-1">
              In {year},{" "}
              <span className={color}>{label}</span> had
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {val != null ? Number(val).toLocaleString() : "—"}
            </p>
            <p className="text-xs text-gray-500">
              disability-adjusted life years ({measureLabel})
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-5 mb-6">
        <FilterSelect
          label="Select neurological condition"
          value={disease}
          onChange={setDisease}
          options={[
            { value: "", label: "All neurological conditions" },
            ...(conditionList ?? []).map((d) => ({ value: d, label: d })),
          ]}
        />
        <FilterSelect
          label="Select sex"
          value={sex}
          onChange={setSex}
          options={[
            { value: "Persons", label: "Persons" },
            { value: "Females", label: "Females" },
            { value: "Males", label: "Males" },
          ]}
        />
        <FilterSelect
          label="Select year"
          value={year}
          onChange={(v) => setYear(Number(v))}
          options={NEUROLOGICAL_BURDEN_YEARS.map((y) => ({
            value: y,
            label: String(y),
          }))}
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">
            Select measure
          </label>
          <div className="flex gap-2">
            {(["daly", "yld", "yll"] as const).map((m) => (
              <div key={m} className="flex items-center gap-1">
                <FilterBtn
                  active={measure === m}
                  onClick={() => setMeasure(m)}
                >
                  {m.toUpperCase()}
                </FilterBtn>
                <MetricInfo id={m.toUpperCase() as "DALY" | "YLD" | "YLL"} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="text-[11px] text-gray-400 flex items-center gap-1.5 -mt-3 mb-4">
        <MetricInfo id={`crude_${measure}_rate` as keyof typeof METRIC_DEFS} />
        <span>
          Crude rate (right axis):{" "}
          {METRIC_DEFS[`crude_${measure}_rate` as keyof typeof METRIC_DEFS]}
        </span>
      </p>

      {/* Combo chart: Bar (DALY) + Line (Crude rate) */}
      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 60, left: 10, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="age"
            tick={{ fontSize: 10, fill: "#6b7280" }}
            tickLine={false}
            angle={-45}
            textAnchor="end"
            interval={0}
            label={{
              value: "Age group (years)",
              position: "insideBottom",
              offset: -50,
              style: { fontSize: 12, fill: "#6b7280" },
            }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v.toLocaleString()}
            label={{
              value: measureLabel,
              angle: -90,
              position: "insideLeft",
              offset: -5,
              style: { fontSize: 11, fill: "#6b7280" },
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            label={{
              value: "Crude rate (per 1,000 population)",
              angle: 90,
              position: "insideRight",
              offset: 10,
              style: { fontSize: 10, fill: "#6b7280" },
            }}
          />
          <Tooltip
            formatter={(v: number, name: string) => [
              name === "crudeRate"
                ? `${v} per 1,000`
                : v.toLocaleString() + ` ${measureLabel}s`,
              name === "crudeRate" ? "Crude Rate" : measureLabel,
            ]}
            labelFormatter={(l) => `Age: ${l}`}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(v) =>
              v === "value" ? `${measureLabel} (bar)` : "Crude rate (line)"
            }
          />
          <Bar
            yAxisId="left"
            dataKey="value"
            fill="#7fb3d3"
            radius={0}
            name="value"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="crudeRate"
            stroke="#6ab04c"
            strokeWidth={2.5}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
            name="crudeRate"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

// ---------------------------------------------------------------------------
// Graph 2 — Leading 10 causes of disease burden (horizontal bar)
// ---------------------------------------------------------------------------

function BurdenTop10Chart() {
  const [sex, setSex] = useState("Persons");
  // Two-point slider: [fromIndex, toIndex] over AGE_GROUP_OPTIONS (0–6)
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 6]);

  const ageLabel =
    ageRange[0] === 0 && ageRange[1] === 6
      ? "All ages"
      : ageRange[0] === ageRange[1]
      ? AGE_GROUP_OPTIONS[ageRange[0]]
      : `${AGE_GROUP_OPTIONS[ageRange[0]]} – ${AGE_GROUP_OPTIONS[ageRange[1]]}`;

  const url = `/api/burden-top10?sex=${encodeURIComponent(sex)}&age_from=${ageRange[0]}&age_to=${ageRange[1]}`;
  const { data, loading, error } = useFetch<Top10Row[]>(url);

  const chartData = (data ?? [])
    .slice()
    .sort((a, b) => a.daly - b.daly);

  return (
    <ChartShell
      title="Leading 10 Causes of Disease Burden (DALY) — Australia 2024"
      subtitle={`Disability-adjusted life years by disease — ${sex}, ${ageLabel}. Source: AIHW Dementia in Australia`}
      loading={loading}
      error={error}
    >
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-6 mb-6">
        <FilterSelect
          label="Select sex"
          value={sex}
          onChange={setSex}
          options={[
            { value: "Persons", label: "Persons" },
            { value: "Men", label: "Men" },
            { value: "Women", label: "Women" },
          ]}
        />

        {/* Two-point age range slider */}
        <div className="flex flex-col gap-2 min-w-[260px]">
          <label className="text-xs font-medium text-gray-500">
            Select age range:{" "}
            <span className="text-gray-800 font-semibold">{ageLabel}</span>
          </label>
          <Slider
            min={0}
            max={6}
            step={1}
            value={ageRange}
            onValueChange={(v) => setAgeRange(v as [number, number])}
            minStepsBetweenThumbs={0}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-gray-400">
            {AGE_GROUP_OPTIONS.map((g) => (
              <span key={g}>{g.replace("Under ", "<")}</span>
            ))}
          </div>
        </div>
      </div>
      <p className="text-[11px] text-gray-400 flex items-center gap-1.5 mb-4">
        <MetricInfo id="DALY" />
        <span>DALY: {METRIC_DEFS.DALY}</span>
      </p>

      <ResponsiveContainer width="100%" height={360}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 40, left: 180, bottom: 20 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) =>
              v >= 1000 ? `${Math.round(v / 1000)}K` : String(v)
            }
            label={{
              value: "Disability-adjusted life years (DALY)",
              position: "insideBottom",
              offset: -10,
              style: { fontSize: 11, fill: "#6b7280" },
            }}
          />
          <YAxis
            type="category"
            dataKey="disease"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            width={175}
          />
          <Tooltip
            formatter={(v: number) => [
              `${v.toLocaleString()} DALYs`,
              "Burden",
            ]}
          />
          <Bar dataKey="daly" fill="#5f9eaf" radius={0} />
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
  const lineColors =
    view === "sex"
      ? { Men: "#2b8a9e", Women: "#7fb3d3", Persons: "#6c5b9e" }
      : { "30–64": "#2b8a9e", "65–84": "#7fb3d3", "85+": "#6c5b9e" };

  return (
    <ChartShell
      title="Australians Living with Dementia — Projections 2025–2065"
      subtitle="Estimated number of people living with dementia (thousands). Source: AIHW Dementia in Australia 2022"
      loading={loading}
      error={error}
    >
      <div className="flex gap-2 mb-2">
        {(["sex", "age"] as const).map((v) => (
          <FilterBtn key={v} active={view === v} onClick={() => setView(v)}>
            {v === "sex" ? "By Sex" : "By Age Group"}
          </FilterBtn>
        ))}
      </div>
      {view === "age" && <div className="mb-4" />}
      <ResponsiveContainer width="100%" height={340}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}k`}
            label={{
              value: "Estimated number of people living with dementia",
              angle: -90,
              position: "insideLeft",
              offset: -10,
              style: { fontSize: 10, fill: "#9ca3af" },
            }}
          />
          <Tooltip formatter={(v: number) => [`${v}k Australians`]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {activeLines.map((key) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={(lineColors as any)[key]}
              strokeWidth={key === "Persons" ? 2.5 : 2}
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

  const [metric, setMetric] = useState<"deaths" | "asr" | "crude">("asr");

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
    metric === "deaths" ? "Number of deaths" : "Age-standardised rate of death";
  const tooltipSuffix = metric === "deaths" ? " deaths" : " per 100k";

  return (
    <ChartShell
      title="Deaths Due to Dementia in Australia — 2009–2023"
      subtitle="Number of deaths, crude rate and age-standardised rate by sex. Source: AIHW Dementia Mortality S3.3"
      loading={loading}
      error={error}
    >
      <div className="flex gap-2 mb-2">
        {(["deaths", "asr", "crude"] as const).map((m) => (
          <FilterBtn
            key={m}
            active={metric === m}
            onClick={() => setMetric(m)}
          >
            {m === "deaths"
              ? "Deaths"
              : m === "asr"
              ? "Age-Standardised Rate"
              : "Crude Rate"}
          </FilterBtn>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            label={{
              value: yLabel,
              angle: -90,
              position: "insideLeft",
              offset: -10,
              style: { fontSize: 10, fill: "#9ca3af" },
            }}
          />
          <Tooltip formatter={(v: number) => [`${v}${tooltipSuffix}`]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="Men"
            stroke="#2b8a9e"
            strokeWidth={2}
            dot={{ r: 2.5 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="Women"
            stroke="#7fb3d3"
            strokeWidth={2}
            dot={{ r: 2.5 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="Persons"
            stroke="#6c5b9e"
            strokeWidth={2}
            dot={{ r: 2.5 }}
            activeDot={{ r: 5 }}
          />
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
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Speech Biomarkers Section */}
        <div className="mb-12">
          <div className="mb-8">
            <h2 className="text-2xl text-gray-900 mb-2">
              Understanding Speech Biomarkers
            </h2>
            <p className="text-gray-700 max-w-3xl">
              Conversational biomarkers are measurable linguistic and acoustic
              patterns extracted from natural speech. Unlike traditional
              assessments, they can be detected passively during routine
              consultations — with no additional patient burden.
            </p>
          </div>

          {/* Biomarker Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {biomarkers.map((b) => (
              <div
                key={b.name}
                className="bg-white rounded-lg p-6"
              >
                <h3 className="text-base text-gray-900 mb-2">
                  {b.name}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {b.description}
                </p>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="bg-white rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg text-gray-900">
                How Speech Biomarkers Enhance Traditional Cognitive Assessments
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Speech biomarkers work alongside MMSE and MoCA — adding an
                earlier, passive signal to your existing clinical workflow
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-6 py-3 text-gray-700 w-1/4">
                      Feature
                    </th>
                    <th className="text-left px-6 py-3 text-gray-900 w-1/4">
                      Speech Biomarkers
                    </th>
                    <th className="text-left px-6 py-3 text-gray-700 w-1/4">
                      MMSE
                    </th>
                    <th className="text-left px-6 py-3 text-gray-700 w-1/4">
                      MoCA
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr
                      key={row.feature}
                      className={`border-b border-gray-200 ${
                        i % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-6 py-4 text-gray-900">
                        {row.feature}
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {row.biomarker}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{row.mmse}</td>
                      <td className="px-6 py-4 text-gray-600">{row.moca}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">
            Statistics Dashboard
          </h1>
          <p className="text-sm text-gray-600">
            Australian dementia prevalence and neurological disease burden — live
            data from PostgreSQL
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 mb-12">
          <BurdenByAgeChart />
          <BurdenTop10Chart />
          <PrevalenceChart />
          <MortalityChart />
        </div>

        {/* Attribution */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Data source: Australian Institute of Health and Welfare (AIHW) —
            Dementia in Australia 2022 &amp; Australian Burden of Disease Study
            2024
          </p>
        </div>
      </div>
    </div>
  );
}

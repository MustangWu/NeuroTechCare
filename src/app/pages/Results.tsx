import { Navigation } from "../components/Navigation";
import { Download, FileText, UploadCloud, Info } from "lucide-react";
import { useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { useSession, type AnalysisResult } from "../context/SessionContext";
import {
  Tooltip as UITooltip,
  TooltipTrigger,
  TooltipContent,
} from "../components/ui/tooltip";


type BiomarkerKey = "mlu_score" | "pause_ratio" | "type_token_ratio" | "filler_word_count" | "syntactic_complexity" | "overall_risk";

const FOUR_METRICS = ["mlu_score", "pause_ratio", "type_token_ratio", "filler_word_count"] as const;
type MetricKey = (typeof FOUR_METRICS)[number];

const METRIC_LABEL: Record<MetricKey, string> = {
  mlu_score: "MLU Score",
  pause_ratio: "Pause Ratio",
  type_token_ratio: "Type-Token Ratio",
  filler_word_count: "Filler Word Count",
};

const EXPLAIN_TITLES: Record<BiomarkerKey, string> = {
  mlu_score: "MLU Score Analysis",
  pause_ratio: "Pause Ratio Analysis",
  type_token_ratio: "Type-Token Ratio Analysis",
  filler_word_count: "Filler Word Count Analysis",
  syntactic_complexity: "Syntactic Complexity",
  overall_risk: "Overall Risk",
};

const biomarkers = {
  mlu_score :"Measures the average number of words per sentence. Cognitive decline often shortens sentence length as persons struggle to maintain complex grammar and thought structures.",
  pause_ratio:"Tracks the frequency and duration of pauses during speech. Increased hesitation can indicate slowed verbal processing and word-retrieval difficulties common in early dementia.",
  type_token_ratio:"Measures lexical diversity — the proportion of unique words used. A declining TTR reflects reduced vocabulary, a hallmark of early Alzheimer's and MCI.",
  filler_word_count:'Counts words like "um", "uh", and "you know". A rising filler rate signals word-finding difficulty, one of the earliest detectable signs of cognitive impairment.',
}

const borderClass: Record<BiomarkerKey, string> = {
  mlu_score: "border-l-4 border-blue-500",
  pause_ratio: "border-l-4 border-amber-500",
  type_token_ratio: "border-l-4 border-green-500",
  filler_word_count: "border-l-4 border-purple-500",
  syntactic_complexity: "border-l-4 border-rose-500",
  overall_risk: "border-l-4 border-indigo-500",
};

const barColor: Record<MetricKey, string> = {
  mlu_score: "bg-blue-500",
  pause_ratio: "bg-amber-500",
  type_token_ratio: "bg-emerald-500",
  filler_word_count: "bg-purple-500",
};

const pdfColor: Record<BiomarkerKey, [number, number, number]> = {
  mlu_score: [59, 130, 246],
  pause_ratio: [245, 158, 11],
  type_token_ratio: [34, 197, 94],
  filler_word_count: [168, 85, 247],
  syntactic_complexity: [244, 63, 94],
  overall_risk: [99, 102, 241],
};

function formatMetricValue(k: MetricKey, v: number): { text: string; bar: number } {
  const n = Number(v);
  if (!isFinite(n)) return { text: "N/A", bar: 0 };
  if (k === "pause_ratio") return { text: `${(n * 100).toFixed(1)}%`, bar: Math.min(1, n) };
  if (k === "type_token_ratio") return { text: n.toFixed(3), bar: Math.min(1, n) };
  if (k === "filler_word_count") return { text: String(n), bar: Math.min(1, n / 20) };
  return { text: n.toFixed(2), bar: Math.min(1, n / 15) };
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
}

function riskStyles(level: string): string {
  const l = level.toLowerCase();
  if (l.includes("high")) return "bg-red-50 text-red-800 border border-red-200";
  if (l.includes("moderate")) return "bg-amber-50 text-amber-800 border border-amber-200";
  return "bg-blue-50 text-[#2d5a8f] border border-blue-200";
}

function exportToPDF(s: AnalysisResult) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  doc.setFillColor(45, 90, 143);
  doc.rect(0, 0, pageWidth, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Cognitrack", margin, 9.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Analysis Report", pageWidth - margin, 9.5, { align: "right" });

  y = 26;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Analysis Results", margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(`Care Recipient: ${s.personName} (${s.personId})`, margin, y);
  y += 5;
  doc.text(`Recording Date: ${formatDate(s.recordingDate)}`, margin, y);
  y += 5;
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}`,
    margin, y
  );
  y += 5;
  doc.text(
    `Risk: ${s.dementia_risk_level} · Confidence: ${(s.confidence_score * 100).toFixed(0)}%`,
    margin, y
  );
  y += 8;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Speech Biomarker Metrics", margin, y);
  y += 7;

  const metrics = FOUR_METRICS.map((key) => {
    const v = s[key] as number;
    const f = formatMetricValue(key, v);
    return { label: METRIC_LABEL[key], value: f.text, barValue: f.bar, color: pdfColor[key] };
  });

  const colW = (contentWidth - 6) / 2;
  let col = 0;
  let rowY = y;
  for (const m of metrics) {
    const x = margin + col * (colW + 6);
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(x, rowY, colW, 22, 2, 2, "F");
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(m.label, x + 4, rowY + 6);
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(m.value, x + 4, rowY + 14);
    doc.setFillColor(220, 220, 220);
    doc.roundedRect(x + 4, rowY + 17, colW - 8, 2.5, 1, 1, "F");
    doc.setFillColor(...m.color);
    doc.roundedRect(x + 4, rowY + 17, (colW - 8) * m.barValue, 2.5, 1, 1, "F");
    col++;
    if (col === 2) { col = 0; rowY += 26; }
  }
  if (col !== 0) rowY += 26;
  y = rowY + 4;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Explainable AI Biomarker Summaries", margin, y);
  y += 7;

  for (const key of FOUR_METRICS) {
    const entry = s.biomarker_summaries?.[key];
    if (!entry) continue;
    const lines = doc.splitTextToSize(entry.summary, contentWidth - 8) as string[];
    const blockH = 6 + lines.length * 4.5 + 4;
    if (y + blockH > doc.internal.pageSize.getHeight() - 20) { doc.addPage(); y = 20; }
    const color = pdfColor[key];
    doc.setFillColor(...color);
    doc.rect(margin, y, 3, blockH, "F");
    doc.setFillColor(250, 250, 250);
    doc.rect(margin + 3, y, contentWidth - 3, blockH, "F");
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(EXPLAIN_TITLES[key], margin + 7, y + 5.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8.5);
    doc.text(lines, margin + 7, y + 10.5);
    y += blockH + 4;
  }

  if (y + 20 > doc.internal.pageSize.getHeight() - 20) { doc.addPage(); y = 20; }
  doc.setFillColor(235, 245, 255);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, "F");
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Clinical Note:", margin + 4, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  const noteLines = doc.splitTextToSize(
    "These interpretations are based on established speech-language pathology research linking acoustic and linguistic features to cognitive health. Individual variations are normal, and clinical decisions should always be made in consultation with healthcare professionals.",
    contentWidth - 8
  ) as string[];
  doc.text(noteLines, margin + 4, y + 11);

  const totalPages = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(240, 240, 240);
    doc.rect(0, doc.internal.pageSize.getHeight() - 10, pageWidth, 10, "F");
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Cognitrack — Confidential", margin, doc.internal.pageSize.getHeight() - 4);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 4, { align: "right" });
  }

  const safeName = s.personName.replace(/\s+/g, "_");
  doc.save(`NeuroTechCare_Report_${safeName}.pdf`);
}


function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <UploadCloud className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
      </div>
      <h2 className="text-lg text-gray-700 mb-2">No analysis results yet</h2>
      <p className="text-sm text-gray-500 max-w-xs mb-6">
        Upload a care recipient recording to generate speech biomarker analysis and view results here.
      </p>
      <a
        href="/upload"
        className="bg-[#2d5a8f] text-white px-6 py-2.5 rounded-lg hover:bg-[#234a75] transition-colors text-sm"
      >
        Upload a Recording
      </a>
    </div>
  );
}

const RISK_CTA: Record<string, { heading: string; points: string[]; color: string }> = {
  high: {
    heading: "Recommended Next Steps — High Risk",
    points: [
      "Refer to a specialist (geriatrician or neurologist) for a comprehensive cognitive assessment.",
      "Discuss findings with the care recipient's GP as soon as possible.",
      "Explore support services through Dementia Australia (1800 100 500).",
      "Schedule a follow-up recording in 4–6 weeks to monitor changes.",
    ],
    color: "bg-red-50 border-red-200 text-red-900",
  },
  moderate: {
    heading: "Recommended Next Steps — Moderate Risk",
    points: [
      "Share results with the care recipient's GP for further evaluation.",
      "Encourage brain-healthy lifestyle habits: exercise, social engagement, and quality sleep.",
      "Monitor closely and schedule a follow-up recording in 8–12 weeks.",
      "Consider a referral if scores worsen over time.",
    ],
    color: "bg-amber-50 border-amber-200 text-amber-900",
  },
  low: {
    heading: "Recommended Next Steps — Low Risk",
    points: [
      "Continue regular monitoring with periodic recordings every 3–6 months.",
      "Maintain brain-healthy lifestyle habits to support long-term cognitive health.",
      "No urgent clinical action required at this time.",
    ],
    color: "bg-blue-50 border-blue-200 text-blue-900",
  },
};

function getRiskCtaKey(level: string): "high" | "moderate" | "low" {
  const l = level.toLowerCase();
  if (l.includes("high")) return "high";
  if (l.includes("moderate")) return "moderate";
  return "low";
}

export function Results() {
  const { sessionData, setSessionData, savedAnalysisId } = useSession();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const biomarkerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionData || !savedAnalysisId) return;
    setLoading(true);
    fetch(`/api/analyses/${savedAnalysisId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((row) => {
        setSessionData({
          analysisId: row.analysis_id,
          personId: row.person_id,
          personName: row.person_name,
          recordingDate: row.recording_date,
          transcript: row.text_transcript ?? null,
          mlu_score: parseFloat(row.mlu_score),
          pause_ratio: parseFloat(row.pause_ratio),
          type_token_ratio: parseFloat(row.type_token_ratio),
          filler_word_count: parseFloat(row.filler_word_count),
          syntactic_complexity: parseFloat(row.syntactic_complexity),
          biomarker_summaries: row.biomarker_summaries ?? null,
          dementia_risk_level: row.dementia_risk_level,
          confidence_score: parseFloat(row.confidence_score),
          trend_direction: row.trend_direction,
        });
      })
      .catch(() => toast.error("Failed to load previous results."))
      .finally(() => setLoading(false));
  }, [savedAnalysisId, sessionData, setSessionData]);

  const s = sessionData;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2d5a8f]" />
          </div>
        ) : !s ? (
          <EmptyState />
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl text-gray-900 mb-2">Analysis Results</h1>
                <p className="text-gray-600 leading-relaxed">
                  Care Recipient: {s.personName} ({s.personId})
                  <br />
                  Recording Date: {formatDate(s.recordingDate)}
                </p>
              </div>
              <div
                className={`inline-flex w-fit px-6 py-3 rounded-2xl text-lg font-semibold shrink-0 ${riskStyles(s.dementia_risk_level)}`}
                role="status"
              >
                {s.dementia_risk_level}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                  <h2 className="text-xl text-gray-900 mb-4">Transcript</h2>
                  {s.transcript ? (
                    <div className="bg-gray-50 rounded-lg p-6 min-h-[24rem] border border-gray-100 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap overflow-auto">
                      {s.transcript}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-8 min-h-[24rem] flex flex-col items-center justify-center text-center border border-gray-100">
                      <FileText className="w-16 h-16 text-gray-300 mb-4" strokeWidth={1.25} />
                      <p className="text-gray-500 mb-2">Transcript not available</p>
                      <p className="text-sm text-gray-400 max-w-sm">
                        Transcription may not have been enabled for this recording.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={() => exportToPDF(s)}
                    className="bg-[#2d5a8f] text-white px-6 py-3 rounded-lg hover:bg-[#234a75] transition-colors flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Export PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/upload")}
                    className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <UploadCloud className="w-5 h-5" />
                    New Recording
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-base font-medium text-gray-700">Speech Biomarker Scores</h2>
                  <button
                    type="button"
                    onClick={() => biomarkerRef.current?.scrollIntoView({ behavior: "smooth" })}
                    className="flex items-center gap-1 text-xs text-[#2d5a8f] hover:underline"
                  >
                    <Info className="w-3.5 h-3.5" />
                    Learn More
                  </button>
                </div>
                {FOUR_METRICS.map((key) => {
                  const v = s[key] as number;
                  const f = formatMetricValue(key, v);
                   const tooltipText= biomarkers[key]
                  return (
                    <div key={key} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                   <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-gray-900 text-base font-normal">{METRIC_LABEL[key]}</h3>
                                                <UITooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-gray-400 text-gray-400 text-[9px] leading-none cursor-help hover:border-gray-600 hover:text-gray-600 shrink-0 select-none">
          i
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[240px] text-center">
       {tooltipText}
      </TooltipContent>
    </UITooltip>
    </div>
                        <span className="text-lg font-semibold text-gray-900 tabular-nums shrink-0">{f.text}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all ${barColor[key]}`}
                          style={{ width: `${f.bar * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Risk CTA */}
            {(() => {
              const cta = RISK_CTA[getRiskCtaKey(s.dementia_risk_level)];
              return (
                <div className={`mt-8 rounded-lg border p-6 ${cta.color}`}>
                  <h2 className="text-base font-semibold mb-3">{cta.heading}</h2>
                  <ul className="space-y-2">
                    {cta.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}

            {s.biomarker_summaries && (
              <div className="mt-10" ref={biomarkerRef}>
                <h2 className="text-2xl text-gray-900 mb-6">Explainable AI Biomarker Summaries</h2>
                <div className="bg-white rounded-lg p-6 space-y-8 shadow-sm border border-gray-100">
                  {FOUR_METRICS.map((key) => {
                    const entry = s.biomarker_summaries?.[key];
                    if (!entry) return null;
                    return (
                      <div key={key} className={`pl-4 ${borderClass[key]}`}>
                        <h3 className="text-gray-900 mb-2 font-medium">{EXPLAIN_TITLES[key]}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">{entry.summary}</p>
                      </div>
                    );
                  })}

                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100/80">
                    <p className="text-sm text-gray-700">
                      <strong>Clinical Note:</strong> These interpretations are based on established speech-language
                      pathology research linking acoustic and linguistic features to cognitive health. Individual
                      variations are normal, and clinical decisions should always be made in consultation with
                      healthcare professionals.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

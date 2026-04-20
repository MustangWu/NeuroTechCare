import { Navigation } from "../components/Navigation";
import { useParams, Link } from "react-router";

// Mock patient data
const patientData = {
  id: "PT-2024-001",
  name: "Margaret Thompson",
  dob: "15/06/1947",
  age: 78,
  gender: "Female",
  currentRisk: "High Risk",
};

// Mock visit history
const visits = [
  {
    date: "2026-03-15",
    mlu: 4.2,
    pauseRatio: 68,
    ttr: 0.42,
    fillerCount: 47,
    risk: "High Risk",
    trend: "down",
  },
  {
    date: "2026-01-10",
    mlu: 5.8,
    pauseRatio: 52,
    ttr: 0.51,
    fillerCount: 34,
    risk: "Moderate Risk",
    trend: "down",
  },
  {
    date: "2025-10-22",
    mlu: 7.1,
    pauseRatio: 38,
    ttr: 0.64,
    fillerCount: 22,
    risk: "Moderate Risk",
    trend: "down",
  },
  {
    date: "2025-07-05",
    mlu: 8.9,
    pauseRatio: 32,
    ttr: 0.71,
    fillerCount: 14,
    risk: "Low Risk",
    trend: "stable",
  },
  {
    date: "2025-04-18",
    mlu: 9.4,
    pauseRatio: 28,
    ttr: 0.76,
    fillerCount: 11,
    risk: "Low Risk",
    trend: "stable",
  },
];

function riskBadgeClass(risk: string) {
  if (risk === "High Risk")
    return "inline-block px-3 py-1 border border-[#C0392B] font-medium text-sm text-[#C0392B] bg-red-50 rounded";
  if (risk === "Moderate Risk")
    return "inline-block px-3 py-1 border border-[#E5A020] font-medium text-sm text-[#E5A020] bg-orange-50 rounded";
  return "inline-block px-3 py-1 border border-accent font-medium text-sm text-accent bg-green-50 rounded";
}

function TrendChartIllustration() {
  return (
    <svg width="200" height="100" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="200" height="100" rx="8" fill="#F8FAFB"/>
      <line x1="30" y1="20" x2="30" y2="80" stroke="#DDE3EC" strokeWidth="1.5"/>
      <line x1="30" y1="80" x2="190" y2="80" stroke="#DDE3EC" strokeWidth="1.5"/>
      <line x1="30" y1="55" x2="190" y2="55" stroke="#DDE3EC" strokeWidth="1" strokeDasharray="4 3"/>
      <line x1="30" y1="35" x2="190" y2="35" stroke="#DDE3EC" strokeWidth="1" strokeDasharray="4 3"/>
      <polyline points="50,30 80,42 110,54 140,64 170,73" stroke="#0D4F8C" strokeWidth="2.5" fill="none" strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx="50" cy="30" r="4" fill="#0D4F8C"/>
      <circle cx="80" cy="42" r="4" fill="#0D4F8C"/>
      <circle cx="110" cy="54" r="4" fill="#0D4F8C"/>
      <circle cx="140" cy="64" r="4" fill="#0D4F8C"/>
      <circle cx="170" cy="73" r="4" fill="#1D9E75"/>
    </svg>
  );
}

export function PatientProfile() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-[1440px] mx-auto px-8 py-12">
        {/* Back Button */}
        <Link
          to="/patients"
          className="inline-block text-primary mb-6 font-medium text-sm hover:underline"
        >
          ← Back to Patient List
        </Link>

        {/* Patient Summary Header */}
        <div className="bg-white border border-border rounded-lg py-4 px-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <h1 className="text-3xl font-medium text-foreground">
                  {patientData.name}
                </h1>
                <span className={riskBadgeClass(patientData.currentRisk)}>
                  {patientData.currentRisk}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-6 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Patient ID</p>
                  <p className="font-medium text-foreground">{patientData.id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Date of Birth</p>
                  <p className="font-medium text-foreground">{patientData.dob}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Age</p>
                  <p className="font-medium text-foreground">{patientData.age} years</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Gender</p>
                  <p className="font-medium text-foreground">{patientData.gender}</p>
                </div>
              </div>
            </div>
            <button className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg border border-primary font-medium text-sm">
              Export History
            </button>
          </div>
        </div>

        {/* Visit History Table */}
        <div className="bg-white border border-border rounded-lg py-4 px-6 mb-8">
          <h2 className="text-xl font-medium text-foreground mb-4">Visit History</h2>
          <div className="overflow-x-auto">
            <table className="w-full border border-border rounded-lg overflow-hidden">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground border-r border-border">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground border-r border-border">MLU</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground border-r border-border">Pause Ratio</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground border-r border-border">TTR</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground border-r border-border">Filler Count</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground border-r border-border">Risk Level</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((visit, index) => (
                  <tr key={index} className="border-b border-border hover:bg-background transition-colors">
                    <td className="py-4 px-4 text-sm text-foreground font-medium border-r border-border">
                      {new Date(visit.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-4 text-sm text-foreground border-r border-border">
                      {visit.mlu} {visit.trend === "down" && "↓"}
                    </td>
                    <td className="py-4 px-4 text-sm text-foreground border-r border-border">
                      {visit.pauseRatio}% {visit.trend === "down" && "↑"}
                    </td>
                    <td className="py-4 px-4 text-sm text-foreground border-r border-border">
                      {visit.ttr} {visit.trend === "down" && "↓"}
                    </td>
                    <td className="py-4 px-4 text-sm text-foreground border-r border-border">
                      {visit.fillerCount}/min {visit.trend === "down" && "↑"}
                    </td>
                    <td className="py-4 px-4 text-sm border-r border-border">
                      <span className={riskBadgeClass(visit.risk)}>
                        {visit.risk}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm">
                      <Link
                        to="/results"
                        className="text-primary font-medium hover:underline"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="bg-white border border-border rounded-lg py-4 px-6">
          <h2 className="text-xl font-medium text-foreground mb-1">Longitudinal Biomarker Trends</h2>
          <p className="text-xs text-muted-foreground mb-6">Track changes in speech biomarkers over time</p>
          <div className="w-full h-[400px] bg-background border border-border rounded-lg flex flex-col items-center justify-center gap-4">
            <TrendChartIllustration />
            <p className="text-sm font-medium text-foreground">Chart: Longitudinal Biomarker Trends</p>
            <p className="text-xs text-muted-foreground">Trend data visualisation coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}

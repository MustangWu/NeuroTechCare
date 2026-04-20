import { Navigation } from "../components/Navigation";
import { useState } from "react";
import { Link } from "react-router";

// Mock patient data
const patients = [
  {
    id: "PT-2024-001",
    name: "Margaret Thompson",
    age: 78,
    lastVisit: "2026-03-15",
    risk: "High Risk",
    trend: "down",
    mlu: 4.2,
    flagged: true,
  },
  {
    id: "PT-2024-003",
    name: "Robert Chen",
    age: 72,
    lastVisit: "2026-03-12",
    risk: "High Risk",
    trend: "down",
    mlu: 5.1,
    flagged: true,
  },
  {
    id: "PT-2024-008",
    name: "Patricia O'Brien",
    age: 69,
    lastVisit: "2026-03-10",
    risk: "Moderate Risk",
    trend: "down",
    mlu: 6.8,
    flagged: false,
  },
  {
    id: "PT-2024-012",
    name: "John Williams",
    age: 75,
    lastVisit: "2026-03-08",
    risk: "Moderate Risk",
    trend: "stable",
    mlu: 7.2,
    flagged: false,
  },
  {
    id: "PT-2024-015",
    name: "Helen Morrison",
    age: 66,
    lastVisit: "2026-02-28",
    risk: "Low Risk",
    trend: "up",
    mlu: 9.1,
    flagged: false,
  },
  {
    id: "PT-2024-019",
    name: "David Kumar",
    age: 71,
    lastVisit: "2026-02-25",
    risk: "Low Risk",
    trend: "stable",
    mlu: 8.7,
    flagged: false,
  },
  {
    id: "PT-2024-022",
    name: "Susan Taylor",
    age: 68,
    lastVisit: "2026-02-15",
    risk: "Moderate Risk",
    trend: "down",
    mlu: 6.4,
    flagged: true,
  },
  {
    id: "PT-2024-027",
    name: "James Anderson",
    age: 74,
    lastVisit: "2026-01-30",
    risk: "Low Risk",
    trend: "up",
    mlu: 9.8,
    flagged: false,
  },
];

// Calculate overdue patients (last visit > 90 days ago)
const overduePatients = patients.filter(p => {
  const daysSinceVisit = Math.floor((new Date().getTime() - new Date(p.lastVisit).getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceVisit > 90;
});

function riskBadgeClass(risk: string) {
  if (risk === "High Risk")
    return "inline-block px-3 py-1 border border-[#C0392B] text-xs font-medium text-[#C0392B] rounded bg-red-50";
  if (risk === "Moderate Risk")
    return "inline-block px-3 py-1 border border-[#E5A020] text-xs font-medium text-[#E5A020] rounded bg-orange-50";
  return "inline-block px-3 py-1 border border-accent text-xs font-medium text-accent rounded bg-green-50";
}

function EmptyStateIllustration() {
  return (
    <svg width="140" height="120" viewBox="0 0 140 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="10" y="15" width="75" height="90" rx="8" fill="#E8EFF8"/>
      <rect x="22" y="32" width="51" height="6" rx="3" fill="#0D4F8C" fillOpacity="0.3"/>
      <rect x="22" y="46" width="38" height="6" rx="3" fill="#0D4F8C" fillOpacity="0.2"/>
      <rect x="22" y="60" width="44" height="6" rx="3" fill="#0D4F8C" fillOpacity="0.3"/>
      <rect x="22" y="74" width="30" height="6" rx="3" fill="#0D4F8C" fillOpacity="0.2"/>
      <circle cx="98" cy="78" r="26" fill="white" stroke="#DDE3EC" strokeWidth="1.5"/>
      <circle cx="98" cy="78" r="16" stroke="#0D4F8C" strokeWidth="3" fill="#E8EFF8"/>
      <line x1="93" y1="73" x2="103" y2="83" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="103" y1="73" x2="93" y2="83" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="110" y1="89" x2="122" y2="101" stroke="#0D4F8C" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  );
}

export function PatientList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patient.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === "All" || patient.risk === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const flaggedPatients = patients.filter(p => p.flagged);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-[1440px] mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-foreground mb-2">
            Patient List
          </h1>
          <p className="text-muted-foreground">
            Manage and monitor your patients' cognitive health assessments
          </p>
        </div>

        {/* Summary Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-border rounded-lg py-4 px-6 border-l-[3px] border-l-[#C0392B]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 bg-red-50 border border-[#C0392B] rounded"></div>
              <h3 className="text-lg font-medium text-foreground">Flagged Patients</h3>
            </div>
            <div className="text-[28px] font-medium text-[#C0392B] mb-1">{flaggedPatients.length}</div>
            <p className="text-xs text-muted-foreground">High-risk patients requiring follow-up</p>
          </div>

          <div className="bg-white border border-border rounded-lg py-4 px-6 border-l-[3px] border-l-[#E5A020]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 bg-orange-50 border border-[#E5A020] rounded"></div>
              <h3 className="text-lg font-medium text-foreground">Overdue Recordings</h3>
            </div>
            <div className="text-[28px] font-medium text-[#E5A020] mb-1">{overduePatients.length}</div>
            <p className="text-xs text-muted-foreground">Patients due for reassessment (&gt;90 days)</p>
          </div>

          <div className="bg-white border border-border rounded-lg py-4 px-6 border-l-[3px] border-l-accent">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 bg-green-50 border border-accent rounded"></div>
              <h3 className="text-lg font-medium text-foreground">Total Active Patients</h3>
            </div>
            <div className="text-[28px] font-medium text-accent mb-1">{patients.length}</div>
            <p className="text-xs text-muted-foreground">Patients under cognitive monitoring</p>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white py-4 px-6 border border-border rounded-lg mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by patient name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-4 py-2.5 border border-border rounded-lg text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Filter:</span>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="border border-border rounded-lg px-4 py-2.5 text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option>All</option>
                <option>High Risk</option>
                <option>Moderate Risk</option>
                <option>Low Risk</option>
              </select>
            </div>
          </div>
        </div>

        {/* Patient Table */}
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground border-r border-border">Patient</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground border-r border-border">Patient ID</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground border-r border-border">Age</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground border-r border-border">Last Visit</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground border-r border-border">Risk Level</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground border-r border-border">Trend</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground border-r border-border">MLU Score</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient, index) => (
                  <tr key={index} className="border-b border-border hover:bg-background transition-colors">
                    <td className="py-4 px-6 border-r border-border">
                      <div className="flex items-center gap-3">
                        {patient.flagged && (
                          <span className="font-medium text-[#C0392B] text-xs">!</span>
                        )}
                        <span className="font-medium text-foreground">{patient.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-muted-foreground border-r border-border">{patient.id}</td>
                    <td className="py-4 px-6 text-sm text-foreground border-r border-border">{patient.age}</td>
                    <td className="py-4 px-6 text-sm text-foreground border-r border-border">
                      {new Date(patient.lastVisit).toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-4 px-6 border-r border-border">
                      <span className={riskBadgeClass(patient.risk)}>
                        {patient.risk}
                      </span>
                    </td>
                    <td className="py-4 px-6 border-r border-border text-muted-foreground">
                      {patient.trend === "down" && <span>↓</span>}
                      {patient.trend === "up" && <span>↑</span>}
                      {patient.trend === "stable" && <span>—</span>}
                    </td>
                    <td className="py-4 px-6 text-sm text-foreground font-medium border-r border-border">{patient.mlu}</td>
                    <td className="py-4 px-6">
                      <Link
                        to={`/patient/${patient.id}`}
                        className="text-primary font-medium text-sm hover:underline"
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredPatients.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="flex justify-center mb-4">
              <EmptyStateIllustration />
            </div>
            <p className="text-base font-medium text-foreground mb-1">No patients found</p>
            <p className="text-sm text-muted-foreground">No patients match your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}

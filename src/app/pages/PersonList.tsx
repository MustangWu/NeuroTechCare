import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Navigation } from "../components/Navigation";
import { useAuth } from "../context/AuthContext";
import { Plus } from "lucide-react";

interface Person {
  person_id: string;
  name: string;
  age: number;
  gender: string;
  risk_level: string | null;
  last_visit: string | null;
  total_uploads: number;
  risk_trend: string | null;
}

function RiskTrendBadge({ trend }: { trend: string | null }) {
  if (!trend || trend === "stable") {
    return <span className="text-gray-500 text-sm">Stable</span>;
  }
  if (trend === "improving") {
    return (
      <span className="text-green-600 text-sm font-medium flex items-center gap-1">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 19.5L6 12l7.5-7.5M18 19.5L10.5 12 18 4.5" />
        </svg>
        Improving
      </span>
    );
  }
  return (
    <span className="text-red-500 text-sm font-medium flex items-center gap-1">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 4.5L18 12l-7.5 7.5M6 4.5L13.5 12 6 19.5" />
      </svg>
      Increasing
    </span>
  );
}

export function PersonList() {
  const { email } = useAuth();
  const navigate = useNavigate();
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/persons", { headers: { "X-User-Email": email! } })
      .then((r) => r.json())
      .then((data) => {
        setPersons(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load care recipients.");
        setLoading(false);
      });
  }, [email]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-gray-900">Care Recipient List</h1>
          <button
            onClick={() => navigate("/upload")}
            className="flex items-center gap-1.5 bg-[#2d5a8f] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#234a75] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Care Recipient
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-8">
          Manage and review care recipient recordings and analysis history
        </p>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-sm text-gray-400">Loading...</div>
          ) : error ? (
            <div className="py-16 text-center text-sm text-red-500">{error}</div>
          ) : persons.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">
              No care recipients yet. Add one via the Upload page.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Care Recipient Name</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Age</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Last Upload</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Total Uploads</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Risk Trend</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {persons.map((p) => (
                  <tr key={p.person_id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">{p.age}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {p.last_visit ? (
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
                          </svg>
                          {new Date(p.last_visit).toISOString().split("T")[0]}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {p.total_uploads} {p.total_uploads === 1 ? "upload" : "uploads"}
                    </td>
                    <td className="px-4 py-4">
                      <RiskTrendBadge trend={p.risk_trend} />
                    </td>
                    <td className="px-4 py-4">
                      <Link to={`/person/${p.person_id}`} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

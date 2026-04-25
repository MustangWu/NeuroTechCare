import { Navigation } from "../components/Navigation";
import { Link } from "react-router";
import { UserCircle, Clock, Target, Upload, Activity, ClipboardList, TrendingUp } from "lucide-react";
import dementiaImg from "../../imports/Dementia-pana.png";

export function Landing() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="bg-white rounded-lg p-12 mb-12 flex items-center justify-between">
          <div className="max-w-xl">
            <h1 className="text-4xl text-gray-900 mb-4">
              AI-Powered Speech Biomarkers for Early Dementia Detection
            </h1>
            <p className="text-gray-600 mb-8">
              Empower your clinical practice with cutting-edge speech analysis technology.
              Detect cognitive decline, make confident referrals, and improve patient outcomes.
            </p>
            <div className="flex gap-4">
              <Link
                to="/upload"
                className="bg-[#2d5a8f] text-white px-6 py-3 rounded-lg hover:bg-[#234a75] transition-colors"
              >
                Upload Recording
              </Link>
              <Link
                to="/dashboard"
                className="border border-gray-300 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                View Dashboard
              </Link>
            </div>
          </div>
          <div className="w-80 shrink-0">
            <img
              src={dementiaImg}
              alt="Healthcare illustration"
              className="w-full"
            />
          </div>
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white rounded-lg p-6">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <UserCircle className="w-6 h-6 text-[#2d5a8f]" />
            </div>
            <div className="text-3xl text-gray-900 mb-1">425,000</div>
            <div className="text-sm text-gray-900 mb-2">Australians with Dementia</div>
            <div className="text-xs text-gray-500">Projected to reach 1.1M by 2060</div>
          </div>

          <div className="bg-white rounded-lg p-6">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-[#2d5a8f]" />
            </div>
            <div className="text-3xl text-gray-900 mb-1">3–5 Years</div>
            <div className="text-sm text-gray-900 mb-2">Average Diagnosis Delay</div>
            <div className="text-xs text-gray-500">Gap left for early intervention</div>
          </div>

          <div className="bg-white rounded-lg p-6">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-[#2d5a8f]" />
            </div>
            <div className="text-3xl text-gray-900 mb-1">1 in 5</div>
            <div className="text-sm text-gray-900 mb-2">MCI Cases Detected by MMSE</div>
            <div className="text-xs text-gray-500">Most early stage declines went undetected</div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl text-center text-gray-900 mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-[#2d5a8f]" />
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-sm text-gray-700">
                1
              </div>
              <h3 className="text-gray-900 mb-2">Upload Recording</h3>
              <p className="text-sm text-gray-600">
                Upload a simple conversation audio file from your clinical encounter
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-[#2d5a8f]" />
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-sm text-gray-700">
                2
              </div>
              <h3 className="text-gray-900 mb-2">AI Analysis</h3>
              <p className="text-sm text-gray-600">
                Our AI extracts speech biomarkers like pause length, lexical diversity, and word choice
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-8 h-8 text-[#2d5a8f]" />
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-sm text-gray-700">
                3
              </div>
              <h3 className="text-gray-900 mb-2">Get Results</h3>
              <p className="text-sm text-gray-600">
                Review results instantly with clinical context and next steps
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-[#2d5a8f]" />
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-sm text-gray-700">
                4
              </div>
              <h3 className="text-gray-900 mb-2">Clinical Decision</h3>
              <p className="text-sm text-gray-600">
                Make informed clinical decisions with confidence using evidence-based insights
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

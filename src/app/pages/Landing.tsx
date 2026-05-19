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
        <div className="bg-white rounded-lg p-8 md:p-12 mb-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl w-full">
            <h1 className="text-3xl md:text-4xl text-gray-900 mb-4">
              Listen Closer: Understand the Changes Before They Become Challenges
            </h1>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">
              Early Dementia Detection Through the Power of Voice
            </h2>
            <p className="text-gray-600 mb-8">
              CogniTrack uses AI to analyse speech patterns and help identify early signs of cognitive decline — giving carers and clinicians the insight they need to act sooner, with confidence.
            </p>
            <div className="flex flex-wrap gap-4">
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
                Find Out More
              </Link>
            </div>
          </div>
          <div className="hidden md:block w-72 shrink-0">
            <img
              src={dementiaImg}
              alt="Healthcare illustration"
              className="w-full"
            />
          </div>
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
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
            <div className="text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-[#2d5a8f]" />
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-sm text-gray-700">
                1
              </div>
              <h3 className="text-gray-900 mb-2">Upload Recording</h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload a simple conversation audio file from your clinical encounter
              </p>
              <Link
                to="/upload"
                className="mt-auto text-sm text-[#2d5a8f] border border-[#2d5a8f] px-4 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Go to Upload
              </Link>
            </div>

            <div className="text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-[#2d5a8f]" />
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-sm text-gray-700">
                2
              </div>
              <h3 className="text-gray-900 mb-2">AI Analysis</h3>
              <p className="text-sm text-gray-600 mb-4">
                Our AI analyses speech patterns like pause length, vocabulary range, and word choice
              </p>
              <Link
                to="/upload"
                className="mt-auto text-sm text-[#2d5a8f] border border-[#2d5a8f] px-4 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Start Analysis
              </Link>
            </div>

            <div className="text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-8 h-8 text-[#2d5a8f]" />
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-sm text-gray-700">
                3
              </div>
              <h3 className="text-gray-900 mb-2">Get Results</h3>
              <p className="text-sm text-gray-600 mb-4">
                Review results instantly with plain-language summaries and suggested next steps
              </p>
              <Link
                to="/results"
                className="mt-auto text-sm text-[#2d5a8f] border border-[#2d5a8f] px-4 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                View Results
              </Link>
            </div>

            <div className="text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-[#2d5a8f]" />
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-sm text-gray-700">
                4
              </div>
              <h3 className="text-gray-900 mb-2">Take Action</h3>
              <p className="text-sm text-gray-600 mb-4">
                Use the insights to make informed decisions and support the people in your care
              </p>
              <Link
                to="/dashboard"
                className="mt-auto text-sm text-[#2d5a8f] border border-[#2d5a8f] px-4 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Find Out More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

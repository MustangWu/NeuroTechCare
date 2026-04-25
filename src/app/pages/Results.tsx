import { Navigation } from "../components/Navigation";
import { FileText, Download } from "lucide-react";

export function Results() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">Analysis Results</h1>
          <p className="text-gray-600">
            Patient: Margaret Thompson<br />
            Recording Date: March 15, 2026
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Transcript */}
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl text-gray-900 mb-4">
                Transcript (Doctor / Patient speech separated)
              </h2>
              <div className="bg-gray-50 rounded-lg p-8 h-96 flex flex-col items-center justify-center">
                <FileText className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500 mb-2">Transcript will appear here</p>
                <p className="text-sm text-gray-400">
                  Upload a recording to view the separated speech transcript
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button className="bg-blue-50 text-[#2d5a8f] px-6 py-3 rounded-lg hover:bg-blue-100 transition-colors">
                Overall Risk Badge
              </button>
              <button className="bg-[#2d5a8f] text-white px-6 py-3 rounded-lg hover:bg-[#234a75] transition-colors flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export PDF
              </button>
            </div>
          </div>

          {/* Right Column - Metrics */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-gray-900 mb-4">MLU Score</h3>
              <div className="h-2 bg-gray-200 rounded-full mb-2">
                <div className="h-2 bg-blue-500 rounded-full w-0"></div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h3 className="text-gray-900 mb-4">Pause Ratio</h3>
              <div className="h-2 bg-gray-200 rounded-full mb-2">
                <div className="h-2 bg-blue-500 rounded-full w-0"></div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h3 className="text-gray-900 mb-4">Type-Token Ratio</h3>
              <div className="h-2 bg-gray-200 rounded-full mb-2">
                <div className="h-2 bg-blue-500 rounded-full w-0"></div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h3 className="text-gray-900 mb-4">Filler Word Count</h3>
              <div className="h-2 bg-gray-200 rounded-full mb-2">
                <div className="h-2 bg-blue-500 rounded-full w-0"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Explainable AI Biomarker Summaries */}
        <div className="mt-8">
          <h2 className="text-2xl text-gray-900 mb-6">Explainable AI Biomarker Summaries</h2>
          <div className="bg-white rounded-lg p-6 space-y-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-gray-900 mb-2">MLU Score Analysis</h3>
              <p className="text-gray-600">
                The Mean Length of Utterance (MLU) measures the average number of words per sentence.
                A low MLU score may indicate potential word-finding difficulty or simplified sentence structure,
                which is commonly seen in early cognitive decline or language processing challenges.
              </p>
            </div>

            <div className="border-l-4 border-amber-500 pl-4">
              <h3 className="text-gray-900 mb-2">Pause Ratio Analysis</h3>
              <p className="text-gray-600">
                The pause ratio reflects the frequency and duration of pauses during speech.
                An elevated pause ratio can suggest hesitation, word retrieval difficulties, or processing delays,
                which may be associated with cognitive impairment or speech planning challenges.
              </p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-gray-900 mb-2">Type-Token Ratio Analysis</h3>
              <p className="text-gray-600">
                The Type-Token Ratio (TTR) measures vocabulary diversity by comparing unique words to total words.
                A lower TTR indicates repetitive language or reduced vocabulary range, which can be an early marker
                of lexical access difficulties or cognitive decline.
              </p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-gray-900 mb-2">Filler Word Count Analysis</h3>
              <p className="text-gray-600">
                Filler words (e.g., "um," "uh," "like") are tracked to assess speech fluency.
                A high filler word count may indicate uncertainty, word-finding struggles, or processing difficulties,
                which can be relevant for assessing communication effectiveness and potential cognitive changes.
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Clinical Note:</strong> These interpretations are based on established speech-language pathology
                research linking acoustic and linguistic features to cognitive health. Individual variations are normal,
                and clinical decisions should always be made in consultation with healthcare professionals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

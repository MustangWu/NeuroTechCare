import { Navigation } from "../components/Navigation";

function DocumentIllustration() {
  return (
    <svg width="100" height="120" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="10" y="10" width="64" height="84" rx="7" fill="#E8EFF8"/>
      <path d="M58 10 L74 26 H58 V10Z" fill="#DDE3EC"/>
      <rect x="58" y="10" width="16" height="16" rx="2" fill="#DDE3EC" fillOpacity="0.8"/>
      <rect x="20" y="38" width="38" height="5" rx="2.5" fill="#0D4F8C" fillOpacity="0.3"/>
      <rect x="20" y="50" width="30" height="5" rx="2.5" fill="#0D4F8C" fillOpacity="0.2"/>
      <rect x="20" y="62" width="34" height="5" rx="2.5" fill="#0D4F8C" fillOpacity="0.3"/>
      <rect x="20" y="74" width="22" height="5" rx="2.5" fill="#0D4F8C" fillOpacity="0.2"/>
      <rect x="58" y="68" width="32" height="24" rx="6" fill="#1D9E75" fillOpacity="0.18"/>
      <polygon points="65,92 73,92 69,100" fill="#1D9E75" fillOpacity="0.18"/>
      <rect x="63" y="74" width="22" height="4" rx="2" fill="#1D9E75" fillOpacity="0.5"/>
      <rect x="63" y="83" width="16" height="4" rx="2" fill="#1D9E75" fillOpacity="0.5"/>
    </svg>
  );
}

export function Results() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-[1440px] mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-foreground mb-2">
            Analysis Results
          </h1>
          <p className="text-muted-foreground">
            Patient: Margaret Thompson
          </p>
          <p className="text-muted-foreground">
            Recording Date: March 15, 2026
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Panel - Transcript */}
          <div className="bg-white border border-border rounded-lg py-4 px-6 h-[700px]">
            <h2 className="text-xl font-medium text-foreground mb-4">
              Transcript (Doctor / Patient speech separated)
            </h2>
            <div className="w-full h-[600px] bg-background border border-border rounded-lg flex flex-col items-center justify-center gap-4">
              <DocumentIllustration />
              <p className="text-sm font-medium text-foreground">Transcript will appear here</p>
              <p className="text-xs text-muted-foreground">Upload a recording to view the separated speech transcript</p>
            </div>
          </div>

          {/* Right Panel - Biomarker Scores */}
          <div className="space-y-6">
            {/* MLU Score */}
            <div className="bg-white border border-border rounded-lg py-4 px-6 border-l-[3px] border-l-primary">
              <h3 className="text-lg font-medium text-foreground mb-4">
                MLU Score
              </h3>
              <div className="w-full h-3 bg-secondary rounded-full"></div>
            </div>

            {/* Pause Ratio */}
            <div className="bg-white border border-border rounded-lg py-4 px-6 border-l-[3px] border-l-accent">
              <h3 className="text-lg font-medium text-foreground mb-4">
                Pause Ratio
              </h3>
              <div className="w-full h-3 bg-secondary rounded-full"></div>
            </div>

            {/* Type-Token Ratio */}
            <div className="bg-white border border-border rounded-lg py-4 px-6 border-l-[3px] border-l-primary">
              <h3 className="text-lg font-medium text-foreground mb-4">
                Type-Token Ratio
              </h3>
              <div className="w-full h-3 bg-secondary rounded-full"></div>
            </div>

            {/* Filler Word Count */}
            <div className="bg-white border border-border rounded-lg py-4 px-6 border-l-[3px] border-l-accent">
              <h3 className="text-lg font-medium text-foreground mb-4">
                Filler Word Count
              </h3>
              <div className="w-full h-3 bg-secondary rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Risk Badge and Export Button */}
        <div className="flex items-center justify-between">
          <div className="inline-block border border-border rounded-lg px-6 py-3 font-medium text-lg bg-secondary text-primary">
            Overall Risk Badge
          </div>
          <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg border border-primary font-medium">
            Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}

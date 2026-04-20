import { Navigation } from "../components/Navigation";
import { Link } from "react-router";
import { Brain, Clock, AlertTriangle, Upload, Cpu, ClipboardList, Stethoscope } from "lucide-react";

export function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-[1440px] mx-auto px-8">
        {/* Hero Section */}
        <div className="py-20 text-center border-b border-border">
          <h1 className="text-4xl font-medium text-foreground mb-6 max-w-4xl mx-auto">
            AI-Powered Speech Biomarkers for Early Dementia Detection
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-3xl mx-auto">
            Empower your clinical practice with cutting-edge speech analysis technology.
            Detect cognitive decline earlier, make confident referrals, and improve patient outcomes.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              to="/upload"
              className="inline-block bg-primary text-primary-foreground px-8 py-4 rounded-lg border border-primary font-medium"
            >
              Upload Recording
            </Link>
            <Link
              to="/dashboard"
              className="inline-block bg-white text-primary border border-primary px-8 py-4 rounded-lg font-medium"
            >
              View Dashboard
            </Link>
          </div>
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12 border-b border-border">
          <div className="bg-white border border-border rounded-lg py-4 px-6 border-l-[3px] border-l-primary">
            <div className="w-14 h-14 bg-secondary rounded-lg mb-4 flex items-center justify-center">
              <Brain className="w-7 h-7 text-primary" />
            </div>
            <div className="text-[28px] font-medium text-primary mb-1">425,000</div>
            <p className="text-foreground font-medium mb-1">Australians with Dementia</p>
            <p className="text-xs text-muted-foreground">Projected to reach 1.1M by 2065</p>
          </div>

          <div className="bg-white border border-border rounded-lg py-4 px-6 border-l-[3px] border-l-accent">
            <div className="w-14 h-14 bg-secondary rounded-lg mb-4 flex items-center justify-center">
              <Clock className="w-7 h-7 text-primary" />
            </div>
            <div className="text-[28px] font-medium text-primary mb-1">3–5 Years</div>
            <p className="text-foreground font-medium mb-1">Average Diagnosis Delay</p>
            <p className="text-xs text-muted-foreground">Time lost for early intervention</p>
          </div>

          <div className="bg-white border border-border rounded-lg py-4 px-6 border-l-[3px] border-l-[#C0392B]">
            <div className="w-14 h-14 bg-secondary rounded-lg mb-4 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-primary" />
            </div>
            <div className="text-[28px] font-medium text-primary mb-1">1 in 5</div>
            <p className="text-foreground font-medium mb-1">MCI Cases Detected by MMSE</p>
            <p className="text-xs text-muted-foreground">Most early-stage decline goes undetected</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="py-16">
          <h2 className="text-3xl font-medium text-foreground text-center mb-12">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary rounded-xl mx-auto mb-4 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div className="w-10 h-10 border border-primary text-primary font-medium flex items-center justify-center mx-auto mb-3 rounded-full text-sm">
                1
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Upload Recording</h3>
              <p className="text-sm text-muted-foreground">
                Upload a routine consultation audio file from your patient interaction
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary rounded-xl mx-auto mb-4 flex items-center justify-center">
                <Cpu className="w-8 h-8 text-primary" />
              </div>
              <div className="w-10 h-10 border border-primary text-primary font-medium flex items-center justify-center mx-auto mb-3 rounded-full text-sm">
                2
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">AI Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Our AI extracts speech biomarkers like pause ratio, lexical diversity, and utterance length
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary rounded-xl mx-auto mb-4 flex items-center justify-center">
                <ClipboardList className="w-8 h-8 text-primary" />
              </div>
              <div className="w-10 h-10 border border-primary text-primary font-medium flex items-center justify-center mx-auto mb-3 rounded-full text-sm">
                3
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Get Results</h3>
              <p className="text-sm text-muted-foreground">
                Receive detailed biomarker scores with clinical interpretations and risk assessment
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary rounded-xl mx-auto mb-4 flex items-center justify-center">
                <Stethoscope className="w-8 h-8 text-primary" />
              </div>
              <div className="w-10 h-10 border border-primary text-primary font-medium flex items-center justify-center mx-auto mb-3 rounded-full text-sm">
                4
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Clinical Decision</h3>
              <p className="text-sm text-muted-foreground">
                Make informed referral decisions with confidence and track progress over time
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

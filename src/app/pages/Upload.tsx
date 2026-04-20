import { Navigation } from "../components/Navigation";
import { useState } from "react";
import { useNavigate } from "react-router";

const MAX_FILE_SIZE_MB = 100;
const ACCEPTED_FORMATS = [".mp3", ".wav", ".m4a"];
const ACCEPTED_MIME = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/m4a", "audio/x-m4a"];

interface FormErrors {
  patientId?: string;
  recordingDate?: string;
  file?: string;
  consent?: string;
}

function validateFile(file: File): string | undefined {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  const validExt = ACCEPTED_FORMATS.includes(ext);
  const validMime = ACCEPTED_MIME.some((m) => file.type.startsWith(m.split("/")[0]) && file.type.includes(m.split("/")[1])) || file.type.startsWith("audio/");
  if (!validExt && !validMime) {
    return `Invalid file format. Please upload an MP3, WAV, or M4A file.`;
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`;
  }
  return undefined;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function UploadIllustration() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="8" y="20" width="56" height="44" rx="8" fill="#E8EFF8"/>
      <rect x="20" y="34" width="32" height="5" rx="2.5" fill="#0D4F8C" fillOpacity="0.25"/>
      <rect x="24" y="45" width="24" height="5" rx="2.5" fill="#0D4F8C" fillOpacity="0.18"/>
      <circle cx="36" cy="16" r="12" fill="#1D9E75" fillOpacity="0.15"/>
      <line x1="36" y1="22" x2="36" y2="10" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round"/>
      <polyline points="31,15 36,10 41,15" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

export function Upload() {
  const [patientId, setPatientId] = useState("");
  const [recordingDate, setRecordingDate] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (incoming: File) => {
    const error = validateFile(incoming);
    if (error) {
      setErrors((prev) => ({ ...prev, file: error }));
      setFile(null);
    } else {
      setErrors((prev) => ({ ...prev, file: undefined }));
      setFile(incoming);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileChange(dropped);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFileChange(selected);
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!patientId.trim()) next.patientId = "Patient ID is required.";
    if (!recordingDate) next.recordingDate = "Recording date is required.";
    if (!file) next.file = next.file ?? "Please select an audio file to upload.";
    if (!consentChecked) next.consent = "You must confirm patient consent before submitting.";
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = validate();
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setIsSubmitting(true);
    // Simulated upload delay — replace with real API call
    await new Promise((r) => setTimeout(r, 1800));
    navigate("/results");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-[1440px] mx-auto px-8 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-medium text-foreground mb-2">
              Upload Patient Recording
            </h1>
            <p className="text-muted-foreground">
              Upload a consultation audio file for speech biomarker analysis
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="bg-white border border-border rounded-lg py-4 px-6">

            {/* Patient ID + Recording Date */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Patient ID *
                </label>
                <input
                  type="text"
                  value={patientId}
                  onChange={(e) => {
                    setPatientId(e.target.value);
                    if (e.target.value.trim()) setErrors((prev) => ({ ...prev, patientId: undefined }));
                  }}
                  placeholder="e.g., PT-2024-001"
                  className={`w-full border px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors.patientId ? "border-destructive bg-red-50" : "border-border"}`}
                />
                {errors.patientId && (
                  <p className="mt-1.5 text-xs text-destructive font-medium">{errors.patientId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Recording Date *
                </label>
                <input
                  type="date"
                  value={recordingDate}
                  onChange={(e) => {
                    setRecordingDate(e.target.value);
                    if (e.target.value) setErrors((prev) => ({ ...prev, recordingDate: undefined }));
                  }}
                  className={`w-full border px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors.recordingDate ? "border-destructive bg-red-50" : "border-border"}`}
                />
                {errors.recordingDate && (
                  <p className="mt-1.5 text-xs text-destructive font-medium">{errors.recordingDate}</p>
                )}
              </div>
            </div>

            {/* Audio Upload Zone */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Audio File *
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-4 p-16 text-center transition-colors rounded-lg ${
                  errors.file
                    ? "border-dashed border-destructive bg-red-50"
                    : isDragging
                    ? "border-primary bg-secondary"
                    : file
                    ? "border-accent bg-green-50"
                    : "border-dashed border-border bg-background"
                }`}
              >
                <input
                  type="file"
                  accept=".mp3,.wav,.m4a,audio/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="audio-upload"
                />
                <label htmlFor="audio-upload" className="cursor-pointer">
                  {file ? (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-secondary rounded-xl mb-4 flex items-center justify-center">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                          <rect x="4" y="6" width="24" height="20" rx="4" fill="#E8EFF8"/>
                          <path d="M12 16l3 3 5-5" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <p className="text-lg font-medium text-foreground mb-1">{file.name}</p>
                      <p className="text-xs text-muted-foreground mb-2">{formatFileSize(file.size)}</p>
                      <p className="text-sm text-muted-foreground">Click to change file</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <UploadIllustration />
                      <p className="text-lg font-medium text-foreground mb-2 mt-2">
                        Drag and drop your audio file here
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
                      <p className="text-xs text-muted-foreground">
                        Supported formats: MP3, WAV, M4A &nbsp;·&nbsp; Max {MAX_FILE_SIZE_MB} MB
                      </p>
                    </div>
                  )}
                </label>
              </div>
              {errors.file && (
                <p className="mt-1.5 text-xs text-destructive font-medium">{errors.file}</p>
              )}
            </div>

            {/* Consent Checkbox */}
            <div className={`mb-8 p-5 border rounded-lg ${errors.consent ? "border-destructive bg-red-50" : "border-border bg-background"}`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => {
                    setConsentChecked(e.target.checked);
                    if (e.target.checked) setErrors((prev) => ({ ...prev, consent: undefined }));
                  }}
                  className="w-5 h-5 mt-0.5 border border-border rounded accent-primary"
                />
                <div className="flex-1">
                  <span className="text-sm text-foreground">
                    I confirm that informed consent has been obtained from the patient for this
                    recording to be used for clinical assessment purposes. *
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    This recording will be processed in accordance with Australian privacy
                    legislation and RACGP guidelines.
                  </p>
                </div>
              </label>
              {errors.consent && (
                <p className="mt-2 text-xs text-destructive font-medium">{errors.consent}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 font-medium text-base rounded-lg bg-primary text-primary-foreground border border-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Analysing…" : "Upload & Analyse"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

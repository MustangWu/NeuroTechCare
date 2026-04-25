import { Navigation } from "../components/Navigation";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Check } from "lucide-react";

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
    else if (!/^[A-Za-z0-9]+$/.test(patientId.trim())) next.patientId = "Patient ID must contain only letters and numbers.";
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
    await new Promise((r) => setTimeout(r, 1800));
    navigate("/results");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">Upload Patient Recording</h1>
          <p className="text-gray-600">
            Upload a consultation audio file for speech biomarker analysis
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="bg-white rounded-lg p-8">

          {/* Patient ID + Recording Date */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm mb-2">
                Patient ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={patientId}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^A-Za-z0-9]/g, "");
                  setPatientId(val);
                  if (val.trim()) setErrors((prev) => ({ ...prev, patientId: undefined }));
                }}
                placeholder="e.g., PT2024001"
                className={`w-full px-4 py-3 border rounded-lg ${errors.patientId ? "border-red-500 bg-red-50" : "border-gray-300"}`}
              />
              {errors.patientId && (
                <p className="mt-1.5 text-xs text-red-600">{errors.patientId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm mb-2">
                Recording Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={recordingDate}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  setRecordingDate(e.target.value);
                  if (e.target.value) setErrors((prev) => ({ ...prev, recordingDate: undefined }));
                }}
                className={`w-full px-4 py-3 border rounded-lg ${errors.recordingDate ? "border-red-500 bg-red-50" : "border-gray-300"}`}
              />
              {errors.recordingDate && (
                <p className="mt-1.5 text-xs text-red-600">{errors.recordingDate}</p>
              )}
            </div>
          </div>

          {/* Audio Upload Zone */}
          <div className="mb-6">
            <label className="block text-sm mb-2">
              Audio File <span className="text-red-500">*</span>
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                errors.file
                  ? "border-red-400 bg-red-50"
                  : isDragging
                  ? "border-blue-400 bg-blue-50"
                  : file
                  ? "border-green-400 bg-green-50"
                  : "border-gray-300 bg-gray-50"
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
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-gray-900 mb-1">{file.name}</p>
                    <p className="text-sm text-gray-500 mb-2">{formatFileSize(file.size)}</p>
                    <p className="text-sm text-blue-600 hover:underline">Click to change file</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <p className="text-gray-900 mb-2">
                      Drag and drop your audio file here
                    </p>
                    <p className="text-sm text-gray-600 mb-4">or click to browse files</p>
                    <p className="text-xs text-gray-500">
                      Supported formats: MP3, WAV, M4A &nbsp;·&nbsp; Max {MAX_FILE_SIZE_MB} MB
                    </p>
                  </div>
                )}
              </label>
            </div>
            {errors.file && (
              <p className="mt-1.5 text-xs text-red-600">{errors.file}</p>
            )}
          </div>

          {/* Consent Checkbox */}
          <div className="mb-8">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => {
                  setConsentChecked(e.target.checked);
                  if (e.target.checked) setErrors((prev) => ({ ...prev, consent: undefined }));
                }}
                className="mt-1 w-4 h-4"
              />
              <span className="text-sm text-gray-900">
                I confirm that informed consent has been obtained from the patient for this
                recording to be used for clinical assessment purposes.{" "}
                <span className="text-red-500">*</span>
                <div className="text-xs text-gray-500 mt-1">
                  This recording will be processed in accordance with Australian privacy
                  legislation and RACGP guidelines.
                </div>
              </span>
            </label>
            {errors.consent && (
              <p className="mt-2 text-xs text-red-600">{errors.consent}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#2d5a8f] text-white py-3 rounded-lg hover:bg-[#234a75] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Analysing…" : "Upload & Analyse"}
          </button>
        </form>
      </div>
    </div>
  );
}

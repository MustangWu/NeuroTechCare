import { Navigation } from "../components/Navigation";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Check, Plus } from "lucide-react";
import { useSession } from "../context/SessionContext";
import { useAuth } from "../context/AuthContext";

const MAX_FILE_SIZE_MB = 100;
const ACCEPTED_FORMATS = [".mp3", ".wav", ".m4a"];
const ACCEPTED_MIME = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/m4a", "audio/x-m4a"];

interface PersonOption {
  person_id: string;
  name: string;
  age: number;
  gender: string;
  risk_level: string | null;
  last_visit: string | null;
}

interface FormErrors {
  personId?: string;
  uploadDate?: string;
  file?: string;
  consent?: string;
  newPersonName?: string;
  newPersonAge?: string;
  newPersonGender?: string;
}

function validateFile(file: File): string | undefined {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  const validExt = ACCEPTED_FORMATS.includes(ext);
  const validMime = ACCEPTED_MIME.some((m) => file.type.startsWith(m.split("/")[0]) && file.type.includes(m.split("/")[1])) || file.type.startsWith("audio/");
  if (!validExt && !validMime) return `Invalid file format. Please upload an MP3, WAV, or M4A file.`;
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`;
  return undefined;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function Upload() {
  const [persons, setPersons] = useState<PersonOption[]>([]);
  const [personsLoading, setPersonsLoading] = useState(true);

  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [showAddNew, setShowAddNew] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonAge, setNewPersonAge] = useState("");
  const [newPersonGender, setNewPersonGender] = useState("");

  const [uploadDate, setUploadDate] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { setSessionData } = useSession();
  const { email } = useAuth();

  useEffect(() => {
    fetch("/api/persons", { headers: { "X-User-Email": email! } })
      .then((r) => r.json())
      .then((data) => setPersons(Array.isArray(data) ? data : []))
      .catch(() => setPersons([]))
      .finally(() => setPersonsLoading(false));
  }, [email]);

  const loadDemo = () => {
    setSessionData({
      personId: "PT-2024-001",
      personName: "Margaret Thompson",
      recordingDate: "2026-04-30",
      transcript:
        "[00:00:01 - 00:00:06] Um, well I woke up this morning and I had some breakfast\n[00:00:07 - 00:00:14] I think it was toast, or maybe it was um, cereal, I can't quite remember\n[00:00:15 - 00:00:22] My daughter called me, she lives um, not too far, the name escapes me right now\n[00:00:23 - 00:00:30] I went for a short walk, the weather was, uh, it was nice I think",
      mlu_score: 9.12,
      pause_ratio: 0.319,
      type_token_ratio: 0.685,
      filler_word_count: 5,
      syntactic_complexity: 3.5,
      dementia_risk_level: "Moderate Risk",
      confidence_score: 0.85,
      trend_direction: "stable",
      biomarker_summaries: {
        mlu_score: { value: 9.12, summary: "The MLU score of 9.12 words per utterance is within the normal range (7–12), indicating relatively standard sentence length and structure." },
        pause_ratio: { value: 0.319, summary: "The pause ratio of 31.9% indicates a significant amount of silence or gaps in speech, potentially reflecting cognitive processing difficulties or reduced fluency." },
        type_token_ratio: { value: 0.685, summary: "The type-token ratio of 0.685 suggests limited lexical diversity, meaning the speaker primarily uses a small set of words, which can be associated with reduced cognitive processing speed." },
        filler_word_count: { value: 5, summary: "The presence of filler words such as 'um' and 'uh' suggests potential hesitation or difficulty formulating thoughts clearly." },
        syntactic_complexity: { value: 3.5, summary: "The transcript contains relatively simple sentence structures with a lack of complex clauses, consistent with a moderate syntactic complexity score." },
        overall_risk: { value: "Moderate Risk", summary: "The combination of moderate syntactic complexity, a high pause ratio, and a low type-token ratio suggests potential cognitive processing difficulties, contributing to a moderate dementia risk assessment." },
      },
    });
    navigate("/results");
  };

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

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
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
    if (showAddNew) {
      if (!newPersonName.trim()) next.newPersonName = "Care recipient name is required.";
      if (!newPersonAge.trim()) next.newPersonAge = "Age is required.";
      else if (isNaN(Number(newPersonAge)) || Number(newPersonAge) < 1 || Number(newPersonAge) > 130)
        next.newPersonAge = "Please enter a valid age.";
      if (!newPersonGender) next.newPersonGender = "Gender is required.";
    } else {
      if (!selectedPersonId) next.personId = "Please select a care recipient.";
    }
    if (!uploadDate) next.uploadDate = "Upload date is required.";
    if (!file) next.file = "Please select an audio file to upload.";
    if (!consentChecked) next.consent = "You must confirm care recipient consent before submitting.";
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = validate();
    if (Object.keys(next).length > 0) { setErrors(next); return; }
    setIsSubmitting(true);

    const resolvedPersonId = showAddNew
      ? `PT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`
      : selectedPersonId;
    const resolvedPersonName = showAddNew
      ? newPersonName.trim()
      : persons.find((p) => p.person_id === selectedPersonId)?.name ?? selectedPersonId;

    try {
      if (showAddNew) {
        const createRes = await fetch("/api/persons", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-User-Email": email! },
          body: JSON.stringify({
            person_id: resolvedPersonId,
            name: resolvedPersonName,
            age: Number(newPersonAge),
            gender: newPersonGender,
          }),
        });
        if (!createRes.ok) {
          const err = await createRes.json();
          setErrors((prev) => ({ ...prev, newPersonId: err.error || "Failed to create care recipient profile." }));
          setIsSubmitting(false);
          return;
        }
      }

      const formData = new FormData();
      formData.append("person_id", resolvedPersonId);
      formData.append("recording_date", uploadDate);
      formData.append("audio", file!);

      const uploadRes = await fetch("/api/recordings", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        setErrors((prev) => ({ ...prev, file: err.error || "Upload failed. Please try again." }));
        setIsSubmitting(false);
        return;
      }
      const result = await uploadRes.json();
      const b = result.biomarkers ?? {};
      const r = result.risk ?? {};
      setSessionData({
        analysisId: result.analysis_id,
        personId: resolvedPersonId,
        personName: resolvedPersonName,
        recordingDate: uploadDate,
        transcript: result.transcript ?? null,
        mlu_score: b.mlu_score,
        pause_ratio: b.pause_ratio,
        type_token_ratio: b.type_token_ratio,
        filler_word_count: b.filler_word_count,
        syntactic_complexity: b.syntactic_complexity,
        biomarker_summaries: b.biomarker_summaries ?? null,
        dementia_risk_level: r.dementia_risk_level,
        confidence_score: r.confidence_score,
        trend_direction: r.trend_direction,
      });
      navigate("/results");
    } catch {
      setErrors((prev) => ({ ...prev, personId: "Network error. Please try again." }));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">Upload Care Recipient Recording</h1>
          <p className="text-gray-600">
            Upload a  audio file for speech biomarker analysis
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="bg-white rounded-lg p-8">

          {/* Select Care Recipient */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm">
                Select Care Recipient <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowAddNew(!showAddNew);
                  setSelectedPersonId("");
                  setErrors((prev) => ({ ...prev, personId: undefined }));
                }}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add New Care Recipient
              </button>
            </div>
            <select
              value={selectedPersonId}
              disabled={showAddNew || personsLoading}
              onChange={(e) => {
                setSelectedPersonId(e.target.value);
                if (e.target.value) setErrors((prev) => ({ ...prev, personId: undefined }));
              }}
              className={`w-full px-4 py-3 border rounded-lg bg-white ${
                showAddNew || personsLoading ? "opacity-40 cursor-not-allowed border-gray-200" :
                errors.personId ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
            >
              <option value="">{personsLoading ? "Loading…" : ""}</option>
              {persons.map((p) => (
                <option key={p.person_id} value={p.person_id}>{p.name}</option>
              ))}
            </select>
            {errors.personId && !showAddNew && (
              <p className="mt-1.5 text-xs text-red-600">{errors.personId}</p>
            )}
          </div>

          {/* New Care Recipient inline form */}
          {showAddNew && (
            <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-semibold text-gray-800 mb-4">New Care Recipient Profile</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newPersonName}
                    onChange={(e) => {
                      setNewPersonName(e.target.value);
                      if (e.target.value.trim()) setErrors((prev) => ({ ...prev, newPersonName: undefined }));
                    }}
                    placeholder="e.g., Margaret Thompson"
                    className={`w-full px-4 py-2.5 border rounded-lg bg-white ${errors.newPersonName ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                  />
                  {errors.newPersonName && <p className="mt-1 text-xs text-red-600">{errors.newPersonName}</p>}
                </div>
                <div>
                  <label className="block text-sm mb-1">Age <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={newPersonAge}
                    min={1}
                    max={130}
                    onChange={(e) => {
                      setNewPersonAge(e.target.value);
                      if (e.target.value) setErrors((prev) => ({ ...prev, newPersonAge: undefined }));
                    }}
                    placeholder="e.g., 72"
                    className={`w-full px-4 py-2.5 border rounded-lg bg-white ${errors.newPersonAge ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                  />
                  {errors.newPersonAge && <p className="mt-1 text-xs text-red-600">{errors.newPersonAge}</p>}
                </div>
                <div>
                  <label className="block text-sm mb-1">Gender <span className="text-red-500">*</span></label>
                  <select
                    value={newPersonGender}
                    onChange={(e) => {
                      setNewPersonGender(e.target.value);
                      if (e.target.value) setErrors((prev) => ({ ...prev, newPersonGender: undefined }));
                    }}
                    className={`w-full px-4 py-2.5 border rounded-lg bg-white ${errors.newPersonGender ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                  {errors.newPersonGender && <p className="mt-1 text-xs text-red-600">{errors.newPersonGender}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Upload Date */}
          <div className="mb-6">
            <label className="block text-sm mb-2">
              Upload Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={uploadDate}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => {
                setUploadDate(e.target.value);
                if (e.target.value) setErrors((prev) => ({ ...prev, uploadDate: undefined }));
              }}
              className={`w-full px-4 py-3 border rounded-lg ${errors.uploadDate ? "border-red-500 bg-red-50" : "border-gray-300"}`}
            />
            {errors.uploadDate && (
              <p className="mt-1.5 text-xs text-red-600">{errors.uploadDate}</p>
            )}
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
                    <p className="text-gray-900 mb-2">Drag and drop your audio file here</p>
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
                I confirm that informed consent has been obtained from the care recipient for this
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

          {isSubmitting && (
            <div className="mt-4 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <div className="mt-0.5 shrink-0 w-4 h-4 border-2 border-[#2d5a8f] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-blue-800">
                <span className="font-medium">Analysis in progress.</span> AI speech analysis typically takes 1–3 minutes. Please keep this page open and do not refresh.
              </p>
            </div>
          )}

          <div className="relative flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            type="button"
            onClick={loadDemo}
            className="w-full border border-gray-300 text-gray-600 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Load Demo Results
          </button>
        </form>
      </div>
    </div>
  );
}

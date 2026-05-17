import { useState, useCallback } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../api/error";

export default function UploadResume() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

    let stored: Record<string, string> = {};
  try {
    stored = JSON.parse(sessionStorage.getItem("registerData") || "{}");
  } catch {
    stored = {};
  }

  const handleSelectedFile = useCallback((selectedFile: File) => {
    if (
      ![
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ].includes(selectedFile.type)
    ) {
      setError("Please upload PDF, DOC, or DOCX files only");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setFile(selectedFile);
    setPreview(selectedFile.name);
    setError("");
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleSelectedFile(selectedFile);
      }
    },
    [handleSelectedFile],
  );

  const submit = async () => {
    if (!file) {
      setError("Please upload your resume");
      return;
    }

    if (!stored?.email || !stored?.firstName || !stored?.lastName || !stored?.phone) {
      setError("Session expired. Please register and verify OTP again.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const formData = new FormData();

      // backend-required fields
      formData.append("firstName", stored.firstName);
      formData.append("middleName", stored.middleName || "");
      formData.append("lastName", stored.lastName);
      formData.append("email", stored.email);
      formData.append("phone", stored.phone);

      formData.append("file", file);

      await api.post("/users/create", formData);

      sessionStorage.setItem("registrationDone", "true");
      sessionStorage.removeItem("registerData");
      sessionStorage.removeItem("email");
      sessionStorage.removeItem("registerDraft");
      navigate("/success");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Upload failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface font-inter text-on-surface flex items-center justify-center px-4 py-10 selection:bg-primary-container/30">
      {/* Subtle Ethereal Background Elements */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary-container/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom duration-700">
        <div className="relative rounded-2xl shadow-soft bg-surface-container-lowest border border-outline-variant px-8 py-10 overflow-hidden">
          {/* Subtle lab decoration */}
          <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
            <div className="w-32 h-32 border-b border-l border-on-surface rounded-bl-3xl" />
          </div>

          {/* Header */}
          <div className="mb-10 text-center relative z-10">
            <div className="inline-flex py-1 px-3 rounded bg-primary-container/10 text-primary-container text-[10px] font-bold tracking-[0.2em] uppercase mb-4">
              Step 2: Upload
            </div>
            <h2 className="text-3xl font-space font-bold text-on-surface">Upload Resume</h2>
            <p className="mt-3 text-sm text-on-surface_variant font-light leading-relaxed">
              Upload your resume for smart parsing and advanced job matching.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-8 rounded-lg bg-red-500/5 border border-red-500/20 px-4 py-3 text-xs text-red-600 animate-in fade-in flex items-center justify-center gap-3 font-medium relative z-10">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {error}
            </div>
          )}

          {/* File upload area */}
          <div className="text-center relative z-10">
            <div 
              className={`relative group rounded-xl p-10 transition-all duration-500 ${
                file 
                  ? "bg-primary/5 shadow-[0_0_40px_rgba(0,108,73,0.05)] border-2 border-primary/20" 
                  : "bg-surface-container-low border-2 border-transparent hover:bg-surface-container-high hover:border-outline-variant"
              }`}
              onDrop={(e) => {
                e.preventDefault();
                const droppedFile = e.dataTransfer.files[0];
                if (droppedFile) {
                  handleSelectedFile(droppedFile);
                }
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              {!file ? (
                <>
                  <div className="w-12 h-12 mx-auto mb-6 bg-surface-bright rounded-lg flex items-center justify-center border border-outline-variant shadow-sm group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <p className="text-sm font-space font-bold text-on-surface mb-1">Upload Document</p>
                  <p className="text-[11px] text-on-surface_variant/40 uppercase tracking-widest font-bold">Drop here or select file</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 mx-auto mb-6 bg-primary/10 rounded-lg flex items-center justify-center shadow-lg shadow-primary/5 transition-transform scale-110">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-space font-bold text-primary mb-1 truncate px-4">{preview}</p>
                  <p className="text-[11px] text-primary/40 uppercase tracking-widest font-bold">Document Added</p>
                </>
              )}
              
              <input
                type="file"
                accept=".pdf,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-xl"
              />
            </div>
          </div>

          <div className="mt-8 space-y-4 relative z-10">
            <button
              onClick={submit}
              disabled={!file || loading}
              className="w-full py-4 btn-gradient rounded-md text-sm font-bold tracking-wide shadow-lg shadow-primary/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? "Submitting..." : "Submit Registration"}
              <div className="w-4 h-px bg-white/40" />
            </button>

            <button
              onClick={() => navigate("/verify")}
              disabled={loading}
              className="w-full py-3.5 bg-surface-container-highest/30 border border-outline-variant text-on-surface_variant text-xs font-bold uppercase tracking-widest rounded-md hover:bg-surface-container-highest/50 transition-all opacity-70 hover:opacity-100"
            >
              Back to Verification
            </button>
          </div>

          <div className="mt-10 pt-6 border-t border-outline-variant text-center">
            <p className="text-[10px] font-bold text-on-surface_variant/30 uppercase tracking-[0.2em]">
              Secure Document Storage Active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

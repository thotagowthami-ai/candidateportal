import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { getApiErrorMessage } from "../api/error";

type LoggedInUser = {
  firstName: string;
  lastName: string;
  email: string;
  // allow null from backend
  resumeUrl: string | null;
};

export default function ResumeViewer() {
  const navigate = useNavigate();
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    const exchangeAndLoad = async (exchangeCode: string) => {
      try {
        setLoading(true);
        const res = await api.post("/auth/exchange", { code: exchangeCode });
        localStorage.setItem("authToken", res.data.accessToken);
        localStorage.setItem("loggedInUser", JSON.stringify(res.data.user));
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        setUser(res.data.user as LoggedInUser);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Authentication failed. Please login again."));
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    if (code) {
      exchangeAndLoad(code);
      return;
    }

    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/");
      return;
    }

    const loadUser = async () => {
      try {
        setLoading(true);
        setError("");

        const userRes = await api.get("/users/me");
        setUser(userRes.data as LoggedInUser);
        localStorage.setItem("loggedInUser", JSON.stringify(userRes.data));
      } catch (err: unknown) {
        setError(
          getApiErrorMessage(err, "Session expired. Please login again."),
        );
        localStorage.removeItem("authToken");
        localStorage.removeItem("loggedInUser");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [navigate]);

  if (loading) return null;
  if (!user) return null;

  const handleOpenResume = () => {
    if (!user.resumeUrl) {
      alert("No resume uploaded yet. Please upload your resume first.");
      return;
    }

    try {
      const u = new URL(user.resumeUrl);
      if (!["http:", "https:"].includes(u.protocol)) {
        throw new Error("Invalid URL protocol");
      }
      window.open(u.toString(), "_blank", "noopener,noreferrer");
    } catch {
      alert("Invalid resume URL. Please re-upload your resume.");
    }
  };

  return (
    <div className="min-h-screen bg-surface font-inter text-on-surface flex items-center justify-center px-4 selection:bg-primary-container/30">
      {/* Subtle Ethereal Background Elements */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary-container/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom duration-700">
        <div className="relative rounded-2xl shadow-soft bg-surface-container-lowest border border-outline-variant px-8 py-10 overflow-hidden text-center">
          {/* Subtle lab decoration */}
          <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
            <div className="w-32 h-32 border-b border-l border-on-surface rounded-bl-3xl" />
          </div>

          <div className="relative z-10">
            {/* Header */}
            <div className="mb-10 text-center">
              <div className="inline-flex py-1 px-3 rounded bg-primary-container/10 text-primary-container text-[10px] font-bold tracking-[0.2em] uppercase mb-4">
                Active Session
              </div>
              <h2 className="text-3xl font-space font-bold text-on-surface">
                {user.firstName} {user.lastName}
              </h2>
              <p className="mt-2 text-sm text-on-surface_variant font-light">
                Email: <span className="font-mono text-primary">{user.email}</span>
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="w-full py-4 bg-surface-container-low border border-outline-variant text-on-surface text-sm font-bold tracking-wide rounded-md hover:bg-surface-container-high transition-all"
              >
                Back to Home
              </button>

              <button
                type="button"
                onClick={() => navigate("/settings")}
                className="w-full py-4 bg-surface-container-low border border-outline-variant text-on-surface text-sm font-bold tracking-wide rounded-md hover:bg-surface-container-high transition-all"
              >
                Settings & Profile
              </button>

              <button
                type="button"
                onClick={handleOpenResume}
                className="w-full py-4 btn-gradient rounded-md text-sm font-bold tracking-wide shadow-lg shadow-primary/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
              >
                View Resume
                <svg className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>

              <div className="pt-2">
                <button
                  onClick={() => {
                    localStorage.removeItem("authToken");
                    localStorage.removeItem("loggedInUser");
                    sessionStorage.clear();
                    navigate("/", { replace: true });
                  }}
                  className="w-full py-3.5 bg-surface-container-highest/30 border border-outline-variant text-on-surface_variant text-xs font-bold uppercase tracking-widest rounded-md hover:bg-surface-container-highest/50 transition-all opacity-70 hover:opacity-100"
                >
                  Sign Out
                </button>
              </div>

              {error && (
                <div className="mt-4 rounded-lg bg-red-500/5 border border-red-500/20 px-4 py-3 text-xs text-red-600 animate-in fade-in flex items-center justify-center gap-3 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {error}
                </div>
              )}
            </div>
            
            <div className="mt-8 pt-6 border-t border-outline-variant text-center">
              <p className="text-[10px] font-bold text-on-surface_variant/30 uppercase tracking-[0.2em]">
                All systems operational
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

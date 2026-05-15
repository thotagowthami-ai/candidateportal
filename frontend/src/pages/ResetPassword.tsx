import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api";
import { getApiErrorMessage } from "../api/error";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [status, setStatus] = useState("Verifying reset link...");
  const [error, setError] = useState("");

  useEffect(() => {
    const email = params.get("email") ?? "";
    const token = params.get("token") ?? "";

    if (!email || !token) {
      setError("Reset link is incomplete. Please request a new one.");
      setStatus("");
      return;
    }

    const verify = async () => {
      try {
        const response = await api.post("/auth/reset-password", {
          email,
          token,
        });
        localStorage.setItem("authToken", response.data.accessToken);
        if (response.data.user) {
          localStorage.setItem("loggedInUser", JSON.stringify(response.data.user));
        }
        setStatus("Reset link verified. Redirecting to your dashboard...");
        setTimeout(() => navigate("/resume"), 1200);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Reset link is invalid or expired."));
        setStatus("");
      }
    };

    verify();
  }, [navigate, params]);

  return (
    <div className="min-h-screen bg-surface font-inter text-on-surface flex items-center justify-center px-4 py-10 selection:bg-primary-container/30">
      {/* Subtle Ethereal Background Elements */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary-container/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom duration-700">
        <div className="relative rounded-2xl shadow-soft bg-surface-container-lowest border border-outline-variant px-8 py-12 overflow-hidden text-center space-y-4">
          {/* Subtle lab decoration */}
          <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
            <div className="w-32 h-32 border-b border-l border-on-surface rounded-bl-3xl" />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="inline-flex py-1 px-3 rounded bg-primary-container/10 text-primary-container text-[10px] font-bold tracking-[0.2em] uppercase mb-6">
              Password Recovery
            </div>
            
            <h2 className="text-3xl font-space font-bold text-on-surface mb-2">Reset Password</h2>
            
            {status && (
              <div className="flex flex-col items-center gap-4 mt-4">
                <p className="text-sm text-primary font-bold animate-pulse tracking-wide">{status}</p>
                <div className="w-12 h-1 bg-primary/20 rounded-full overflow-hidden">
                  <div className="h-full bg-primary animate-[loading_1.5s_ease-in-out_infinite]" />
                </div>
              </div>
            )}
            
            {error && (
              <div className="space-y-6 mt-4">
                <div className="rounded-lg bg-red-500/5 border border-red-500/20 px-4 py-3 text-xs text-red-600 animate-in fade-in flex items-center gap-3 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {error}
                </div>
                
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="w-full py-4 text-xs font-bold uppercase tracking-widest bg-surface-container-highest/30 border border-outline-variant text-on-surface rounded-md hover:bg-surface-container-highest/50 transition-all"
                >
                  Request New Link
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

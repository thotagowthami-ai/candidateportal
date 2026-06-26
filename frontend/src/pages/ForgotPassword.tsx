import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { getApiErrorMessage } from "../api/error";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setNotice("Enter your registered email to continue.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setNotice("");
      await api.post("/auth/forgot-password", { email: normalizedEmail });
      setNotice("Reset link sent. Please check your inbox.");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to send reset link."));
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

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom duration-700">
        <div className="relative rounded-2xl shadow-soft bg-surface-container-lowest border border-outline-variant px-8 py-10 overflow-hidden text-center">
          {/* Subtle lab decoration */}
          <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
            <div className="w-32 h-32 border-b border-l border-on-surface rounded-bl-3xl" />
          </div>

          <div className="mb-10 relative z-10">
            <div className="inline-flex py-1 px-3 rounded bg-primary-container/10 text-primary-container text-[10px] font-bold tracking-[0.2em] uppercase mb-4">
              Account Recovery
            </div>
            <h2 className="text-3xl font-space font-bold text-on-surface">Reset Password</h2>
            <p className="mt-3 text-sm text-on-surface_variant font-light leading-relaxed text-center mx-auto max-w-xs">
              Enter your registered email to receive a password reset link.
            </p>
          </div>

          <div className="space-y-6 relative z-10">
            {error && (
              <div className="rounded-lg bg-red-500/5 border border-red-500/20 px-4 py-3 text-xs text-red-600 animate-in fade-in flex items-center gap-3 font-medium justify-center transition-all">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </div>
            )}
            {notice && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-xs text-primary animate-in fade-in flex items-center gap-3 font-medium justify-center transition-all">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                {notice}
              </div>
            )}

            <div className="space-y-2 text-left">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface_variant/60">Registered Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md bg-surface-container-low px-4 py-3.5 text-sm text-on-surface placeholder:text-on-surface_variant/30 outline-none transition-all duration-300 border-2 border-transparent focus:border-primary-container focus:bg-surface-bright focus:ring-4 focus:ring-primary-container/10 shadow-sm"
                placeholder="name@example.com"
              />
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 btn-gradient rounded-md text-sm font-bold tracking-wide shadow-lg shadow-primary/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-3 mt-2"
            >
              {loading ? "Sending..." : "Send Reset Link"}
              <div className="w-4 h-px bg-white/40" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full py-3.5 bg-surface-container-highest/30 border border-outline-variant text-on-surface_variant text-xs font-bold uppercase tracking-widest rounded-md hover:bg-surface-container-highest/50 transition-all opacity-70 hover:opacity-100"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

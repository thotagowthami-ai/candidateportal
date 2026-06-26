import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { getApiErrorMessage } from "../api/error";

export default function VerifyOtp() {
  const navigate = useNavigate();

  const [otp, setOtp] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [resendTimer, setResendTimer] = useState(30);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const email = sessionStorage.getItem("email");

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    const newOtp = pasted.split("").concat(Array(6 - pasted.length).fill(""));
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const verify = async () => {
    if (!email) {
      navigate("/register", { replace: true });
      return;
    }

    const code = otp.join("");
    if (code.length < 6) return;

    try {
      setLoading(true);
      setError("");
      setStatusMessage("");

      const res = await api.post("/auth/verify-otp", {
        email,
        otp: code,
      });

      if (res.data?.isNewUser === false) {
        localStorage.setItem("authToken", res.data.accessToken);
        localStorage.setItem("loggedInUser", JSON.stringify(res.data.user));
        navigate("/settings");
      } else {
        if (res.data?.userData) {
          sessionStorage.setItem("registerData", JSON.stringify(res.data.userData));
        }
        navigate("/upload");
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Invalid OTP"));
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!email || resendTimer > 0) return;

    try {
      setLoading(true);
      setError("");
      setStatusMessage("");

      await api.post("/auth/resend-otp", { email });

      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
      setResendTimer(30);

      setStatusMessage("New OTP sent successfully.");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to resend OTP"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resendTimer <= 0) return;

    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (!email) {
      navigate("/register", { replace: true });
      return;
    }

    inputRefs.current[0]?.focus();
  }, [email, navigate]);

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
              Step 1: Verification
            </div>
            <h2 className="text-3xl font-space font-bold text-on-surface">Confirm Identity</h2>
            <p className="mt-3 text-sm text-on-surface_variant font-light leading-relaxed">
              Passcode transmitted to <span className="text-primary font-bold">{email || "your email"}</span>. Enter the code to continue.
            </p>
          </div>

          <div className="space-y-6 relative z-10">
            {error && (
              <div className="rounded-lg bg-red-500/5 border border-red-500/20 px-4 py-3 text-xs text-red-600 animate-in fade-in flex items-center gap-3 font-medium justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            {statusMessage && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-xs text-primary animate-in fade-in flex items-center gap-3 font-medium justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                {statusMessage}
              </div>
            )}

            <div
              className="flex justify-center gap-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant"
              onPaste={handlePaste}
            >
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  aria-label={`OTP digit ${idx + 1} of 6`}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={idx === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className="h-12 w-10 sm:w-12 rounded-md bg-surface-bright border-2 border-transparent text-center text-xl font-space font-bold text-on-surface outline-none transition-all duration-300 focus:border-primary-container focus:ring-4 focus:ring-primary-container/10 shadow-sm"
                />
              ))}
            </div>

            <button
              type="button"
              onClick={verify}
              disabled={loading || otp.join("").length < 6}
              className="w-full py-4 btn-gradient rounded-md text-sm font-bold tracking-wide shadow-lg shadow-primary/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? "Verifying..." : "Verify & Continue"}
              <div className="w-4 h-px bg-white/40" />
            </button>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => navigate("/register")}
                disabled={loading}
                className="w-full py-3 bg-surface-container-highest/30 border border-outline-variant text-on-surface_variant text-xs font-bold uppercase tracking-widest rounded-md hover:bg-surface-container-highest/50 transition-all opacity-70 hover:opacity-100"
              >
                Return to Sign Up
              </button>

              <button
                type="button"
                onClick={resendOtp}
                disabled={resendTimer > 0 || loading}
                className="text-[11px] font-bold uppercase tracking-widest text-primary hover:text-primary-container disabled:opacity-40 transition-all py-2"
              >
                {resendTimer > 0 ? `Resend Code in: ${resendTimer}s` : "Didn't receive code? Re-transmit"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

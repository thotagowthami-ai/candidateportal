import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { getApiErrorMessage } from "../api/error";
import { useGoogleLogin } from '@react-oauth/google';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  

  // --- STANDARD EMAIL LOGIN ---
  const onLogin = async () => {
    if (!email) {
      setError("Enter your email");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setNotice("");

      await api.post("/auth/initiate-login", { email });

      // Save email for the VerifyOtp page
      sessionStorage.setItem("email", email);
      navigate("/verify");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  // --- GOOGLE SIGN-IN LOGIC ---
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError("");
        // Send the google token to our Candidate Portal NestJS backend
        const response = await api.post("/users/google-login", { 
          token: tokenResponse.access_token 
        });

        localStorage.setItem("authToken", response.data.accessToken);
        localStorage.setItem("loggedInUser", JSON.stringify(response.data.user));
        navigate("/settings");
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Google login failed on backend"));
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Google authorization failed"),
  });

  return (
    <div className="min-h-screen bg-surface font-inter text-on-surface flex items-center justify-center px-4 py-10 selection:bg-primary-container/30">
      {/* Subtle Ethereal Background Elements */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary-container/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom duration-700">
        <div className="grid overflow-hidden rounded-2xl shadow-soft bg-surface-container-lowest md:grid-cols-[1fr_1.1fr]">
          <aside className="relative overflow-hidden bg-surface-container-low p-8 md:p-12 border-r border-outline-variant">
            <div className="relative z-10 space-y-8">
              <div className="inline-flex py-1 px-3 rounded bg-primary-container/10 text-primary-container text-[10px] font-bold tracking-[0.2em] uppercase">
                Candidate Portal
              </div>
              
              <h2 className="text-4xl lg:text-5xl font-space font-bold leading-tight tracking-tight text-on-surface">
                Accelerate Your <br />
                <span className="text-gradient">Career Path.</span>
              </h2>
              
              <p className="text-sm text-on-surface_variant leading-relaxed max-w-sm font-light">
                Securely manage your professional profile, verify your identity, and unlock high-quality job matches.
              </p>

              <div className="space-y-6 pt-6">
                {[
                  { title: "Smart Matching", desc: "Precision alignment with the perfect roles for your skills." },
                  { title: "Secure Profile", desc: "Your professional document history, safe and encrypted." },
                  { title: "Detailed Profiling", desc: "Deep-indexing of your technical skills and experience." }
                ].map((feature, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-bright shadow-sm border border-outline-variant group-hover:border-primary-container/40 transition-colors">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-space font-bold text-on-surface">{feature.title}</h4>
                      <p className="text-xs text-on-surface_variant/60">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subtle lab textures */}
            <div className="absolute bottom-0 right-0 opacity-10 pointer-events-none">
              <div className="w-64 h-64 border-t border-l border-outline-variant rounded-tl-[120px]" />
            </div>
          </aside>

          <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
            <div className="mb-10">
              <h3 className="text-2xl font-space font-bold text-on-surface mb-2">Welcome Back</h3>
              <p className="text-sm text-on-surface_variant">
                Log in with your registered email to access your account.
              </p>
            </div>

            <div className="space-y-6">
              {error && (
                <div className="rounded-lg bg-red-500/5 border border-red-500/20 px-4 py-3 text-xs text-red-600 animate-in fade-in flex items-center gap-3 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {error}
                </div>
              )}
              {notice && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-xs text-primary animate-in fade-in flex items-center gap-3 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {notice}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface_variant/60">
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md bg-surface-container-low px-4 py-3.5 text-sm text-on-surface placeholder:text-on-surface_variant/30 outline-none transition-all duration-300 border-2 border-transparent focus:border-primary-container focus:bg-surface-bright focus:ring-4 focus:ring-primary-container/10"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={onLogin}
                disabled={loading || !email}
                className="w-full py-4 btn-gradient rounded-md text-sm font-bold tracking-wide shadow-lg shadow-primary/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? "Signing In..." : "Sign In"}
                <div className="w-4 h-px bg-white/40" />
              </button>

              <div className="flex items-center gap-4 py-2">
                <div className="h-px flex-1 bg-outline-variant" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface_variant/40 whitespace-nowrap">Or continue with</span>
                <div className="h-px flex-1 bg-outline-variant" />
              </div>

              <button
                type="button"
                onClick={() => handleGoogleLogin()}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-md bg-surface-container-highest/30 border border-outline-variant px-6 py-3.5 text-sm font-bold text-on-surface transition hover:bg-surface-container-highest/50 active:scale-[0.98] disabled:cursor-not-allowed"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google Account
              </button>

              <div className="pt-6 text-center">
                <p className="text-[12px] text-on-surface_variant/60 font-medium">
                  New here?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/register")}
                    className="font-bold text-primary hover:text-primary-container transition-colors"
                  >
                    Create an Account
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
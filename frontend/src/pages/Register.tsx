import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { getApiErrorMessage } from "../api/error";

const initialForm = {
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  phone: "",
};

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const draft = localStorage.getItem("registerDraft");
    if (!draft) return;

    try {
      const parsed = JSON.parse(draft);
      setForm({
        ...initialForm,
        ...parsed,
      });
    } catch {
      localStorage.removeItem("registerDraft");
    }
  }, []);

  const submit = async () => {
    if (!form.email || !form.firstName || !form.lastName || !form.phone) return;

    try {
      setLoading(true);
      setError("");
      await api.post("/auth/initiate", form);
      localStorage.setItem("email", form.email);
      localStorage.setItem("registerDraft", JSON.stringify(form));
      navigate("/verify");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Unable to complete registration. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem("registerDraft", JSON.stringify(updated));
      return updated;
    });
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

          <div className="mb-10 text-center relative z-10">
            <div className="inline-flex py-1 px-3 rounded bg-primary-container/10 text-primary-container text-[10px] font-bold tracking-[0.2em] uppercase mb-4">
              Join the Platform
            </div>
            <h2 className="text-3xl font-space font-bold text-on-surface">Create an Account</h2>
            <p className="mt-3 text-sm text-on-surface_variant font-light leading-relaxed">
              Enter your details to create your professional profile and unlock career opportunities.
            </p>
          </div>

          <div className="space-y-6 relative z-10">
            {error && (
              <div className="rounded-lg bg-red-500/5 border border-red-500/20 px-4 py-3 text-xs text-red-600 animate-in fade-in flex items-center gap-3 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface_variant/60">First Name</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  className="w-full rounded-md bg-surface-container-low px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface_variant/30 outline-none transition-all duration-300 border-2 border-transparent focus:border-primary-container focus:bg-surface-bright focus:ring-4 focus:ring-primary-container/10"
                  placeholder="John"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface_variant/60">Last Name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  className="w-full rounded-md bg-surface-container-low px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface_variant/30 outline-none transition-all duration-300 border-2 border-transparent focus:border-primary-container focus:bg-surface-bright focus:ring-4 focus:ring-primary-container/10"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface_variant/60">Middle Name (Optional)</label>
              <input
                type="text"
                value={form.middleName}
                onChange={(e) => handleChange("middleName", e.target.value)}
                className="w-full rounded-md bg-surface-container-low px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface_variant/30 outline-none transition-all duration-300 border-2 border-transparent focus:border-primary-container focus:bg-surface-bright focus:ring-4 focus:ring-primary-container/10"
                placeholder="Middle Name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface_variant/60">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full rounded-md bg-surface-container-low px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface_variant/30 outline-none transition-all duration-300 border-2 border-transparent focus:border-primary-container focus:bg-surface-bright focus:ring-4 focus:ring-primary-container/10"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface_variant/60">Phone Number</label>
              <div className="flex items-center gap-0 rounded-md bg-surface-container-low border-2 border-transparent focus-within:border-primary-container focus-within:bg-surface-bright focus-within:ring-4 focus-within:ring-primary-container/10 transition-all duration-300 overflow-hidden">
                <span className="px-4 py-2.5 text-sm text-on-surface_variant/50 font-bold bg-surface-container-high">+91</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full bg-transparent px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface_variant/30 outline-none"
                  placeholder="98765 43210"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <p className="text-[11px] text-on-surface_variant/50 text-center leading-relaxed font-medium">
                We'll never share your details. A secure one-time passcode will be transmitted to your email for identity verification.
              </p>
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={loading || !form.email || !form.firstName || !form.lastName || !form.phone}
              className="w-full py-4 btn-gradient rounded-md text-sm font-bold tracking-wide shadow-lg shadow-primary/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? "Sending..." : "Send Passcode & Continue"}
              <div className="w-4 h-px bg-white/40" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full py-3.5 bg-surface-container-highest/30 border border-outline-variant text-on-surface_variant text-xs font-bold uppercase tracking-widest rounded-md hover:bg-surface-container-highest/50 transition-all"
            >
              Already have an account? Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

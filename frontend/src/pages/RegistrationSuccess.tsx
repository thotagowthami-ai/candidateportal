import { useNavigate } from "react-router-dom";

export default function RegistrationSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface font-inter text-on-surface flex items-center justify-center px-4 selection:bg-primary-container/30">
      {/* Subtle Ethereal Background Elements */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary-container/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom duration-700">
        <div className="relative rounded-2xl shadow-soft bg-surface-container-lowest border border-outline-variant px-8 py-12 text-center text-on-surface overflow-hidden">
          {/* Subtle lab decoration */}
          <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
            <div className="w-32 h-32 border-b border-l border-on-surface rounded-bl-3xl" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex py-1 px-3 rounded bg-primary-container/10 text-primary-container text-[10px] font-bold tracking-[0.2em] uppercase mb-6">
              Registration Complete
            </div>
            
            <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center shadow-lg shadow-primary/5">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-space font-bold text-on-surface">Profile Created</h2>
            <p className="mt-3 text-sm text-on-surface_variant font-light leading-relaxed max-w-xs mx-auto">
              Your professional profile has been securely created. Sign in to view your dashboard.
            </p>

            <button
              onClick={() => {
                sessionStorage.removeItem("registrationDone");
                navigate("/login");
              }}
              className="mt-8 w-full py-4 btn-gradient rounded-md text-sm font-bold tracking-wide shadow-lg shadow-primary/10 active:scale-[0.98] flex items-center justify-center gap-3 transition-all"
            >
              Sign In
              <div className="w-4 h-px bg-white/40" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

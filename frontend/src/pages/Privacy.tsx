import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  const LAST_UPDATED = "May 15, 2026";
  return (
    <div className="min-h-screen bg-surface font-inter text-on-surface selection:bg-primary-container/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="text-xl font-space font-bold tracking-tight text-on-surface flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white font-black">C</div>
            Candidate Portal
          </Link>
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-on-surface_variant hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="pt-32 pb-20 max-w-4xl mx-auto px-6">
        <h1 className="text-4xl md:text-5xl font-space font-bold mb-8">Privacy Policy</h1>
        <div className="prose prose-invert max-w-none text-on-surface_variant leading-relaxed space-y-6">
          <p>
            At Candidate Portal, we take your privacy seriously. This privacy policy describes how we collect, use, and protect your personal information when you use our platform.
          </p>
          
          <h2 className="text-2xl font-bold text-on-surface mt-10 mb-4">1. Information We Collect</h2>
          <p>
            When you register for an account, we collect personal information such as your name, email address, phone number, and professional history as provided in your uploaded resume.
          </p>

          <h2 className="text-2xl font-bold text-on-surface mt-10 mb-4">2. How We Use Your Information</h2>
          <p>
            We use your information to intelligently match you with relevant career opportunities. Your resume is parsed and securely stored to facilitate connecting you with hiring companies that align with your skills and experience.
          </p>

          <h2 className="text-2xl font-bold text-on-surface mt-10 mb-4">3. Data Security</h2>
          <p>
            We implement advanced encryption and security measures to ensure your data is protected against unauthorized access, alteration, disclosure, or destruction. We do not sell your personal information to third parties.
          </p>

          <h2 className="text-2xl font-bold text-on-surface mt-10 mb-4">4. Your Rights</h2>
          <p>
            You have the right to access, update, or delete your profile information at any time. If you wish to permanently close your account and remove your data, you may do so through your account settings or by contacting our support team.
          </p>

          <p className="mt-12 text-sm opacity-60">
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </main>
    </div>
  );
}

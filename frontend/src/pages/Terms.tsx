import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TERMS_LAST_UPDATED = "May 15, 2026";

export default function Terms() {
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
        <h1 className="text-4xl md:text-5xl font-space font-bold mb-8">Terms of Service</h1>
        <div className="prose prose-invert max-w-none text-on-surface_variant leading-relaxed space-y-6">
          <p>
            Welcome to the Candidate Portal. By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully.
          </p>
          
          <h2 className="text-2xl font-bold text-on-surface mt-10 mb-4">1. Acceptance of Terms</h2>
          <p>
            By registering for an account, you confirm that you are at least 18 years old and capable of forming a binding contract. If you are using the service on behalf of an organization, you are agreeing to these terms for that organization.
          </p>

          <h2 className="text-2xl font-bold text-on-surface mt-10 mb-4">2. Account Registration</h2>
          <p>
            You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your password and account credentials. You must notify us immediately of any unauthorized use of your account.
          </p>

          <h2 className="text-2xl font-bold text-on-surface mt-10 mb-4">3. User Conduct</h2>
          <p>
            You agree not to use the platform for any unlawful purpose or in any way that violates these terms. This includes uploading false or misleading information, impersonating another person, or attempting to compromise the security of the portal.
          </p>

          <h2 className="text-2xl font-bold text-on-surface mt-10 mb-4">4. Platform Modifications</h2>
          <p>
            We reserve the right to modify or discontinue the platform (or any part thereof) with or without notice at any time. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the service.
          </p>

          <p className="mt-12 text-sm opacity-60">
            Last updated: {TERMS_LAST_UPDATED}
          </p>
        </div>
      </main>
    </div>
  );
}

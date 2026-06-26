import React from 'react';
import { motion } from 'framer-motion';
import { Search, Bell, Settings, ArrowUpRight, ArrowRight, Layers, Database, ShieldCheck, FileText, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/api';

const Landing = () => {
  const [showContactModal, setShowContactModal] = React.useState(false);
  const [formData, setFormData] = React.useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [loading, setLoading] = React.useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/contact', formData);
      alert(`Thanks ${formData.firstName}! Our team member will connect with you soon.`);
      setShowContactModal(false);
      setFormData({ firstName: '', lastName: '', email: '', phone: '' });
    } catch (error) {
      alert('Failed to send contact request. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8 },
    },
  };

  return (
    <div className="min-h-screen bg-surface font-inter text-on-surface selection:bg-primary-container/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link to="/register" className="text-xl font-space font-bold tracking-tight text-on-surface flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white font-black">C</div>
              Candidate Portal
            </Link>
            

          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-on-surface_variant">
              <Link to="/settings" className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                <Settings className="w-5 h-5" />
              </Link>
              <Link to="/login" className="ml-2 px-5 py-2.5 btn-gradient rounded-md text-sm font-bold tracking-wide">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-8"
          >
            <motion.div variants={itemVariants} className="inline-flex py-1 px-3 rounded bg-primary-container/10 text-primary-container text-[10px] font-bold tracking-[0.2em] uppercase w-fit">
              Explore Opportunities
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <h1 className="text-6xl lg:text-8xl font-space font-bold leading-[0.9] tracking-tighter text-on-surface">
                Accelerate Your<br />
                <span className="text-gradient">Career Path.</span>
              </h1>
            </motion.div>
            
            <motion.p variants={itemVariants} className="max-w-md text-lg text-on-surface_variant leading-relaxed font-light">
              Elevate your professional trajectory with our smart platform. AuraRecruiting transforms static resumes into dynamic profiles, matching elite talent with top-tier opportunities.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex items-center gap-6 pt-4">
              <Link to="/register" className="px-8 py-4 btn-gradient rounded-md font-bold flex items-center gap-3 group">
                Create Account
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="px-8 py-4 bg-surface-container-highest text-on-surface rounded-md font-bold hover:bg-surface-container-high transition-colors">
                Explore Jobs
              </button>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2 }}
            className="relative"
          >
            <div className="rounded-2xl overflow-hidden shadow-soft aspect-[4/5] bg-surface-container-low border border-outline-variant">
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80" 
                alt="Team Collaboration" 
                className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-1000"
              />
            </div>
            
            {/* Floating Glass Card */}
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="absolute -bottom-8 -left-8 glass p-6 rounded-xl shadow-soft border border-outline-variant max-w-[200px]"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded bg-primary-container/20 flex items-center justify-center text-primary-container">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-on-surface_variant">Smart Matching</span>
              </div>
              <div className="text-3xl font-space font-bold text-on-surface mb-1">94.2%</div>
              <p className="text-[10px] text-on-surface_variant/70 leading-tight">AI matching precision is fully activated.</p>
            </motion.div>
          </motion.div>
        </section>

        {/* Environment Modules */}
        <section className="max-w-7xl mx-auto px-6 mt-40">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="mb-16">
              <h2 className="text-3xl font-space font-bold tracking-tight mb-2">Platform Features</h2>
              <div className="w-20 h-1 bg-primary"></div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              {/* Primary Cards */}
              <motion.div 
                variants={itemVariants} 
                whileHover={{ y: -8, boxShadow: '0 20px 50px rgba(25, 28, 30, 0.1)' }}
                className="md:col-span-1 lg:col-span-3 bg-surface-container-lowest p-10 rounded-2xl shadow-soft group transition-all duration-500 cursor-pointer"
              >
                <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-space font-bold mb-4">Resume Parsing</h3>
                <p className="text-on-surface_variant text-sm leading-relaxed mb-8 opacity-70">
                  Upload your resume. Our intelligent parsing engine extracts your key skills and experiences, making you visible to the industry's top employers.
                </p>
                <Link to="/register" className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-primary leading-none group-hover:gap-4 transition-all">
                  Create Profile <ArrowUpRight className="w-4 h-4" />
                </Link>
              </motion.div>

              <motion.div 
                variants={itemVariants} 
                whileHover={{ y: -8, boxShadow: '0 20px 50px rgba(25, 28, 30, 0.1)' }}
                className="md:col-span-1 lg:col-span-3 bg-surface-container-lowest p-10 rounded-2xl shadow-soft group transition-all duration-500 cursor-pointer text-on-surface"
              >
                <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-space font-bold mb-4">Smart Job Matching</h3>
                <p className="text-on-surface_variant text-sm leading-relaxed mb-8 opacity-70">
                  Don't just apply—get matched. Our algorithmic matchmaking connects you with roles that perfectly align with your skills and career goals.
                </p>
                <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-primary leading-none group-hover:gap-4 transition-all">
                  Log In <ArrowUpRight className="w-4 h-4" />
                </Link>
              </motion.div>

              {/* Smaller Cards */}
              <motion.div variants={itemVariants} className="lg:col-span-2 bg-surface-container-low p-8 rounded-2xl group hover:bg-surface-container-high transition-colors text-on-surface">
                <ShieldCheck className="w-6 h-6 text-on-surface_variant/40 mb-6" />
                <h4 className="font-space font-bold text-lg mb-2">Secure Documents</h4>
                <p className="text-xs text-on-surface_variant opacity-60">Your professional documents are encrypted and protected at the base layer.</p>
              </motion.div>

              <motion.div variants={itemVariants} className="lg:col-span-2 bg-surface-container-low p-8 rounded-2xl group hover:bg-surface-container-high transition-colors text-on-surface">
                <Zap className="w-6 h-6 text-on-surface_variant/40 mb-6" />
                <h4 className="font-space font-bold text-lg mb-2">Instant Parsing</h4>
                <p className="text-xs text-on-surface_variant opacity-60">Rapid extraction of skills, education, and professional milestones.</p>
              </motion.div>

              <motion.div variants={itemVariants} className="lg:col-span-2 bg-primary p-8 rounded-2xl text-white group hover:opacity-95 transition-opacity">
                <ArrowRight className="w-6 h-6 text-white/40 mb-6" />
                <h4 className="font-space font-bold text-lg mb-2 text-white">Easy Applications</h4>
                <p className="text-xs text-white/60">Seamless transitions between profile updates and applying for jobs.</p>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Methodology Section */}
        <section className="max-w-7xl mx-auto px-6 mt-48 grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-5 flex flex-col gap-8"
          >
            <div className="inline-flex py-1 px-3 rounded bg-primary-container/10 text-primary-container text-[10px] font-bold tracking-[0.2em] uppercase w-fit">
              How It Works
            </div>
            
            <h2 className="text-5xl font-space font-bold text-on-surface leading-tight">Our Process.</h2>
            
            <div className="flex flex-col gap-12 mt-4">
              {[
                { id: '01', title: '1. Sign Up', desc: 'Secure identity verification and fast initialization for a comprehensive profile.' },
                { id: '02', title: '2. Smart Parsing', desc: 'Deep indexing of your professional history and the creation of your candidate profile.' },
                { id: '03', title: '3. Get Matched', desc: 'Real-time matching with the open requirements of world-class companies.' },
              ].map((step) => (
                <div key={step.id} className="flex gap-6 group">
                  <span className="text-3xl font-space font-bold text-primary opacity-40 group-hover:opacity-100 transition-opacity">{step.id}</span>
                  <div>
                    <h4 className="font-space font-bold text-xl mb-2">{step.title}</h4>
                    <p className="text-on-surface_variant/70 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-7 grid grid-cols-2 gap-6"
          >
            <div className="col-span-2 rounded-2xl overflow-hidden shadow-soft bg-surface-container-low border border-outline-variant aspect-[16/9]">
              <img 
                src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80" 
                alt="Working Flow" 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="bg-surface-container-highest/30 p-10 rounded-2xl border-l-4 border-primary">
              <p className="text-lg italic font-light text-on-surface_variant leading-relaxed">
                "The Candidate Portal transformed our hiring process. We no longer search; we connect with excellence."
              </p>
              <div className="mt-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-container-highest"></div>
                <div>
                  <div className="text-sm font-bold">Director of Recruiting</div>
                  <div className="text-[10px] tracking-widest uppercase opacity-40">Tech Innovations</div>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low p-10 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="text-4xl font-space font-bold text-on-surface mb-2">99%</div>
                <div className="text-[10px] tracking-widest uppercase opacity-40 font-bold">Success Rate</div>
              </div>
              <p className="text-xs text-on-surface_variant leading-relaxed opacity-70">
                Optimized for the best candidate-company fit.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Final CTA */}
        <section className="bg-on-surface mt-48 text-surface py-32 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-6xl md:text-8xl font-space font-bold tracking-tighter mb-8 leading-[0.9]">
                Ready to <span className="text-primary-container">Get Started?</span>
              </h2>
              <p className="max-w-2xl mx-auto text-surface/60 text-lg mb-12 font-light">
                Join the Candidate Portal network today. The platform is open for elite talent and forward-thinking enterprises.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <button 
                  onClick={() => setShowContactModal(true)}
                  className="w-full sm:w-auto px-10 py-5 bg-primary-container text-white rounded-md font-bold text-lg hover:bg-primary-container/90 transition-all">
                  Talk to our Team Member
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-outline-variant py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="text-lg font-space font-bold text-on-surface mb-2">Candidate Portal</div>
            <p className="text-xs text-on-surface_variant opacity-50">© 2024 CANDIDATE PORTAL. YOUR CAREER PARTNER.</p>
          </div>
          
          <div className="flex gap-12">
            <Link to="/privacy" className="text-xs font-bold tracking-widest uppercase text-on-surface_variant/60 hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="text-xs font-bold tracking-widest uppercase text-on-surface_variant/60 hover:text-primary transition-colors">
              Terms
            </Link>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center hover:bg-surface-container-high transition-colors cursor-pointer">
              <Zap className="w-4 h-4 text-on-surface_variant" />
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center hover:bg-surface-container-high transition-colors cursor-pointer">
              <Layers className="w-4 h-4 text-on-surface_variant" />
            </div>
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-container-lowest rounded-2xl p-8 max-w-md w-full shadow-2xl border border-outline-variant"
          >
            <h3 className="text-2xl font-space font-bold text-on-surface mb-2">Talk to our Team Member</h3>
            <p className="text-sm text-on-surface_variant mb-6">Leave your details and we'll connect with you shortly.</p>
            
            <form onSubmit={handleContactSubmit} className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface_variant/60">First Name</label>
                  <input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} type="text" className="w-full rounded-md bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none border-2 border-transparent focus:border-primary-container shadow-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface_variant/60">Last Name</label>
                  <input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} type="text" className="w-full rounded-md bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none border-2 border-transparent focus:border-primary-container shadow-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface_variant/60">Email Address</label>
                <input required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} type="email" className="w-full rounded-md bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none border-2 border-transparent focus:border-primary-container shadow-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface_variant/60">Phone Number</label>
                <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} type="tel" className="w-full rounded-md bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none border-2 border-transparent focus:border-primary-container shadow-sm" />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowContactModal(false)} className="flex-1 py-3 bg-surface-container-high rounded-md text-sm font-bold text-on-surface hover:bg-surface-container-highest transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-3 btn-gradient rounded-md text-sm font-bold shadow-lg text-white disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Landing;

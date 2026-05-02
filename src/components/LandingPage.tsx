import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Shield, Brain, Sparkles, Target, Activity, ShieldCheck, Lock, Check, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { APP_LOGO } from '../constants';
import GlassCard from './GlassCard';

const Navbar = ({ onLogin }: { onLogin: () => void }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-6 sm:px-12">
      <div className="max-w-7xl mx-auto flex items-center justify-between glass-morphism rounded-3xl border border-white/20 px-6 py-4 shadow-xl">
        <Link to="/" className="flex items-center gap-3">
          <img src={APP_LOGO} className="w-8 h-8 rounded-xl object-cover" alt="Phobix" />
          <span className="text-xl font-bold tracking-tighter italic uppercase text-gray-900">PHOBIX</span>
        </Link>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10">
          <a href="#features" className="text-xs font-black text-gray-500 uppercase tracking-widest hover:text-blue-600 transition-colors">Features</a>
          <a href="#methodology" className="text-xs font-black text-gray-500 uppercase tracking-widest hover:text-blue-600 transition-colors">Methodology</a>
          <a href="#pricing" className="text-xs font-black text-gray-500 uppercase tracking-widest hover:text-blue-600 transition-colors">Pricing</a>
          <button 
            onClick={onLogin}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            Launch Interface
          </button>
        </div>

        {/* Mobile Nav Toggle */}
        <button className="md:hidden p-2 text-gray-900" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <motion.div 
        initial={false}
        animate={isOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        className={`md:hidden absolute top-24 left-6 right-6 bg-white rounded-3xl border border-gray-100 shadow-2xl p-8 space-y-6 z-50 ${isOpen ? 'block' : 'hidden'}`}
      >
        <a href="#features" onClick={() => setIsOpen(false)} className="block text-sm font-black text-gray-900 uppercase tracking-widest">Features</a>
        <a href="#methodology" onClick={() => setIsOpen(false)} className="block text-sm font-black text-gray-900 uppercase tracking-widest">Methodology</a>
        <a href="#pricing" onClick={() => setIsOpen(false)} className="block text-sm font-black text-gray-900 uppercase tracking-widest">Pricing</a>
        <button 
          onClick={() => { setIsOpen(false); onLogin(); }}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest"
        >
          Get Started
        </button>
      </motion.div>
    </nav>
  );
};

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <GlassCard className="p-8 space-y-4 hover:border-blue-500/30 transition-all border-gray-100 bg-white/50 backdrop-blur-xl group">
    <div className="p-3 bg-blue-50 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-500 shadow-inner">
      <Icon className="text-blue-600" size={24} />
    </div>
    <h3 className="text-xl font-bold text-gray-900 italic uppercase tracking-tight">{title}</h3>
    <p className="text-sm text-gray-500 leading-relaxed font-medium">{description}</p>
  </GlassCard>
);

const LandingPage = ({ onLogin }: { onLogin: () => void }) => {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">
      <Navbar onLogin={onLogin} />

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6 sm:px-12">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.4, 0.3] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-blue-100/50 rounded-full blur-[120px]" 
          />
          <motion.div 
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.4, 0.3] }}
            transition={{ duration: 12, repeat: Infinity }}
            className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-indigo-100/50 rounded-full blur-[120px]" 
          />
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-[0.4em] rounded-full border border-blue-100/50">Neural Recalibration Proto</span>
              <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold tracking-tighter leading-[0.9] text-gray-900 italic uppercase">
                Rewire Your <br />
                <span className="text-blue-600">Ancestral</span> <br />
                Response.
              </h1>
            </motion.div>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg sm:text-xl text-gray-500 leading-relaxed font-medium max-w-lg"
            >
              Phobix is a clinical-grade interface designed to transform anxiety into your greatest competitive advantage. Scientific exposure therapy, delivered via neural topography.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button 
                onClick={onLogin}
                className="px-10 py-5 bg-blue-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-[0_20px_40px_-10px_rgba(37,99,235,0.3)] hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 group"
              >
                Initiate Journey
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
              </button>
              <a 
                href="#features"
                className="px-10 py-5 bg-white text-gray-900 border border-gray-100 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center"
              >
                Learn Methodology
              </a>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-6 pt-8"
            >
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-12 h-12 rounded-2xl border-4 border-white bg-gray-100 overflow-hidden shadow-lg">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 123}`} alt="User" />
                  </div>
                ))}
              </div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                <span className="text-gray-900">2.4k+</span> Synapses Syncing Currently
              </p>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            className="hidden md:block relative"
          >
            <div className="absolute inset-0 bg-blue-600/10 blur-[100px] rounded-full animate-pulse" />
            <GlassCard className="relative p-2 rounded-[3.5rem] border-white/60 shadow-[0_64px_128px_-24px_rgba(0,0,0,0.1)]">
              <div className="bg-gray-50 rounded-[3rem] overflow-hidden shadow-inner border border-gray-100 aspect-[4/5] relative">
                {/* Mock UI Preview */}
                <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_0.5px,transparent_0.5px)] [background-size:20px_20px] opacity-20" />
                <div className="p-8 space-y-8">
                  <div className="flex justify-between items-center">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200" />
                    <div className="space-y-1">
                      <div className="w-24 h-2 bg-gray-200 rounded-full" />
                      <div className="w-16 h-2 bg-gray-100 rounded-full" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-32 bg-white rounded-3xl border border-gray-100 shadow-sm" />
                    <div className="h-32 bg-white rounded-3xl border border-gray-100 shadow-sm" />
                  </div>
                  <div className="h-48 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-center">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="64" cy="64" r="56" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                        <circle cx="64" cy="64" r="56" fill="none" stroke="#2563eb" strokeWidth="8" strokeDasharray="351" strokeDashoffset="100" strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black italic">72%</span>
                        <span className="text-[6px] font-black uppercase text-gray-400">Resilience</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-24 bg-gray-50 relative overflow-hidden group">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 grid grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
          {[
            { label: "Active Nodes", value: "142k+" },
            { label: "Neural Recovery", value: "89%" },
            { label: "Clinical Precision", value: "99.9%" },
            { label: "Sync Latency", value: "42ms" }
          ].map((stat, i) => (
            <div key={i} className="text-center group-hover:scale-110 transition-transform duration-700">
              <p className="text-4xl sm:text-5xl font-black tracking-tighter text-gray-900 italic uppercase">{stat.value}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 sm:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-24 space-y-4">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.5em]">System Capabilities</span>
          <h2 className="text-4xl sm:text-6xl font-bold tracking-tighter italic uppercase text-gray-900 leading-none">
            Precision Built. <br />
            Resilience Measured.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard 
            icon={Brain} 
            title="Neural Topography" 
            description="Visualize your anxiety via a live, interactive map. Identify stressed nodes and target recalibration with clinical precision." 
          />
          <FeatureCard 
            icon={Zap} 
            title="Exposure Ladder" 
            description="Dynamic 10-step protocol tailored by AI to gradually broaden your threshold for stress without system overload." 
          />
          <FeatureCard 
            icon={ShieldCheck} 
            title="Data-Backed Growth" 
            description="Every session is tracked, analyzed, and synthesized into actionable resilience metrics you can trust." 
          />
          <FeatureCard 
            icon={Target} 
            title="Targeted Missions" 
            description="AI-generated tasks designed to push your boundaries in real-world environments, safe but challenging." 
          />
          <FeatureCard 
            icon={Activity} 
            title="Biometric Sync" 
            description="Integrate your physical responses with your neural profile for a comprehensive 360° view of your resilience." 
          />
          <FeatureCard 
            icon={Lock} 
            title="Neural Vault" 
            description="Industrial-grade encryption for all your neural mapping. Your journey is private, secure, and sovereign." 
          />
        </div>
      </section>

      {/* Methodology Section */}
      <section id="methodology" className="py-32 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:40px_40px] opacity-10" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 sm:px-12 grid lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-12">
            <div className="space-y-4">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.5em]">The Protocol</span>
              <h2 className="text-4xl sm:text-7xl font-bold tracking-tighter italic uppercase leading-none">
                Clinical Science. <br />
                Aggressive Growth.
              </h2>
            </div>
            
            <div className="space-y-8">
              {[
                { title: "Neuroplasticity Focus", text: "We leverage the brain's ability to rewire itself through consistent, controlled stress spikes." },
                { title: "Zero Filler Strategy", text: "Direct exposure. No pseudo-science. Only protocols that yield measurable neural density." },
                { title: "AI-Stabilized Pacing", text: "Our coach monitors your progress and prevents burnout by balancing intensity with precision recovery." }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 group">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:bg-blue-500 transition-colors">
                    <Check size={24} className="text-blue-400 group-hover:text-white" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xl font-bold italic uppercase group-hover:text-blue-400 transition-colors">{item.title}</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
             <div className="absolute -inset-10 bg-blue-600/20 blur-[120px] rounded-full" />
             <GlassCard className="p-10 border-white/10 bg-white/5 backdrop-blur-3xl space-y-8">
                <div className="h-64 bg-gray-800 rounded-3xl border border-white/5 relative overflow-hidden flex items-end p-6">
                   <div className="absolute top-6 left-6 space-y-1">
                      <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Neural Load</p>
                      <p className="text-xl font-bold tracking-tight italic">98.4% Efficiency</p>
                   </div>
                   <div className="flex items-end gap-2 w-full h-32">
                      {[40, 70, 45, 90, 65, 80, 55, 95, 75, 85].map((h, i) => (
                        <motion.div 
                          key={i}
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h}%` }}
                          className="flex-1 bg-gradient-to-t from-blue-600 to-indigo-400 rounded-t-lg"
                        />
                      ))}
                   </div>
                </div>
                <div className="p-6 bg-blue-600 rounded-2xl text-center space-y-2 cursor-pointer shadow-xl shadow-blue-600/30 active:scale-95 transition-all">
                   <p className="text-[10px] font-black uppercase tracking-widest text-blue-100">Synchronize Nodes Now</p>
                </div>
             </GlassCard>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 sm:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-24 space-y-4">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.5em]">The Investment</span>
          <h2 className="text-4xl sm:text-6xl font-bold tracking-tighter italic uppercase text-gray-900 leading-none">
            Choose Your <br />
            Upgrade Tier.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <GlassCard className="p-10 space-y-8 border-gray-100 bg-white shadow-lg flex flex-col">
            <div className="space-y-4 flex-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Standard Access</span>
              <h3 className="text-4xl font-bold text-gray-900 italic uppercase">Novice</h3>
              <p className="text-5xl font-black text-gray-900 tracking-tighter">$0 <span className="text-lg font-bold text-gray-400">/ forever</span></p>
              <div className="space-y-4 pt-8">
                {["Limited Neural Mapping", "Basic Exposure Tasks", "Standard Dashboard", "Community Support"].map((f, i) => (
                  <div key={i} className="flex gap-3 text-sm text-gray-500 font-medium">
                    <Check size={18} className="text-green-500 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <button 
              onClick={onLogin}
              className="w-full py-4 border-2 border-gray-100 rounded-2xl text-sm font-black uppercase tracking-widest hover:border-blue-600 transition-colors"
            >
              Start Free
            </button>
          </GlassCard>

          {/* Premium Tier */}
          <GlassCard className="p-10 space-y-8 border-blue-500/50 bg-blue-600 text-white shadow-2xl relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 p-6">
              <Sparkles className="text-blue-300 opacity-50" size={32} />
            </div>
            <div className="space-y-4 flex-1 relative z-10">
              <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Elite Access</span>
              <h3 className="text-4xl font-bold italic uppercase">Apex</h3>
              <p className="text-5xl font-black tracking-tighter">$19 <span className="text-lg font-bold text-blue-200">/ lifetime</span></p>
              <div className="space-y-4 pt-8">
                {[
                  "Full Neural Topographic Map", 
                  "Infinite AI Coach Access", 
                  "Advanced Biometric Analysis", 
                  "Priority Sync Protocol",
                  "Elite Mastery Badges"
                ].map((f, i) => (
                  <div key={i} className="flex gap-3 text-sm font-medium">
                    <Check size={18} className="text-blue-300 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <button 
              onClick={onLogin}
              className="w-full py-4 bg-white text-blue-600 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-blue-50 transition-colors relative z-10 shadow-xl"
            >
              Unlock Apex Access
            </button>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 border-t border-gray-100 bg-white px-6 sm:px-12">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-16">
          <div className="space-y-6 col-span-2">
            <Link to="/" className="flex items-center gap-3">
              <img src={APP_LOGO} className="w-10 h-10 rounded-xl object-cover" alt="Phobix" />
              <span className="text-2xl font-bold tracking-tighter italic uppercase text-gray-900 leading-none">PHOBIX</span>
            </Link>
            <p className="text-sm text-gray-500 max-w-xs font-medium">
              Transforming biological stress into competitive resilience through data-driven neural recalibration.
            </p>
            <div className="flex items-center gap-4 pt-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer">
                <Target size={20} />
              </div>
              <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer">
                <Brain size={20} />
              </div>
              <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer">
                <Lock size={20} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Navigation</h4>
            <div className="space-y-4">
              <a href="#features" className="block text-xs font-black text-gray-900 uppercase tracking-widest hover:text-blue-600">Features</a>
              <a href="#methodology" className="block text-xs font-black text-gray-900 uppercase tracking-widest hover:text-blue-600">Methodology</a>
              <a href="#pricing" className="block text-xs font-black text-gray-900 uppercase tracking-widest hover:text-blue-600">Pricing</a>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocol</h4>
            <div className="space-y-4">
              <Link to="/privacy" className="block text-xs font-black text-gray-900 uppercase tracking-widest hover:text-blue-600">Privacy Policy</Link>
              <Link to="/terms" className="block text-xs font-black text-gray-900 uppercase tracking-widest hover:text-blue-600">Terms of Service</Link>
              <p className="block text-xs font-black text-gray-900 uppercase tracking-widest opacity-30">Phobix v2.4.0</p>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-24 flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">© 2026 NEURAL INTERFACE LABS • ALL RIGHTS RESERVED</p>
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-blue-600" />
            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">STRICT NEURAL SECURITY PROTOCOL ACTIVE</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

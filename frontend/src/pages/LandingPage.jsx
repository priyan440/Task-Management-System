import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuroraBackground from '../components/shared/AuroraBackground';
import ParticlesBackground from '../components/shared/ParticlesBackground';
import GlassCard from '../components/shared/GlassCard';
import Button from '../components/shared/Button';
import { 
  Kanban, Calendar, Brain, Clock, Zap, Users, ArrowRight, Shield, Globe, 
  Menu, X, Sparkles, LayoutDashboard, Target
} from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Monitor scroll for progress bar
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.pageYOffset / totalScroll) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Kanban,
      title: "Interactive Kanban Boards",
      desc: "Organize tasks visually in columns (Todo, In Progress, Review, Completed) with drag-and-drop mechanics."
    },
    {
      icon: Calendar,
      title: "Dynamic Calendar Engine",
      desc: "Plan schedules with day, week, month, and agenda layouts. Create or modify tasks directly on the grid."
    },
    {
      icon: Clock,
      title: "Focused Pomodoro Timer",
      desc: "Incorporate concentration timers and focus modes directly into card activities to boost productivity."
    },
    {
      icon: Brain,
      title: "NLP Heuristic AI Suggestions",
      desc: "Instantly analyze task names to recommend priority classifications, category mapping, and target dates."
    },
    {
      icon: Zap,
      title: "WebSocket Live Sync",
      desc: "Collaborate instantly. Updates to comments, assignments, and card moves sync across all open browsers."
    },
    {
      icon: Users,
      title: "Workspace Members Roles",
      desc: "Split project channels into team workspaces, invite members, and adjust admin permissions dynamically."
    }
  ];

  return (
    <AuroraBackground>
      {/* Scroll Progress Indicator */}
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />

      {/* Floating Canvas Particles */}
      <ParticlesBackground />

      {/* Sticky Header */}
      <header className="sticky top-0 w-full z-50 glassmorphism border-b border-white/5 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center glow-primary">
              <Target className="text-white w-5 h-5" />
            </div>
            <span className="font-poppins font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-accent">
              Aurora
            </span>
            <span className="text-xs uppercase bg-primary/20 text-indigo-300 px-2 py-0.5 rounded-full border border-primary/30">
              SaaS
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#demo" className="hover:text-white transition-colors">Live View</a>
            <a href="#stats" className="hover:text-white transition-colors">Impact</a>
          </nav>

          {/* Auth CTA buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <Button onClick={() => navigate('/dashboard')} variant="primary" icon={LayoutDashboard}>
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Button onClick={() => navigate('/register')} variant="accent">
                  Create Account
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Icon */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-slate-300 hover:text-white">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full glassmorphism border-b border-white/10 px-6 py-8 flex flex-col gap-6 animate-fade-in">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-lg text-slate-300 hover:text-white">Features</a>
            <a href="#demo" onClick={() => setMobileMenuOpen(false)} className="text-lg text-slate-300 hover:text-white">Live View</a>
            <a href="#stats" onClick={() => setMobileMenuOpen(false)} className="text-lg text-slate-300 hover:text-white">Impact</a>
            <div className="h-px bg-white/10 my-2" />
            {isAuthenticated ? (
              <Button onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }} variant="primary" className="w-full">
                Dashboard
              </Button>
            ) : (
              <div className="flex flex-col gap-4">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-center py-2 text-slate-300 hover:text-white font-semibold">
                  Sign In
                </Link>
                <Button onClick={() => { setMobileMenuOpen(false); navigate('/register'); }} variant="accent" className="w-full">
                  Create Account
                </Button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 flex flex-col items-center justify-center text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center justify-center"
        >
          {/* Tag badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glassmorphism border-white/5 mb-8 hover:border-primary/40 transition-colors duration-300">
            <Sparkles className="text-accent w-4 h-4" />
            <span className="text-xs font-semibold text-slate-300">Futuristic Task Management Redefined</span>
          </div>

          {/* Heading */}
          <h1 className="font-poppins font-extrabold text-4xl sm:text-6xl md:text-7xl leading-tight max-w-5xl tracking-tight">
            Float in space,
            <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
              Sync your tasks in real time
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-8 text-lg md:text-xl text-slate-400 max-w-3xl leading-relaxed">
            Experience a stunning Notion-inspired environment merged with ClickUp and Linear performance. Built on WebSockets, local-first intelligence, and elegant glassmorphism.
          </p>

          {/* Hero CTAs */}
          <div className="mt-12 flex flex-col sm:flex-row items-center gap-6 justify-center w-full max-w-md">
            <Button onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')} variant="primary" className="w-full sm:w-auto text-base py-3.5 px-8" icon={ArrowRight}>
              Get Started Free
            </Button>
            <a href="#features" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full sm:w-auto text-base py-3.5 px-8">
                Explore Features
              </Button>
            </a>
          </div>
        </motion.div>

        {/* Dashboard Mockup Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mt-20 w-full max-w-5xl rounded-2xl p-2 bg-gradient-to-tr from-primary/30 via-secondary/15 to-accent/30 shadow-neonPrimary/20 relative group"
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-primary via-secondary to-accent opacity-30 blur-2xl -z-10 group-hover:opacity-40 transition-opacity" />
          <GlassCard className="p-0 overflow-hidden border-white/10 rounded-xl bg-darkBg/90 backdrop-blur-3xl">
            {/* Window header */}
            <div className="bg-white/[0.03] border-b border-white/5 px-4 py-3 flex items-center justify-between">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="bg-white/5 text-xs text-slate-400 px-12 py-1 rounded-md max-w-xs overflow-hidden text-ellipsis">
                app.auroraboard.com/workspace
              </div>
              <div className="w-8" />
            </div>

            {/* Mock Dashboard Layout */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 text-left min-h-[360px] bg-darkBg/95">
              {/* Sidebar */}
              <div className="hidden md:flex flex-col gap-4 border-r border-white/5 pr-4 text-xs text-slate-400">
                <span className="uppercase text-[10px] tracking-wider text-slate-500 font-bold">Workspace</span>
                <div className="bg-white/5 text-white px-3 py-2 rounded-lg font-semibold flex items-center gap-2">
                  <span>🏠</span> My Workspace
                </div>
                <span className="uppercase text-[10px] tracking-wider text-slate-500 font-bold mt-4">Views</span>
                <div className="flex flex-col gap-2">
                  <div className="px-3 py-1.5 rounded-md text-white font-semibold bg-primary/20 flex items-center gap-2">
                    <LayoutDashboard size={14} /> Dashboard
                  </div>
                  <div className="px-3 py-1.5 rounded-md flex items-center gap-2 hover:bg-white/5 transition-colors">
                    <Kanban size={14} /> Kanban Board
                  </div>
                  <div className="px-3 py-1.5 rounded-md flex items-center gap-2 hover:bg-white/5 transition-colors">
                    <Calendar size={14} /> Calendar
                  </div>
                  <div className="px-3 py-1.5 rounded-md flex items-center gap-2 hover:bg-white/5 transition-colors">
                    <Clock size={14} /> Pomodoro
                  </div>
                </div>
              </div>

              {/* Board content mockup */}
              <div className="md:col-span-3 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <h3 className="text-lg font-poppins font-bold text-white flex items-center gap-2">
                    ⚡ Production Sprint
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-slate-400 font-semibold">Socket Connected</span>
                  </div>
                </div>
                {/* Mock columns */}
                <div className="grid grid-cols-3 gap-4">
                  {/* ToDo */}
                  <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3 flex flex-col gap-3">
                    <span className="text-xs font-semibold text-slate-400">ToDo (1)</span>
                    <div className="glassmorphism p-3 rounded-lg flex flex-col gap-2 border-l-4 border-l-primary">
                      <span className="text-xs font-bold text-slate-200">Design Aurora Logo</span>
                      <p className="text-[10px] text-slate-400">Framer illustrations</p>
                      <span className="text-[9px] self-start bg-primary/10 text-indigo-300 px-1.5 py-0.5 rounded font-bold">DESIGN</span>
                    </div>
                  </div>
                  {/* In Progress */}
                  <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3 flex flex-col gap-3">
                    <span className="text-xs font-semibold text-slate-400">In Progress (1)</span>
                    <div className="glassmorphism p-3 rounded-lg flex flex-col gap-2 border-l-4 border-l-secondary">
                      <span className="text-xs font-bold text-slate-200">WebSocket Integration</span>
                      <p className="text-[10px] text-slate-400">Real-time collaboration checks</p>
                      <span className="text-[9px] self-start bg-secondary/20 text-violet-300 px-1.5 py-0.5 rounded font-bold">DEV</span>
                    </div>
                  </div>
                  {/* Completed */}
                  <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3 flex flex-col gap-3">
                    <span className="text-xs font-semibold text-slate-400">Completed (1)</span>
                    <div className="glassmorphism p-3 rounded-lg flex flex-col gap-2 border-l-4 border-l-accent opacity-75">
                      <span className="text-xs font-bold text-slate-200 line-through text-slate-400">JSON Fallback Core</span>
                      <p className="text-[10px] text-slate-500">Dual model wrapper engine</p>
                      <span className="text-[9px] self-start bg-accent/20 text-cyan-300 px-1.5 py-0.5 rounded font-bold">COMPLETED</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 relative z-10 border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-3xl md:text-5xl font-poppins font-extrabold text-white">
            Supercharged productivity
          </h2>
          <p className="mt-4 text-slate-400">
            A premium full stack suite packed with standard-setting productivity mechanics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <GlassCard key={idx} hover={true} className="flex flex-col gap-4 border-white/5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center border border-white/10 group-hover:border-primary/40">
                  <Icon className="text-accent w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-100 font-poppins">
                  {feat.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {feat.desc}
                </p>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full glassmorphism border-t border-white/5 py-12 px-6 mt-auto text-center relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center">
              <Target className="text-white w-4 h-4" />
            </div>
            <span className="font-poppins font-bold text-slate-200">Aurora Board</span>
          </div>
          <span className="text-xs text-slate-500">
            &copy; 2026 Aurora Task Management. Designed under Advanced Agentic Pair-programming rules.
          </span>
        </div>
      </footer>
    </AuroraBackground>
  );
};

export default LandingPage;
// Export default

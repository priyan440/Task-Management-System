import React from 'react';

const AuroraBackground = ({ children, className = '' }) => {
  return (
    <div className={`relative min-h-screen bg-darkBg text-slate-100 overflow-hidden ${className}`}>
      {/* Aurora mesh light blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Deep background mesh grid */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#1e1b4b_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,#0f172a_0%,transparent_60%)]" />
        
        {/* Orbiting blurred shape 1 (Indigo) */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] animate-pulse-slow" />
        
        {/* Orbiting blurred shape 2 (Violet) */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/15 blur-[120px] animate-float-slow" />

        {/* Orbiting blurred shape 3 (Cyan) */}
        <div className="absolute top-[40%] right-[30%] w-[35%] h-[35%] rounded-full bg-accent/10 blur-[100px] animate-pulse-slow" style={{ animationDuration: '6s' }} />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />

      {/* Content wrapper */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default AuroraBackground;

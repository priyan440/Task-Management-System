import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  type = 'button', 
  loading = false, 
  disabled = false, 
  onClick, 
  className = '',
  icon: Icon
}) => {
  const baseStyle = "relative ripple-btn inline-flex items-center justify-center font-semibold px-6 py-2.5 rounded-xl transition-all duration-300 active:scale-95 text-sm";
  
  const variants = {
    primary: "bg-gradient-to-r from-primary to-secondary text-white shadow-neonPrimary hover:glow-primary hover:brightness-110 disabled:opacity-50",
    secondary: "bg-white/[0.06] text-slate-200 border border-slate-700 hover:bg-white/[0.1] hover:border-slate-500",
    accent: "bg-gradient-to-r from-accent to-primary text-white shadow-neonAccent hover:glow-accent hover:brightness-110",
    glass: "glassmorphism text-slate-100 hover:bg-white/[0.08] border-white/10 hover:border-primary/30",
    danger: "bg-red-500/20 text-red-200 border border-red-500/30 hover:bg-red-500/30 hover:border-red-500/60"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          {Icon && <Icon size={16} className="text-current" />}
          {children}
        </span>
      )}
    </button>
  );
};

export default Button;

import React from 'react';

const GlassCard = ({ 
  children, 
  className = '', 
  hover = false, 
  glow = false, 
  onClick 
}) => {
  return (
    <div 
      onClick={onClick}
      className={`
        glassmorphism rounded-2xl p-6 transition-all duration-300
        ${hover ? 'hover:bg-white/[0.08] hover:border-primary/30 hover:shadow-neonPrimary/20 hover:-translate-y-0.5 cursor-pointer' : ''}
        ${glow ? 'shadow-neonPrimary/10 border-primary/20' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GlassCard;

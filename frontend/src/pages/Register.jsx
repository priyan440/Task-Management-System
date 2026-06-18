import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import AuroraBackground from '../components/shared/AuroraBackground';
import ParticlesBackground from '../components/shared/ParticlesBackground';
import GlassCard from '../components/shared/GlassCard';
import Button from '../components/shared/Button';
import { User, Mail, Lock, UserCheck, ArrowLeft, Target, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

const Register = () => {
  const { register: signup } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { 
    register, 
    handleSubmit, 
    watch,
    formState: { errors } 
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'User'
    }
  });

  const watchPassword = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    const result = await signup(data.name, data.email, data.password);
    setLoading(false);
    if (result && result.success) {
      navigate('/login');
    }
  };

  return (
    <AuroraBackground className="flex items-center justify-center p-6">
      <ParticlesBackground />

      <Link to="/" className="absolute top-6 left-6 text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2 font-semibold">
        <ArrowLeft size={16} /> Back to Landing Page
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md my-8"
      >
        <GlassCard className="border-white/10 glow-secondary/10 shadow-glass">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center glow-secondary mx-auto mb-4">
              <Target className="text-white w-6 h-6" />
            </div>
            <h2 className="text-2xl font-poppins font-extrabold text-white">Create Account</h2>
            <p className="text-xs text-slate-400 mt-2">Initialize your modern workflow manager.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Full Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4.5 h-4.5" />
                <input
                  type="text"
                  placeholder="John Doe"
                  {...register('name', { required: 'Name is required' })}
                  className={`
                    w-full pl-11 pr-4 py-2 rounded-xl bg-white/[0.03] border text-sm text-white placeholder-slate-500 outline-none transition-all duration-300
                    ${errors.name ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-primary focus:shadow-neonPrimary/20'}
                  `}
                />
              </div>
              {errors.name && <span className="text-[10px] text-red-400 font-medium">{errors.name.message}</span>}
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4.5 h-4.5" />
                <input
                  type="email"
                  placeholder="john@example.com"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                  })}
                  className={`
                    w-full pl-11 pr-4 py-2 rounded-xl bg-white/[0.03] border text-sm text-white placeholder-slate-500 outline-none transition-all duration-300
                    ${errors.email ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-primary focus:shadow-neonPrimary/20'}
                  `}
                />
              </div>
              {errors.email && <span className="text-[10px] text-red-400 font-medium">{errors.email.message}</span>}
            </div>

            {/* User Role Selection */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Default Role</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4.5 h-4.5" />
                <select
                  {...register('role')}
                  className="w-full pl-11 pr-4 py-2 rounded-xl bg-[#090b20] border border-white/10 text-sm text-white outline-none focus:border-primary focus:shadow-neonPrimary/20 appearance-none cursor-pointer"
                >
                  <option value="User">Standard Team Member (User)</option>
                  <option value="Manager">Project Manager</option>
                  <option value="Admin">System Administrator</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4.5 h-4.5" />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                  className={`
                    w-full pl-11 pr-4 py-2 rounded-xl bg-white/[0.03] border text-sm text-white placeholder-slate-500 outline-none transition-all duration-300
                    ${errors.password ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-primary focus:shadow-neonPrimary/20'}
                  `}
                />
              </div>
              {errors.password && <span className="text-[10px] text-red-400 font-medium">{errors.password.message}</span>}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4.5 h-4.5" />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('confirmPassword', { 
                    required: 'Please confirm your password',
                    validate: (val) => val === watchPassword || 'Passwords do not match'
                  })}
                  className={`
                    w-full pl-11 pr-4 py-2 rounded-xl bg-white/[0.03] border text-sm text-white placeholder-slate-500 outline-none transition-all duration-300
                    ${errors.confirmPassword ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-primary focus:shadow-neonPrimary/20'}
                  `}
                />
              </div>
              {errors.confirmPassword && <span className="text-[10px] text-red-400 font-medium">{errors.confirmPassword.message}</span>}
            </div>

            {/* Submit */}
            <Button type="submit" loading={loading} variant="primary" icon={UserCheck} className="w-full py-3 mt-4">
              Sign Up Now
            </Button>
          </form>

          {/* Login Option */}
          <p className="text-center text-xs text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-accent hover:underline">
              Log in instead
            </Link>
          </p>
        </GlassCard>
      </motion.div>
    </AuroraBackground>
  );
};

export default Register;

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/client';
import { useForm } from 'react-hook-form';
import AuroraBackground from '../components/shared/AuroraBackground';
import ParticlesBackground from '../components/shared/ParticlesBackground';
import GlassCard from '../components/shared/GlassCard';
import Button from '../components/shared/Button';
import { Lock, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    watch, 
    formState: { errors } 
  } = useForm({
    defaultValues: { password: '', confirmPassword: '' }
  });

  const watchPassword = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await API.post(`/auth/reset-password/${token}`, { password: data.password });
      if (response.data?.success) {
        toast.success('Password reset successfully!');
        navigate('/login');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Token expired or invalid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuroraBackground className="flex items-center justify-center p-6">
      <ParticlesBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <GlassCard className="border-white/10 glow-primary/10 shadow-glass">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-poppins font-extrabold text-white">Choose New Password</h2>
            <p className="text-xs text-slate-400 mt-2">Enter your new credential password below.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {/* New Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">New Password</label>
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
                    w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/[0.03] border text-sm text-white placeholder-slate-500 outline-none transition-all duration-300
                    ${errors.password ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-primary focus:shadow-neonPrimary/20'}
                  `}
                />
              </div>
              {errors.password && <span className="text-[10px] text-red-400 font-medium">{errors.password.message}</span>}
            </div>

            {/* Confirm New Password */}
            <div className="flex flex-col gap-1.5">
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
                    w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/[0.03] border text-sm text-white placeholder-slate-500 outline-none transition-all duration-300
                    ${errors.confirmPassword ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-primary focus:shadow-neonPrimary/20'}
                  `}
                />
              </div>
              {errors.confirmPassword && <span className="text-[10px] text-red-400 font-medium">{errors.confirmPassword.message}</span>}
            </div>

            <Button type="submit" loading={loading} variant="primary" icon={Check} className="w-full py-3">
              Reset Password
            </Button>
          </form>
        </GlassCard>
      </motion.div>
    </AuroraBackground>
  );
};

export default ResetPassword;

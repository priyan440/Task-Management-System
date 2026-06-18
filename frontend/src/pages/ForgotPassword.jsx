import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/client';
import { useForm } from 'react-hook-form';
import AuroraBackground from '../components/shared/AuroraBackground';
import ParticlesBackground from '../components/shared/ParticlesBackground';
import GlassCard from '../components/shared/GlassCard';
import Button from '../components/shared/Button';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await API.post('/auth/forgot-password', { email: data.email });
      if (response.data?.success) {
        setSent(true);
        toast.success('Reset link dispatched! Please inspect your mail simulator logs.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password reset request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuroraBackground className="flex items-center justify-center p-6">
      <ParticlesBackground />

      <Link to="/login" className="absolute top-6 left-6 text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2 font-semibold">
        <ArrowLeft size={16} /> Back to Login
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <GlassCard className="border-white/10 glow-primary/10 shadow-glass">
          {!sent ? (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-poppins font-extrabold text-white">Reset Password</h2>
                <p className="text-xs text-slate-400 mt-2">Enter your email address and we'll dispatch a link to change your password.</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4.5 h-4.5" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                      })}
                      className={`
                        w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/[0.03] border text-sm text-white placeholder-slate-500 outline-none transition-all duration-300
                        ${errors.email ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-primary focus:shadow-neonPrimary/20'}
                      `}
                    />
                  </div>
                  {errors.email && <span className="text-[10px] text-red-400 font-medium">{errors.email.message}</span>}
                </div>

                <Button type="submit" loading={loading} variant="primary" icon={Send} className="w-full py-3">
                  Send Recovery Link
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-6 flex flex-col gap-4 items-center">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xl">📧</div>
              <h2 className="text-xl font-poppins font-bold text-white">Check Your Inbox</h2>
              <p className="text-xs text-slate-400">
                We have dispatched password recovery instructions to you. Please read the 
                <span className="text-accent font-bold"> Terminal Mail Simulator Logs</span> to copy the reset link.
              </p>
              <Link to="/login" className="mt-4">
                <Button variant="secondary">Back to Login</Button>
              </Link>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </AuroraBackground>
  );
};

export default ForgotPassword;

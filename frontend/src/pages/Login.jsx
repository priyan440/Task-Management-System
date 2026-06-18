import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import AuroraBackground from '../components/shared/AuroraBackground';
import ParticlesBackground from '../components/shared/ParticlesBackground';
import GlassCard from '../components/shared/GlassCard';
import Button from '../components/shared/Button';
import { Mail, Lock, LogIn, Chrome, ArrowLeft, Target } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    const result = await login(data.email, data.password, data.rememberMe);
    setLoading(false);
    if (result && result.success) {
      navigate('/dashboard');
    }
  };

  const handleGoogleLoginMock = async () => {
    setLoading(true);
    try {
      // Direct mock Google login dispatcher
      const response = await fetch('http://localhost:5000/api/v1/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'google_user@auroraboard.com',
          name: 'Google User',
          googleId: '1234567890',
          imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'
        })
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        // Force session refresh trigger in Auth Context
        window.location.href = '/dashboard';
      }
    } catch (err) {
      console.error('Mock Google OAuth failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuroraBackground className="flex items-center justify-center p-6">
      <ParticlesBackground />

      {/* Floating Header back button */}
      <Link to="/" className="absolute top-6 left-6 text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2 font-semibold">
        <ArrowLeft size={16} /> Back to Landing Page
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <GlassCard className="border-white/10 glow-primary/10 shadow-glass">
          {/* Form Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center glow-primary mx-auto mb-4">
              <Target className="text-white w-6 h-6" />
            </div>
            <h2 className="text-2xl font-poppins font-extrabold text-white">Welcome Back</h2>
            <p className="text-xs text-slate-400 mt-2">Log in to enter your futuristic workspaces.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {/* Email Input */}
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
                    ${errors.email ? 'border-red-500/50 focus:border-red-500 focus:shadow-neonPrimary/10' : 'border-white/10 focus:border-primary focus:shadow-neonPrimary/20'}
                  `}
                />
              </div>
              {errors.email && <span className="text-[10px] text-red-400 font-medium">{errors.email.message}</span>}
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <Link to="/forgot-password" className="text-[10px] font-semibold text-accent hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4.5 h-4.5" />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('password', { required: 'Password is required' })}
                  className={`
                    w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/[0.03] border text-sm text-white placeholder-slate-500 outline-none transition-all duration-300
                    ${errors.password ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-primary focus:shadow-neonPrimary/20'}
                  `}
                />
              </div>
              {errors.password && <span className="text-[10px] text-red-400 font-medium">{errors.password.message}</span>}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                {...register('rememberMe')}
                className="w-4 h-4 rounded border-white/10 bg-white/[0.03] text-primary focus:ring-primary focus:ring-offset-darkBg"
              />
              <label htmlFor="rememberMe" className="text-xs font-semibold text-slate-400 cursor-pointer selection:bg-transparent select-none">
                Remember my login sessions
              </label>
            </div>

            {/* Signin Button */}
            <Button type="submit" loading={loading} variant="primary" icon={LogIn} className="w-full py-3">
              Login to Aurora
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="h-px bg-white/10 flex-grow" />
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Or continue with</span>
            <div className="h-px bg-white/10 flex-grow" />
          </div>

          {/* Google SSO Mock */}
          <Button 
            onClick={handleGoogleLoginMock} 
            disabled={loading} 
            variant="secondary" 
            icon={Chrome} 
            className="w-full py-2.5 text-xs text-slate-300 font-semibold"
          >
            Sign In with Google Account
          </Button>

          {/* Signup Suggestion */}
          <p className="text-center text-xs text-slate-400 mt-8">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-semibold text-accent hover:underline">
              Create an account
            </Link>
          </p>
        </GlassCard>
      </motion.div>
    </AuroraBackground>
  );
};

// Simple motion wrapper since framer motion is loaded
import { motion } from 'framer-motion';
export default Login;

import React, { useState, useEffect } from 'react';
import GlassCard from '../components/shared/GlassCard';
import Button from '../components/shared/Button';
import { 
  Play, Pause, RotateCcw, Clock, Volume2, 
  VolumeX, Target, Zap, CheckCircle, Smile
} from 'lucide-react';
import toast from 'react-hot-toast';

const FocusMode = () => {
  const [sessionType, setSessionType] = useState('focus'); // focus, shortBreak, longBreak
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 min default
  const [isRunning, setIsRunning] = useState(false);
  const [totalSessionsLogged, setTotalSessionsLogged] = useState(0);

  // Sound Synth States
  const [ambientSound, setAmbientSound] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [soundNode, setSoundNode] = useState(null);

  const presets = {
    focus: { name: 'Focus Session', time: 25 * 60, color: 'stroke-primary' },
    shortBreak: { name: 'Short Break', time: 5 * 60, color: 'stroke-accent' },
    longBreak: { name: 'Long Break', time: 15 * 60, color: 'stroke-secondary' }
  };

  useEffect(() => {
    // Reset timer when preset changes
    setTimeLeft(presets[sessionType].time);
    setIsRunning(false);
  }, [sessionType]);

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionCompletion();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleSessionCompletion = () => {
    setIsRunning(false);
    
    // Play visual notification
    if (sessionType === 'focus') {
      setTotalSessionsLogged(prev => prev + 1);
      toast.success('🎉 Focus Session completed! Take a brief break.', { duration: 6000 });
      setSessionType('shortBreak');
    } else {
      toast.success('☕ Break finished! Re-enter your focus workspace.', { duration: 6000 });
      setSessionType('focus');
    }

    // Play synthesized notify beep
    playBeepSound();
  };

  // Natively synthesize sound node using Web Audio APIs
  const playBeepSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, ctx.currentTime); // Frequency A
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.3); // beep for 300ms
    } catch (e) {
      console.warn('Audio Context beep blocked by browser policy');
    }
  };

  // Synthesize white noise ambient background
  const toggleAmbientNoise = () => {
    if (ambientSound) {
      // Stop Sound
      if (soundNode) {
        soundNode.stop();
        setSoundNode(null);
      }
      setAmbientSound(false);
      toast('Ambient white noise stopped', { icon: '🔇' });
    } else {
      // Start Sound
      try {
        const ctx = audioContext || new (window.AudioContext || window.webkitAudioContext)();
        if (!audioContext) setAudioContext(ctx);

        const bufferSize = 2 * ctx.sampleRate,
          noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate),
          output = noiseBuffer.getChannelData(0);
        
        // Fill white noise buffer
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.02, ctx.currentTime); // keep it soft

        whiteNoise.connect(gainNode);
        gainNode.connect(ctx.destination);

        whiteNoise.start();
        setSoundNode(whiteNoise);
        setAmbientSound(true);
        toast.success('Soft white noise synthesizer active', { icon: '🎧' });
      } catch (err) {
        toast.error('Audio synthesizer blocked by browser policy');
      }
    }
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentPreset = presets[sessionType];
  const maxTime = currentPreset.time;
  const progressRatio = (timeLeft / maxTime);

  return (
    <div className="flex-grow p-6 flex flex-col items-center justify-center gap-6 h-[92vh] overflow-hidden">
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-xl w-full flex flex-col gap-6"
      >
        
        {/* Timer presets selection */}
        <div className="grid grid-cols-3 gap-3 bg-white/[0.01] border border-white/5 p-2 rounded-2xl">
          {Object.entries(presets).map(([key, value]) => (
            <button
              key={key}
              onClick={() => {
                setSessionType(key);
              }}
              className={`
                py-2 rounded-xl text-xs font-semibold font-poppins transition-all duration-300
                ${sessionType === key 
                  ? 'bg-gradient-to-r from-primary/25 to-secondary/15 text-white border border-primary/30' 
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.03] border border-transparent'}
              `}
            >
              {value.name}
            </button>
          ))}
        </div>

        {/* Stopwatch circle card */}
        <GlassCard className="border-white/10 flex flex-col items-center justify-center p-8 gap-6 shadow-neonPrimary/10">
          
          <div className="relative w-56 h-56 flex items-center justify-center">
            {/* SVG circle countdown */}
            <svg className="timer-svg w-56 h-56">
              <circle cx="112" cy="112" r="95" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
              <circle 
                cx="112" 
                cy="112" 
                r="95" 
                stroke="url(#focusGrad)" 
                strokeWidth="6" 
                fill="transparent" 
                strokeDasharray={597}
                strokeDashoffset={597 - (597 * progressRatio)}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
              <defs>
                <linearGradient id="focusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-poppins font-extrabold text-white tracking-tight">
                {formatTime(timeLeft)}
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase mt-2">
                {currentPreset.name}
              </span>
            </div>
          </div>

          {/* Action Stopwatch Controls */}
          <div className="flex items-center gap-4 w-full justify-center">
            <button 
              onClick={() => setTimeLeft(presets[sessionType].time)}
              className="p-3 bg-white/[0.03] border border-white/10 hover:border-slate-500 rounded-2xl text-slate-400 hover:text-white transition-all active:scale-95"
              title="Reset Timer"
            >
              <RotateCcw size={16} />
            </button>

            <Button 
              onClick={() => setIsRunning(!isRunning)} 
              variant="primary" 
              className="py-3 px-10 text-xs font-extrabold"
              icon={isRunning ? Pause : Play}
            >
              {isRunning ? 'Pause Focus' : 'Start Focus'}
            </Button>

            <button 
              onClick={toggleAmbientNoise}
              className={`p-3 border rounded-2xl transition-all active:scale-95 ${ambientSound ? 'bg-primary/20 border-primary text-primary' : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white'}`}
              title="Ambient Sounds"
            >
              {ambientSound ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </GlassCard>

        {/* Focus dashboard statistics summary */}
        <div className="grid grid-cols-2 gap-4">
          <GlassCard className="p-4 border-white/5 border-l-4 border-l-primary flex items-center justify-between">
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Focus Count</span>
              <span className="text-xl font-poppins font-extrabold text-white mt-1">{totalSessionsLogged} sessions</span>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg text-primary"><CheckCircle size={16} /></div>
          </GlassCard>

          <GlassCard className="p-4 border-white/5 border-l-4 border-l-accent flex items-center justify-between">
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Active Streak</span>
              <span className="text-xl font-poppins font-extrabold text-white mt-1">1 Day</span>
            </div>
            <div className="p-2 bg-accent/10 rounded-lg text-accent"><Zap size={16} /></div>
          </GlassCard>
        </div>

      </motion.div>
    </div>
  );
};

export default FocusMode;

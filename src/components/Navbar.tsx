import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, Volume2, VolumeX, Sparkles, KeyRound, Lock, History } from 'lucide-react';
import { sound } from '../lib/sound';

interface NavbarProps {
  activeTab: 'create' | 'extract' | 'vault';
  setActiveTab: (tab: 'create' | 'extract' | 'vault') => void;
  serverTime: number | null;
  onQuickExtractClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  serverTime,
  onQuickExtractClick,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [displayTime, setDisplayTime] = useState<string>('');

  // Update clock every second
  useEffect(() => {
    const updateClock = () => {
      const now = serverTime ? new Date(serverTime + (performance.now() % 1000)) : new Date();
      setDisplayTime(
        now.toLocaleTimeString('zh-CN', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, [serverTime]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
    if (next) sound.playClick();
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-rose-100 shadow-xs transition-all">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div 
          onClick={() => { sound.playClick(); setActiveTab('create'); }}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 p-0.5 shadow-md shadow-rose-200 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <Lock className="w-5 h-5 text-rose-500 group-hover:rotate-12 transition-transform" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-ping opacity-75" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-lg bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 bg-clip-text text-transparent">
                时间密信
              </h1>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200/60">
                伪装加密
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              悄悄话定时解锁 · 伪装文本隐写
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2">
          <nav className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            <button
              id="nav-btn-create"
              onClick={() => { sound.playClick(); setActiveTab('create'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'create'
                  ? 'bg-white text-rose-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>打包密信</span>
            </button>

            <button
              id="nav-btn-extract"
              onClick={() => { sound.playClick(); onQuickExtractClick(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'extract'
                  ? 'bg-white text-rose-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              <span>零宽提取</span>
            </button>

            <button
              id="nav-btn-vault"
              onClick={() => { sound.playClick(); setActiveTab('vault'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'vault'
                  ? 'bg-white text-rose-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5 text-pink-500" />
              <span className="hidden sm:inline">我的暗号</span>
              <span className="sm:hidden">记录</span>
            </button>
          </nav>

          {/* Clock & Sound Control */}
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200 text-xs text-slate-500">
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 border border-slate-200/50 font-mono text-[11px]">
              <Clock className="w-3.5 h-3.5 text-rose-500 animate-spin-slow" />
              <span>{displayTime || '00:00:00'}</span>
            </div>
          </div>

          <button
            id="btn-toggle-sound"
            onClick={toggleSound}
            title={soundEnabled ? '声音已开启' : '声音已静音'}
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-rose-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>
    </header>
  );
};

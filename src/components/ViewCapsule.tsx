import React, { useEffect, useState, useRef } from 'react';
import {
  Clock,
  Lock,
  Unlock,
  KeyRound,
  Flame,
  AlertOctagon,
  Sparkles,
  Play,
  Square,
  Share2,
  Copy,
  Check,
  RotateCcw,
  User,
  HeartHandshake,
  Calendar,
  Volume2,
} from 'lucide-react';
import { CapsulePayload } from '../types';
import { sound } from '../lib/sound';

interface ViewCapsuleProps {
  capsuleCode: string;
  onBackToCreate: () => void;
  onOpenPosterCard: (data: { code: string; text: string; unlockTime: number; creator?: string }) => void;
}

export const ViewCapsule: React.FC<ViewCapsuleProps> = ({
  capsuleCode,
  onBackToCreate,
  onOpenPosterCard,
}) => {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Status flags from backend
  const [isUnlockable, setIsUnlockable] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [isDestroyed, setIsDestroyed] = useState(false);
  const [requirePassword, setRequirePassword] = useState(false);
  const [passwordHint, setPasswordHint] = useState('');
  const [isBurnAfterReading, setIsBurnAfterReading] = useState(false);

  // Payload data when unlocked
  const [payload, setPayload] = useState<CapsulePayload | null>(null);

  // General capsule meta
  const [unlockTime, setUnlockTime] = useState<number>(0);
  const [expireTime, setExpireTime] = useState<number | undefined>(undefined);
  const [creatorName, setCreatorName] = useState<string>('神秘人');
  const [camouflageText, setCamouflageText] = useState<string>('');

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Password Unlocking
  const [inputPassword, setInputPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [unsealing, setUnsealing] = useState(false);
  const [unsealAnimation, setUnsealAnimation] = useState(false);

  // Audio Playback in secret payload
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch Capsule Info from Backend
  const fetchCapsuleStatus = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/capsules/${capsuleCode}`);
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || '未找到该时间密信，可能暗号有误');
        setLoading(false);
        return;
      }

      setCamouflageText(data.camouflageText || '');
      setCreatorName(data.creatorName || '神秘人');
      setUnlockTime(data.unlockTime || 0);
      setExpireTime(data.expireTime);
      setIsBurnAfterReading(Boolean(data.isBurnAfterReading));

      if (data.isDestroyed) {
        setIsDestroyed(true);
      } else if (data.isExpired) {
        setIsExpired(true);
      } else if (data.isUnlockable) {
        setIsUnlockable(true);
        if (data.requirePassword) {
          setRequirePassword(true);
          setPasswordHint(data.passwordHint || '');
        } else if (data.isUnlocked && data.payload) {
          setIsUnlocked(true);
          setPayload(data.payload);
        }
      } else {
        // Locked state
        setIsUnlockable(false);
      }
    } catch {
      setErrorMsg('访问服务器失败，请检查网络设置。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCapsuleStatus();
  }, [capsuleCode]);

  // Countdown loop
  useEffect(() => {
    if (!unlockTime || isUnlockable || isExpired || isDestroyed) return;

    const updateCountdown = () => {
      const now = Date.now();
      const diff = unlockTime - now;

      if (diff <= 0) {
        setIsUnlockable(true);
        fetchCapsuleStatus(); // Re-verify with backend
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [unlockTime, isUnlockable, isExpired, isDestroyed]);

  // Handle Unlocking with Password
  const handleUnlockSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sound.playClick();
    setUnlockError('');
    setUnsealing(true);

    try {
      const res = await fetch(`/api/capsules/${capsuleCode}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: inputPassword }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        sound.playUnseal();
        setUnsealAnimation(true);

        setTimeout(() => {
          setIsUnlocked(true);
          setPayload(data.payload);
          setUnsealAnimation(false);
          setUnsealing(false);
        }, 800);
      } else {
        sound.playLockTick();
        setUnlockError(data.error || '开封失败，请检查口令密码');
        setUnsealing(false);
      }
    } catch {
      setUnlockError('通信故障，请稍后重试');
      setUnsealing(false);
    }
  };

  // Direct Unlock (no password required)
  const handleDirectUnlock = () => {
    sound.playClick();
    handleUnlockSubmit();
  };

  const toggleAudio = () => {
    sound.playClick();
    if (!audioPlayerRef.current) return;
    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const handleCopyLink = async () => {
    sound.playClick();
    try {
      await navigator.clipboard.writeText(camouflageText || window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl shadow-lg border border-rose-100 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center">
          <Clock className="w-6 h-6 text-rose-500 animate-spin" />
        </div>
        <p className="text-xs text-slate-600 font-medium">正在对准精准时间时钟核验暗号...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl shadow-lg border border-rose-100 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
          <AlertOctagon className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-800 text-base">未知的时间暗号</h3>
        <p className="text-xs text-slate-500">{errorMsg}</p>
        <button
          onClick={onBackToCreate}
          className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-medium text-xs rounded-xl transition-all shadow-xs"
        >
          返回打包我的密信
        </button>
      </div>
    );
  }

  // STATE 1: DESTROYED OR EXPIRED
  if (isDestroyed || isExpired) {
    return (
      <div className="max-w-md mx-auto my-8 p-6 sm:p-8 bg-slate-900 text-slate-100 rounded-3xl shadow-2xl border border-slate-800 text-center space-y-5 animate-fade-in relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rose-950/30 via-slate-900 to-slate-950 pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-950/80 border border-rose-800/60 text-rose-400 flex items-center justify-center shadow-inner">
            <Flame className="w-8 h-8 animate-pulse" />
          </div>

          <div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800/80">
              暗号: {capsuleCode}
            </span>
            <h3 className="text-xl font-bold text-white mt-2">
              {isDestroyed ? '该密信已阅后即焚销毁' : '该密信已超过有效期作废'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              根据寄件人设置的安全规则，此时间悄悄话已完成使命并按时在云端封锁销毁，无法再次调取解密。
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onBackToCreate}
              className="w-full py-3 px-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              我也要打包发送时间密信
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STATE 2: LOCKED (Countdown in Progress)
  if (!isUnlockable && !isUnlocked) {
    const formattedUnlockDate = new Date(unlockTime).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    return (
      <div className="max-w-xl mx-auto my-6 p-6 sm:p-8 bg-white rounded-3xl shadow-xl border border-rose-100 space-y-6 relative overflow-hidden">
        {/* Glow Header */}
        <div className="text-center space-y-3">
          {/* Animated Hourglass / Time Orb */}
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 opacity-20 animate-ping" />
            <div className="relative w-full h-full rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 p-0.5 shadow-lg shadow-rose-200">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-rose-500">
                <Lock className="w-9 h-9" />
              </div>
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-semibold border border-rose-200/80 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>时间锁存中 · 尚未到达开启时刻</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">
              收到来自「{creatorName}」的时间密信
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              暗号: <span className="font-mono font-bold text-rose-600">{capsuleCode}</span>
            </p>
          </div>
        </div>

        {/* Live Countdown Box */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950 text-white rounded-2xl p-5 shadow-inner text-center space-y-3">
          <p className="text-xs text-rose-200/80 font-medium flex items-center justify-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            <span>距离开封倒计时</span>
          </p>

          <div className="grid grid-cols-4 gap-2 font-mono">
            {[
              { val: timeLeft.days, label: '天' },
              { val: timeLeft.hours, label: '时' },
              { val: timeLeft.minutes, label: '分' },
              { val: timeLeft.seconds, label: '秒' },
            ].map((item, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
                <div className="text-xl sm:text-2xl font-extrabold text-white">
                  {String(item.val).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-slate-300">{item.label}</div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-300 border-t border-white/10 pt-2 font-mono">
            预计开封时间: {formattedUnlockDate}
          </p>
        </div>

        {/* Camouflage Shell Preview */}
        {camouflageText && (
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
              伪装外壳文案:
            </span>
            <p className="text-xs text-slate-700 italic leading-relaxed bg-white p-3 rounded-xl border border-slate-200/60">
              “{camouflageText.replace(/[\u200B-\u200D\uFEFF]/g, '')}”
            </p>
          </div>
        )}

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-all"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            <span>{copiedLink ? '文案暗号已复制' : '复制伪装文字暗号'}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenPosterCard({
                code: capsuleCode,
                text: camouflageText,
                unlockTime,
                creator: creatorName,
              });
            }}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 font-medium text-xs rounded-xl transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>生成分享卡片</span>
          </button>
        </div>
      </div>
    );
  }

  // STATE 3: UNLOCKABLE (Requires Password or Direct Click Unseal)
  if (isUnlockable && !isUnlocked) {
    return (
      <div className="max-w-md mx-auto my-6 p-6 sm:p-8 bg-white rounded-3xl shadow-xl border border-rose-100 space-y-6 relative overflow-hidden text-center animate-fade-in">
        {unsealAnimation && (
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-400 via-rose-500 to-pink-500 opacity-90 z-20 flex items-center justify-center text-white animate-pulse">
            <div className="text-center space-y-2">
              <Sparkles className="w-12 h-12 mx-auto animate-spin" />
              <p className="font-extrabold text-lg">金印已破！时间悄悄话开封中...</p>
            </div>
          </div>
        )}

        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 p-1 shadow-lg shadow-amber-200 animate-bounce">
          <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-amber-500">
            <Unlock className="w-10 h-10" />
          </div>
        </div>

        <div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            解密时刻已到！可以开启
          </span>
          <h2 className="text-xl font-extrabold text-slate-800 mt-2">
            打破封印，查阅「{creatorName}」的悄悄话
          </h2>
          <p className="text-xs text-slate-500 mt-1">暗号: {capsuleCode}</p>
        </div>

        {requirePassword ? (
          <form onSubmit={handleUnlockSubmit} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs text-purple-700 font-semibold mb-1">
              <KeyRound className="w-4 h-4" />
              <span>寄件人设置了解密口令锁</span>
            </div>

            {passwordHint && (
              <p className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-purple-100">
                💡 口令提示：{passwordHint}
              </p>
            )}

            <input
              type="password"
              value={inputPassword}
              onChange={(e) => setInputPassword(e.target.value)}
              placeholder="请输入解密口令/密码"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-rose-400 font-mono"
            />

            {unlockError && <p className="text-xs text-rose-500 font-medium">{unlockError}</p>}

            <button
              id="btn-unlock-submit-pass"
              type="submit"
              disabled={unsealing}
              className="w-full py-3 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-200 transition-all cursor-pointer"
            >
              验证口令并解封开封
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <button
              id="btn-direct-unseal"
              onClick={handleDirectUnlock}
              disabled={unsealing}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-rose-200 transition-all cursor-pointer transform hover:scale-105"
            >
              ✨ 点击开封揭晓秘密悄悄话
            </button>
          </div>
        )}
      </div>
    );
  }

  // STATE 4: UNLOCKED & DISPLAYING SECRET
  if (isUnlocked && payload) {
    const formattedCreatedDate = new Date(payload.createdAt).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <div className="max-w-2xl mx-auto my-6 p-6 sm:p-8 bg-white rounded-3xl shadow-xl border border-rose-100 space-y-6 relative overflow-hidden animate-fade-in">
        {/* Top Decorative Banner */}
        <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 p-6 rounded-2xl text-white shadow-md shadow-rose-200 relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/20 text-white">
                解密成功 · {capsuleCode}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold mt-1">
                {payload.title || '一份时间的秘密'}
              </h2>
              <p className="text-xs text-rose-100 mt-0.5">
                寄件人: {payload.creatorName || creatorName} · 封存时间: {formattedCreatedDate}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
              <Unlock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Burn Warning Banner if Burn After Reading */}
        {isBurnAfterReading && (
          <div className="p-3 bg-orange-50 border border-orange-200 text-orange-800 rounded-xl text-xs flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-600 shrink-0" />
            <span>🔥 提示：此悄悄话开启了「阅后即焚」属性，退出当前页面后将永久摧毁作废。</span>
          </div>
        )}

        {/* Secret Message Content */}
        <div className="bg-rose-50/40 p-5 rounded-2xl border border-rose-100/80 space-y-4">
          <div className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-medium">
            {payload.message}
          </div>

          {/* Attached Secret Photo */}
          {payload.imageUrl && (
            <div className="pt-2">
              <p className="text-xs font-semibold text-slate-600 mb-1.5">私密图片附件:</p>
              <img
                src={payload.imageUrl}
                alt="悄悄话私密图片"
                className="max-h-80 w-auto rounded-xl shadow-md border border-slate-200 object-cover"
              />
            </div>
          )}

          {/* Attached Audio Whisper Player */}
          {payload.audioUrl && (
            <div className="pt-2 bg-white p-3.5 rounded-xl border border-rose-200/80 flex items-center justify-between">
              <audio
                ref={audioPlayerRef}
                src={payload.audioUrl}
                onEnded={() => setIsPlayingAudio(false)}
                className="hidden"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleAudio}
                  className="p-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-xs transition-colors cursor-pointer"
                >
                  {isPlayingAudio ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                </button>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">语音悄悄话</span>
                  <span className="text-[10px] text-slate-500">点击播放声音存留</span>
                </div>
              </div>
              <Volume2 className="w-5 h-5 text-amber-500 animate-pulse" />
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="pt-2 flex justify-between items-center border-t border-slate-100">
          <button
            onClick={onBackToCreate}
            className="flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>我也要打包一封时间密信</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};

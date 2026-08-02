import React, { useState } from 'react';
import { Check, Copy, Share2, Sparkles, X, Lock, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { sound } from '../lib/sound';

interface CapsuleCreatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  capsuleCode: string;
  camouflageText: string;
  unlockTime: number;
  expireTime?: number;
  hasPassword?: boolean;
  isBurnAfterReading?: boolean;
  creatorName?: string;
  onOpenPosterCard: () => void;
  onViewCapsule: (code: string) => void;
}

export const CapsuleCreatedModal: React.FC<CapsuleCreatedModalProps> = ({
  isOpen,
  onClose,
  capsuleCode,
  camouflageText,
  unlockTime,
  expireTime,
  hasPassword,
  isBurnAfterReading,
  creatorName,
  onOpenPosterCard,
  onViewCapsule,
}) => {
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const directLink = `${window.location.origin}/?code=${capsuleCode}`;

  const handleCopyCamouflage = async () => {
    sound.playClick();
    try {
      await navigator.clipboard.writeText(camouflageText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleCopyLink = async () => {
    sound.playClick();
    try {
      await navigator.clipboard.writeText(directLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  const formattedUnlockTime = new Date(unlockTime).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-100 relative overflow-hidden">
        {/* Top Glow Background */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-rose-500 via-pink-500 to-amber-400 opacity-15 pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => { sound.playClick(); onClose(); }}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-white/80 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="relative text-center pt-2 pb-4">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 text-white shadow-lg shadow-rose-200 mb-3 animate-bounce">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-800">时间密信打包成功！</h3>
          <p className="text-xs text-slate-500 mt-1">
            已隐写包装在伪装文案中，只有在开启时间到达后才能解开
          </p>
        </div>

        {/* Info Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4 text-[11px]">
          <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200/60 font-semibold">
            暗号: {capsuleCode}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
            开启时间: {formattedUnlockTime}
          </span>
          {hasPassword && (
            <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 border border-purple-200/60">
              口令保护
            </span>
          )}
          {isBurnAfterReading && (
            <span className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200/60">
              阅后即焚
            </span>
          )}
        </div>

        {/* Camouflage Preview Box */}
        <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 mb-4 relative">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              生成的伪装文案 (已嵌入隐形零宽码):
            </span>
            <span className="text-[10px] text-emerald-600 font-normal bg-emerald-50 px-1.5 py-0.5 rounded-sm">
              隐写成功
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/60 shadow-2xs">
            {camouflageText}
          </p>

          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            💡 提示：复制以上文案发送给对方，对方粘贴或点击即可自动识别暗号。
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            id="btn-copy-camouflage-main"
            onClick={handleCopyCamouflage}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-200 transition-all cursor-pointer"
          >
            {copiedText ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>伪装文案已复制！快去小红书/微信粘贴分享吧</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>复制全段伪装文案 (包含隐藏悄悄话)</span>
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              id="btn-generate-poster-card"
              onClick={() => { sound.playClick(); onOpenPosterCard(); }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium text-xs rounded-xl border border-amber-200/80 transition-all cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-amber-600" />
              <span>美化分享卡片</span>
            </button>

            <button
              id="btn-copy-direct-link"
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-slate-500" />}
              <span>{copiedLink ? '链接已复制' : '复制直达链接'}</span>
            </button>
          </div>

          <button
            id="btn-view-created-capsule"
            onClick={() => { sound.playClick(); onViewCapsule(capsuleCode); onClose(); }}
            className="w-full text-center py-2 text-xs text-rose-600 hover:text-rose-700 font-medium transition-colors flex items-center justify-center gap-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>进入密信预览/倒计时页面</span>
          </button>
        </div>
      </div>
    </div>
  );
};

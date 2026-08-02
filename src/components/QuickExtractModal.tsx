import React, { useState } from 'react';
import { KeyRound, Sparkles, X, Check, Search, ArrowRight, Eye, ShieldAlert } from 'lucide-react';
import { detectHiddenCapsule, getCleanCamouflageText } from '../lib/steganography';
import { sound } from '../lib/sound';

interface QuickExtractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCapsule: (codeOrId: string) => void;
}

export const QuickExtractModal: React.FC<QuickExtractModalProps> = ({
  isOpen,
  onClose,
  onOpenCapsule,
}) => {
  const [inputText, setInputText] = useState('');
  const [extractResult, setExtractResult] = useState<{
    detected: boolean;
    code?: string;
    cleanText?: string;
    rawPayload?: unknown;
  } | null>(null);

  if (!isOpen) return null;

  const handleInspect = (textToInspect: string) => {
    sound.playClick();
    setInputText(textToInspect);

    if (!textToInspect.trim()) {
      setExtractResult(null);
      return;
    }

    const res = detectHiddenCapsule(textToInspect);
    if (res.detected) {
      sound.playUnseal();
      setExtractResult({
        detected: true,
        code: res.capsuleId,
        cleanText: res.camouflageCleanText || getCleanCamouflageText(textToInspect),
        rawPayload: res.rawPayload,
      });
    } else {
      sound.playLockTick();
      setExtractResult({
        detected: false,
        cleanText: getCleanCamouflageText(textToInspect),
      });
    }
  };

  const handlePasteClipboard = async () => {
    sound.playClick();
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleInspect(text);
      }
    } catch {
      // Ignore if permission denied
    }
  };

  const handleJumpToCapsule = () => {
    if (extractResult?.code) {
      sound.playClick();
      onOpenCapsule(extractResult.code);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-rose-100 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-amber-400 to-rose-500 rounded-xl text-white shadow-md shadow-amber-200">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">零宽隐形暗号解析器</h3>
              <p className="text-xs text-slate-500">粘贴包含假象文字的落日/美图文案，一键检测提取隐秘解密条件</p>
            </div>
          </div>
          <button
            onClick={() => { sound.playClick(); onClose(); }}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Box */}
        <div className="mt-4 space-y-3">
          <div className="relative">
            <textarea
              id="input-extract-text"
              value={inputText}
              onChange={(e) => handleInspect(e.target.value)}
              rows={4}
              placeholder="请粘贴从小红书、微信、QQ或社交平台复制的伪装文字或密信暗号（如 T-8821）..."
              className="w-full text-xs p-3.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all resize-none leading-relaxed"
            />
            <button
              type="button"
              onClick={handlePasteClipboard}
              className="absolute right-2.5 bottom-2.5 px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-medium rounded-lg border border-rose-200/80 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>一键粘贴</span>
            </button>
          </div>

          {/* Detection Result Card */}
          {extractResult && (
            <div className="animate-fade-in">
              {extractResult.detected ? (
                <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200 relative overflow-hidden">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs mb-2">
                    <Check className="w-4 h-4 text-emerald-600 bg-emerald-100 rounded-full p-0.5" />
                    <span>成功捕获隐形零宽时间密信！</span>
                  </div>

                  <div className="bg-white/90 p-3 rounded-xl border border-emerald-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">检测暗号ID:</span>
                      <span className="font-mono font-bold text-rose-600 text-sm">{extractResult.code}</span>
                    </div>
                    {extractResult.cleanText && (
                      <div>
                        <span className="text-slate-500 block mb-0.5">伪装外壳文案:</span>
                        <p className="text-slate-700 italic bg-slate-50 p-2 rounded-lg text-[11px] line-clamp-2">
                          “{extractResult.cleanText}”
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    id="btn-jump-to-capsule"
                    type="button"
                    onClick={handleJumpToCapsule}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium text-xs rounded-xl shadow-md shadow-emerald-200 transition-all cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>查看该密信开启倒计时 / 解封</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="bg-amber-50/70 rounded-2xl p-3.5 border border-amber-200 text-amber-800 flex items-start gap-2.5 text-xs">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">未检测到隐形暗号</span>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      该文字中未嵌入零宽字符或有效的暗号格式。如果对方给的是短暗号（如 T-123456），请输入纯暗号代码尝试。
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {!extractResult && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-center text-slate-500 text-xs">
              <Search className="w-4 h-4 mx-auto mb-1 text-slate-400" />
              <span>只需粘贴包含暗号的整段文案，无需手动寻找暗号</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

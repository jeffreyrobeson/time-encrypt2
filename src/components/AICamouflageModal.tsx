import React, { useState } from 'react';
import { Sparkles, Wand2, X, RefreshCw, Check, MessageSquareCode } from 'lucide-react';
import { sound } from '../lib/sound';

interface AICamouflageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectText: (text: string) => void;
}

export const AICamouflageModal: React.FC<AICamouflageModalProps> = ({
  isOpen,
  onClose,
  onSelectText,
}) => {
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('小红书爆款日常风');
  const [loading, setLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const styleOptions = [
    '小红书爆款日常风',
    '绝美落日/风景记录',
    '咖啡探店日常',
    '励志自律打卡',
    '文艺浪漫情诗',
    '职场办公严谨通知',
    '萌宠爆笑整活',
    '吃瓜爆料预警',
  ];

  const handleGenerate = async () => {
    sound.playClick();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/ai/camouflage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, style }),
      });

      const data = await res.json();
      if (data.success && data.camouflageText) {
        setGeneratedText(data.camouflageText);
      } else {
        setErrorMsg(data.error || '生成失败，请稍后重试');
      }
    } catch {
      setErrorMsg('网络请求失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (generatedText) {
      sound.playClick();
      onSelectText(generatedText);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-rose-100 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-amber-400 to-rose-500 rounded-xl text-white shadow-md shadow-rose-200">
              <Sparkles className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">AI 灵感伪装生成器</h3>
              <p className="text-xs text-slate-500">用 Gemini 智能定制符合你风格的假象文案</p>
            </div>
          </div>
          <button
            onClick={() => { sound.playClick(); onClose(); }}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              预设文案风格
            </label>
            <div className="flex flex-wrap gap-1.5">
              {styleOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { sound.playClick(); setStyle(opt); }}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                    style === opt
                      ? 'bg-rose-500 text-white font-medium shadow-xs shadow-rose-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              主题关键词或自定义提示 (可选)
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="如：清晨第一杯美式、晚霞、今天工作做完了、古风诗词..."
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
            />
          </div>

          <button
            id="btn-ai-generate"
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-medium text-xs rounded-xl shadow-md shadow-rose-200 disabled:opacity-60 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>AI 正在酝酿创意文案中...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>生成独家伪装文案</span>
              </>
            )}
          </button>

          {errorMsg && (
            <p className="text-xs text-rose-500 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
              {errorMsg}
            </p>
          )}

          {/* Generated Result Preview */}
          {generatedText && (
            <div className="bg-amber-50/60 rounded-xl p-3.5 border border-amber-200/60 relative animate-fade-in">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 mb-2">
                <MessageSquareCode className="w-4 h-4 text-amber-600" />
                <span>AI 生成预览:</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed bg-white/80 p-3 rounded-lg border border-amber-100/80">
                {generatedText}
              </p>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-white rounded-lg transition-colors border border-slate-200"
                >
                  换一段
                </button>
                <button
                  id="btn-apply-ai-camouflage"
                  type="button"
                  onClick={handleApply}
                  className="flex items-center gap-1 px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-medium text-xs rounded-lg shadow-xs shadow-rose-200 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>采纳这段文案</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

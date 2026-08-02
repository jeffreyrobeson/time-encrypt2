import React, { useRef, useEffect, useState } from 'react';
import { X, Download, Copy, Image as ImageIcon, Sparkles, Check } from 'lucide-react';
import { sound } from '../lib/sound';

interface PosterCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  camouflageText: string;
  capsuleCode: string;
  unlockTime: number;
  creatorName?: string;
}

export const PosterCardModal: React.FC<PosterCardModalProps> = ({
  isOpen,
  onClose,
  camouflageText,
  capsuleCode,
  unlockTime,
  creatorName = '匿名守护者',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high quality canvas dimensions (Xiaohongshu 3:4 aspect ratio e.g. 600x800)
    const width = 600;
    const height = 800;
    canvas.width = width;
    canvas.height = height;

    // Background Gradient (Warm Rose Amber Xiaohongshu aesthetic)
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#fff1f2'); // rose-50
    bgGrad.addColorStop(0.5, '#fef3c7'); // amber-100
    bgGrad.addColorStop(1, '#ffe4e6'); // rose-100
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Decorative top background blob
    ctx.save();
    ctx.beginPath();
    ctx.arc(100, 80, 200, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(244, 63, 94, 0.08)'; // rose-500 alpha
    ctx.fill();

    ctx.beginPath();
    ctx.arc(520, 720, 220, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.08)'; // amber-500 alpha
    ctx.fill();
    ctx.restore();

    // Outer Main Card Box
    const cardMargin = 32;
    const cardW = width - cardMargin * 2;
    const cardH = height - cardMargin * 2;
    const rx = 24;

    ctx.save();
    ctx.shadowColor = 'rgba(225, 29, 72, 0.12)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 12;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(cardMargin, cardMargin, cardW, cardH, rx);
    ctx.fill();
    ctx.restore();

    // Inner Card Border
    ctx.strokeStyle = '#ffe4e6';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Header Badge: 时间密信 · 限时归属
    ctx.fillStyle = '#fff1f2';
    ctx.beginPath();
    ctx.roundRect(cardMargin + 24, cardMargin + 24, 160, 36, 18);
    ctx.fill();

    ctx.fillStyle = '#e11d48';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('⏳ 时间密信 · 暗号', cardMargin + 38, cardMargin + 47);

    // Sender Tag
    ctx.fillStyle = '#64748b';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`寄件人: ${creatorName}`, width - cardMargin - 28, cardMargin + 47);
    ctx.textAlign = 'left';

    // Quote icon
    ctx.fillStyle = '#fda4af';
    ctx.font = 'bold 48px Georgia, serif';
    ctx.fillText('“', cardMargin + 28, cardMargin + 115);

    // Camouflage Text Wrap
    ctx.fillStyle = '#1e293b';
    ctx.font = '18px -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';

    const maxTextW = cardW - 64;
    const lineHeight = 30;
    const startX = cardMargin + 32;
    let startY = cardMargin + 150;

    // Word wrapper for Chinese text
    function wrapText(text: string, maxW: number) {
      const lines: string[] = [];
      let currentLine = '';

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const testLine = currentLine + char;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxW && i > 0) {
          lines.push(currentLine);
          currentLine = char;
        } else {
          currentLine = testLine;
        }
      }
      lines.push(currentLine);
      return lines;
    }

    const cleanText = camouflageText.replace(/[\u200B-\u200D\uFEFF]/g, '');
    const textLines = wrapText(cleanText, maxTextW);

    // Render max 7 lines
    const displayLines = textLines.slice(0, 7);
    displayLines.forEach((line) => {
      ctx.fillText(line, startX, startY);
      startY += lineHeight;
    });

    if (textLines.length > 7) {
      ctx.fillText('...', startX, startY);
      startY += lineHeight;
    }

    // Closing Quote
    ctx.fillStyle = '#fda4af';
    ctx.font = 'bold 48px Georgia, serif';
    ctx.fillText('”', width - cardMargin - 52, startY + 10);

    // Code & Unlock Info Box
    const infoY = height - cardMargin - 210;

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(cardMargin + 24, infoY, cardW - 48, 120, 16);
    ctx.fill();
    ctx.strokeStyle = '#f1f5f9';
    ctx.stroke();

    // Code Badge
    ctx.fillStyle = '#e11d48';
    ctx.font = 'bold 22px monospace, sans-serif';
    ctx.fillText(`暗号: ${capsuleCode}`, cardMargin + 44, infoY + 42);

    // Unlock Time
    const dateStr = new Date(unlockTime).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    ctx.fillStyle = '#475569';
    ctx.font = '14px -apple-system, sans-serif';
    ctx.fillText(`解密开封时间: ${dateStr}`, cardMargin + 44, infoY + 76);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillText('复制本段话或带有隐形零宽码的文字即可自动读取', cardMargin + 44, infoY + 100);

    // Bottom App Branding & Simulated QR stamp
    const footerY = height - cardMargin - 60;

    // Logo Circle
    ctx.beginPath();
    ctx.arc(cardMargin + 48, footerY + 20, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#f43f5e';
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('密', cardMargin + 40, footerY + 26);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px -apple-system, sans-serif';
    ctx.fillText('时间密信', cardMargin + 76, footerY + 20);

    ctx.fillStyle = '#64748b';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillText('有趣的悄悄话加密分享小工具', cardMargin + 76, footerY + 38);

    // Simulated stamp / barcode box
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(width - cardMargin - 80, footerY, 50, 50);

    ctx.fillStyle = '#0f172a';
    ctx.font = '9px monospace';
    ctx.fillText('TIME', width - cardMargin - 72, footerY + 20);
    ctx.fillText('SECRET', width - cardMargin - 75, footerY + 36);

    // Generate Data URL for image export
    const url = canvas.toDataURL('image/png');
    setDataUrl(url);
  }, [isOpen, camouflageText, capsuleCode, unlockTime, creatorName]);

  if (!isOpen) return null;

  const handleDownload = () => {
    sound.playClick();
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `时间密信_${capsuleCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = async () => {
    sound.playClick();
    try {
      await navigator.clipboard.writeText(camouflageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-rose-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-slate-800 text-sm">分享卡片预览</h3>
          </div>
          <button
            onClick={() => { sound.playClick(); onClose(); }}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas & Preview */}
        <div className="my-4 flex-1 flex items-center justify-center overflow-auto bg-slate-50 p-2 rounded-xl border border-slate-200/60">
          <canvas ref={canvasRef} className="hidden" />
          {dataUrl ? (
            <img
              src={dataUrl}
              alt="时间密信分享卡片"
              className="max-h-[55vh] w-auto rounded-xl shadow-md border border-slate-200"
            />
          ) : (
            <div className="py-12 text-xs text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-rose-400" />
              <span>卡片绘制中...</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <button
            id="btn-copy-poster-text"
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            <span>{copied ? '隐形暗号已复制' : '复制伪装文字'}</span>
          </button>

          <button
            id="btn-download-poster"
            onClick={handleDownload}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-medium text-xs rounded-xl shadow-md shadow-rose-200 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>保存卡片图片</span>
          </button>
        </div>
      </div>
    </div>
  );
};

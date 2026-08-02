import React, { useEffect, useState } from 'react';
import { History, Clock, Lock, KeyRound, Sparkles, ArrowRight, Trash2, Search, ExternalLink } from 'lucide-react';
import { sound } from '../lib/sound';

interface HistoryItem {
  code: string;
  camouflageText: string;
  unlockTime: number;
  expireTime?: number;
  createdAt: number;
  creatorName?: string;
  hasPassword?: boolean;
}

interface VaultHistoryProps {
  onOpenCapsule: (code: string) => void;
}

export const VaultHistory: React.FC<VaultHistoryProps> = ({ onOpenCapsule }) => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [searchCode, setSearchCode] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('time_secret_vault');
    if (saved) {
      try {
        setHistoryItems(JSON.parse(saved));
      } catch {
        // Ignore
      }
    }
  }, []);

  const handleClearHistory = () => {
    sound.playClick();
    if (confirm('确定清除本地暗号历史记录吗？')) {
      localStorage.removeItem('time_secret_vault');
      setHistoryItems([]);
    }
  };

  const handleSearchJump = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCode.trim()) {
      sound.playClick();
      onOpenCapsule(searchCode.trim().toUpperCase());
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white shadow-md shadow-pink-200">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">我的时间暗号库</h2>
            <p className="text-xs text-slate-500">快速查找、追踪与复查你创建或解密过的暗号</p>
          </div>
        </div>

        {historyItems.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-600 transition-colors p-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>清空记录</span>
          </button>
        )}
      </div>

      {/* Code Direct Lookup Box */}
      <form onSubmit={handleSearchJump} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            placeholder="输入暗号或代码 (如：T-8821)"
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-rose-400 font-mono"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>查找解密</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* History Items List */}
      <div className="space-y-3">
        {historyItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <KeyRound className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-500">暂无本地记录，打包一个时间密信后会自动在此显示哦</p>
          </div>
        ) : (
          historyItems.map((item) => {
            const isUnlockedNow = Date.now() >= item.unlockTime;
            const unlockStr = new Date(item.unlockTime).toLocaleString('zh-CN', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={item.code}
                onClick={() => {
                  sound.playClick();
                  onOpenCapsule(item.code);
                }}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-rose-300 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-rose-600 text-sm">{item.code}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isUnlockedNow
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-amber-50 text-amber-600 border border-amber-200'
                      }`}
                    >
                      {isUnlockedNow ? '已过解密时间 · 可开封' : `解密时刻: ${unlockStr}`}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-1 italic">
                    “{item.camouflageText.replace(/[\u200B-\u200D\uFEFF]/g, '')}”
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-rose-500 group-hover:translate-x-1 transition-transform">
                  <span>查看状态</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

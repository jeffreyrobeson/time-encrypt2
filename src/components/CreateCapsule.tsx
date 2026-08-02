import React, { useState, useRef } from 'react';
import {
  Lock,
  Clock,
  Sparkles,
  Wand2,
  Mic,
  Square,
  Play,
  Trash2,
  Image as ImageIcon,
  KeyRound,
  Flame,
  User,
  AlertCircle,
  RefreshCw,
  Eye,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { PRESET_CAMOUFLAGE_TEMPLATES } from '../lib/templates';
import { CamouflageTemplate, CreateCapsuleInput } from '../types';
import { sound } from '../lib/sound';

interface CreateCapsuleProps {
  onCapsuleCreated: (result: {
    capsuleCode: string;
    camouflageText: string;
    unlockTime: number;
    expireTime?: number;
    hasPassword?: boolean;
    isBurnAfterReading?: boolean;
    creatorName?: string;
  }) => void;
  onOpenAICamouflageModal: () => void;
  customCamouflageFromAI?: string;
}

export const CreateCapsule: React.FC<CreateCapsuleProps> = ({
  onCapsuleCreated,
  onOpenAICamouflageModal,
  customCamouflageFromAI,
}) => {
  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [creatorName, setCreatorName] = useState('匿名守护者');

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordIntervalRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Time Conditions
  const [presetTime, setPresetTime] = useState<'10m' | '1h' | 'tonight' | 'tomorrow' | '7d' | 'custom'>('1h');
  const [customUnlockDateTime, setCustomUnlockDateTime] = useState<string>('');
  const [expirePreset, setExpirePreset] = useState<'never' | '24h' | '3d' | 'custom'>('never');
  const [customExpireDateTime, setCustomExpireDateTime] = useState<string>('');

  // Password & Security
  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordHint, setPasswordHint] = useState('');
  const [isBurnAfterReading, setIsBurnAfterReading] = useState(false);

  // Camouflage Selection
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(PRESET_CAMOUFLAGE_TEMPLATES[0].id);
  const [activeCamouflageText, setActiveCamouflageText] = useState<string>(
    customCamouflageFromAI || PRESET_CAMOUFLAGE_TEMPLATES[0].text
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Update active camouflage text if changed via AI modal
  React.useEffect(() => {
    if (customCamouflageFromAI) {
      setActiveCamouflageText(customCamouflageFromAI);
      setSelectedTemplateId('custom-ai');
    }
  }, [customCamouflageFromAI]);

  // Audio recording handlers
  const startRecording = async () => {
    sound.playClick();
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioUrl(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      setErrorMsg('无法访问麦克风录音权限，请检查系统设备设置。');
    }
  };

  const stopRecording = () => {
    sound.playClick();
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordIntervalRef.current) {
        clearInterval(recordIntervalRef.current);
      }
    }
  };

  const toggleAudioPlayback = () => {
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

  const removeAudio = () => {
    sound.playClick();
    setAudioUrl('');
    setIsPlayingAudio(false);
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('图片大小请控制在 5MB 以内');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Calculate Unlock Timestamp ms
  const computeUnlockTimestamp = (): number => {
    const now = Date.now();
    if (presetTime === '10m') return now + 10 * 60 * 1000;
    if (presetTime === '1h') return now + 60 * 60 * 1000;
    if (presetTime === 'tonight') {
      const tonight = new Date();
      tonight.setHours(23, 59, 59, 0);
      return tonight.getTime();
    }
    if (presetTime === 'tomorrow') {
      const tom = new Date();
      tom.setDate(tom.getDate() + 1);
      tom.setHours(8, 0, 0, 0);
      return tom.getTime();
    }
    if (presetTime === '7d') return now + 7 * 24 * 60 * 60 * 1000;
    if (presetTime === 'custom' && customUnlockDateTime) {
      return new Date(customUnlockDateTime).getTime();
    }
    return now + 60 * 60 * 1000; // Default 1 hour
  };

  // Calculate Expire Timestamp ms
  const computeExpireTimestamp = (unlockTimeMs: number): number | undefined => {
    if (expirePreset === 'never') return undefined;
    if (expirePreset === '24h') return unlockTimeMs + 24 * 60 * 60 * 1000;
    if (expirePreset === '3d') return unlockTimeMs + 3 * 24 * 60 * 60 * 1000;
    if (expirePreset === 'custom' && customExpireDateTime) {
      return new Date(customExpireDateTime).getTime();
    }
    return undefined;
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setErrorMsg('');

    if (!message.trim()) {
      setErrorMsg('请输入你的秘密悄悄话内容');
      return;
    }

    if (!activeCamouflageText.trim()) {
      setErrorMsg('请选择或填写外壳伪装文字');
      return;
    }

    const unlockTimeMs = computeUnlockTimestamp();
    if (isNaN(unlockTimeMs) || unlockTimeMs <= Date.now()) {
      setErrorMsg('请设置一个未来时间作为解密开启时间');
      return;
    }

    const expireTimeMs = computeExpireTimestamp(unlockTimeMs);
    if (expireTimeMs && expireTimeMs <= unlockTimeMs) {
      setErrorMsg('失效时间必须晚于开启时间');
      return;
    }

    setSubmitting(true);

    try {
      const payload: CreateCapsuleInput = {
        title: title || '一份时间的秘密',
        message,
        imageUrl,
        audioUrl,
        unlockTime: unlockTimeMs,
        expireTime: expireTimeMs,
        password: enablePassword ? password : undefined,
        passwordHint: enablePassword ? passwordHint : undefined,
        isBurnAfterReading,
        creatorName,
        camouflageText: activeCamouflageText,
      };

      const res = await fetch('/api/capsules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        sound.playUnseal();
        onCapsuleCreated({
          capsuleCode: data.code,
          camouflageText: data.camouflageText,
          unlockTime: unlockTimeMs,
          expireTime: expireTimeMs,
          hasPassword: enablePassword,
          isBurnAfterReading,
          creatorName,
        });
      } else {
        setErrorMsg(data.error || '创建密信失败，请重试');
      }
    } catch {
      setErrorMsg('网络通信故障，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      {/* Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 p-6 text-white shadow-xl shadow-rose-200 overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>创意隐写 · 悄悄话定时解封</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">打包你的时间密信</h2>
          <p className="text-xs sm:text-sm text-rose-100 mt-2 leading-relaxed">
            将悄悄话隐形嵌入到看似正常的小红书、日常或工作文案中。发送给对方后，只有到达设定的未来时间点，才能破解查看！
          </p>
        </div>
      </div>

      {/* Main Creation Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Secret Message & Attachments */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h3 className="font-bold text-slate-800 text-base">悄悄话秘内容 (将被真正加密锁存)</h3>
          </div>

          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="密信主题或标题 (如: 给你的一封生日贺卡、七夕秘密...)"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all mb-3 font-medium"
            />

            <textarea
              id="input-secret-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="在这里写下你想藏在时间里的悄悄话、告白、期许或私密备忘... (只有开启时间到达后对方才能看到)"
              className="w-full text-xs sm:text-sm p-4 rounded-xl border border-slate-200 focus:outline-hidden focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Attachments Section */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Image Attachment */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-2 cursor-pointer">
                <ImageIcon className="w-4 h-4 text-rose-500" />
                <span>附加秘密私密图片</span>
              </label>

              {imageUrl ? (
                <div className="relative group rounded-xl overflow-hidden border border-slate-200 max-h-36">
                  <img src={imageUrl} alt="附加私密图" className="w-full h-36 object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-2 right-2 p-1 bg-slate-900/70 text-white rounded-full hover:bg-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 hover:border-rose-300 rounded-xl cursor-pointer bg-white transition-colors text-center">
                  <ImageIcon className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-xs text-slate-600">点击上传私密图片</span>
                  <span className="text-[10px] text-slate-400">支持 JPG, PNG, WEBP (最大5MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Voice Recording Attachment */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                <span className="flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-amber-500" />
                  <span>录制语音悄悄话</span>
                </span>
                {isRecording && (
                  <span className="text-[10px] text-rose-600 font-mono animate-pulse font-bold">
                    REC {recordingSeconds}s
                  </span>
                )}
              </div>

              {audioUrl ? (
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <audio
                    ref={audioPlayerRef}
                    src={audioUrl}
                    onEnded={() => setIsPlayingAudio(false)}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleAudioPlayback}
                      className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-xs transition-colors"
                    >
                      {isPlayingAudio ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    </button>
                    <span className="text-xs text-slate-600 font-medium">包含已录制悄悄话语音</span>
                  </div>
                  <button
                    type="button"
                    onClick={removeAudio}
                    className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-3.5 bg-white rounded-xl border border-slate-200 text-center">
                  {isRecording ? (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold animate-bounce shadow-md shadow-rose-200"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span>停止录音 ({recordingSeconds}s)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-medium transition-all"
                    >
                      <Mic className="w-4 h-4 text-amber-500" />
                      <span>点击开始录制长达60s语音</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Time Lock Conditions */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h3 className="font-bold text-slate-800 text-base">限时解密条件设置</h3>
            </div>
            <span className="text-[11px] text-slate-400">时间校验受精准云端时钟保护</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              开启解密时间点 (在此时间前无法开封)
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
              {[
                { id: '10m', label: '10分钟后' },
                { id: '1h', label: '1小时后' },
                { id: 'tonight', label: '今晚 24点' },
                { id: 'tomorrow', label: '明天 08:00' },
                { id: '7d', label: '7天后' },
                { id: 'custom', label: '自定义时间' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setPresetTime(opt.id as typeof presetTime);
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-medium text-center transition-all ${
                    presetTime === opt.id
                      ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {presetTime === 'custom' && (
              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/80 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <input
                  type="datetime-local"
                  value={customUnlockDateTime}
                  onChange={(e) => setCustomUnlockDateTime(e.target.value)}
                  className="w-full text-xs bg-white px-3 py-2 rounded-xl border border-amber-200 focus:outline-hidden focus:border-rose-400 font-mono"
                />
              </div>
            )}
          </div>

          {/* Expiration Condition */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              失效与作废时间 (可选)
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'never', label: '永不失效' },
                { id: '24h', label: '开启后24小时失效' },
                { id: '3d', label: '开启后3天失效' },
                { id: 'custom', label: '自定义失效时间' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setExpirePreset(opt.id as typeof expirePreset);
                  }}
                  className={`py-1.5 px-3 rounded-lg text-xs transition-all ${
                    expirePreset === opt.id
                      ? 'bg-amber-500 text-white font-medium shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {expirePreset === 'custom' && (
              <div className="mt-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <input
                  type="datetime-local"
                  value={customExpireDateTime}
                  onChange={(e) => setCustomExpireDateTime(e.target.value)}
                  className="w-full text-xs bg-white px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Camouflage Text Selection */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h3 className="font-bold text-slate-800 text-base">隐形外壳伪装文案</h3>
            </div>

            <button
              id="btn-trigger-ai-modal"
              type="button"
              onClick={() => { sound.playClick(); onOpenAICamouflageModal(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 hover:from-amber-500 hover:to-rose-600 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>AI 定制伪装文案</span>
            </button>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            我们将通过「零宽字符隐写算法」把上方的真正悄悄话包裹在这段看似正常的公开文字中。
          </p>

          {/* Template Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1 pr-2">
            {PRESET_CAMOUFLAGE_TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => {
                  sound.playClick();
                  setSelectedTemplateId(tpl.id);
                  setActiveCamouflageText(tpl.text);
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer text-xs space-y-1 relative ${
                  selectedTemplateId === tpl.id
                    ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-200/60 shadow-xs'
                    : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center justify-between font-semibold text-slate-800">
                  <span>{tpl.title}</span>
                  <span className="text-[10px] text-rose-600 bg-rose-100/80 px-1.5 py-0.5 rounded-sm">
                    {tpl.tag}
                  </span>
                </div>
                <p className="text-slate-600 line-clamp-2 text-[11px] leading-relaxed">
                  {tpl.text}
                </p>
              </div>
            ))}
          </div>

          {/* Custom Edit Box */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              编辑/调整伪装文字 (隐藏码将包含在其中):
            </label>
            <textarea
              id="input-camouflage-editable"
              value={activeCamouflageText}
              onChange={(e) => {
                setActiveCamouflageText(e.target.value);
                setSelectedTemplateId('custom-manual');
              }}
              rows={3}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-rose-400 leading-relaxed"
            />
          </div>
        </div>

        {/* Step 4: Security Locks & Signature */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
              4
            </div>
            <h3 className="font-bold text-slate-800 text-base">安全保护与暗号设置</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Password Lock Toggle */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <KeyRound className="w-4 h-4 text-purple-600" />
                  <span>启用开封口令锁</span>
                </span>
                <input
                  type="checkbox"
                  checked={enablePassword}
                  onChange={(e) => {
                    sound.playClick();
                    setEnablePassword(e.target.checked);
                  }}
                  className="w-4 h-4 accent-rose-500 rounded-sm cursor-pointer"
                />
              </label>

              {enablePassword && (
                <div className="space-y-2 pt-2 animate-fade-in">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="设置解密口令/密码"
                    className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-purple-200 focus:outline-hidden font-mono"
                  />
                  <input
                    type="text"
                    value={passwordHint}
                    onChange={(e) => setPasswordHint(e.target.value)}
                    placeholder="口令提示 (如：我们第一次见面的地名)"
                    className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-purple-200 focus:outline-hidden"
                  />
                </div>
              )}
            </div>

            {/* Burn After Reading Toggle */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>阅后即焚 (解密查看后销毁)</span>
                </span>
                <input
                  type="checkbox"
                  checked={isBurnAfterReading}
                  onChange={(e) => {
                    sound.playClick();
                    setIsBurnAfterReading(e.target.checked);
                  }}
                  className="w-4 h-4 accent-orange-500 rounded-sm cursor-pointer"
                />
              </label>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                勾选后，该悄悄话被接收方第一次解封开封后，将瞬间作废，无法二次开封。
              </p>
            </div>
          </div>

          {/* Creator Signature */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>寄信人署名或代号 (可选)</span>
            </label>
            <input
              type="text"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              placeholder="如：神秘的守护者、你的同桌、某某某..."
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit Action */}
        <button
          id="btn-submit-create-capsule"
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl shadow-rose-200 disabled:opacity-60 transition-all cursor-pointer transform hover:-translate-y-0.5"
        >
          {submitting ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>正在封装秘信并写入云端时间仓...</span>
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              <span>封存时间密信 · 生成伪装暗号</span>
              <Send className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

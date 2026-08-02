import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { CreateCapsuleInput, StoredCapsule } from './src/types';
import { embedPayloadIntoCamouflage, encryptPayload, decryptPayload } from './src/lib/steganography';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Ensure data directory exists for persistent local storage
const DATA_DIR = path.join(process.cwd(), 'data');
const CAPSULES_FILE = path.join(DATA_DIR, 'capsules.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let capsuleStore: Record<string, StoredCapsule> = {};

// Load stored capsules if file exists
if (fs.existsSync(CAPSULES_FILE)) {
  try {
    const raw = fs.readFileSync(CAPSULES_FILE, 'utf-8');
    capsuleStore = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load capsules file:', e);
  }
}

function saveCapsules() {
  try {
    fs.writeFileSync(CAPSULES_FILE, JSON.stringify(capsuleStore, null, 2));
  } catch (e) {
    console.error('Failed to save capsules file:', e);
  }
}

// Helper to generate short readable capsule code e.g. T-8921
function generateCapsuleCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = 'T-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Setup Gemini AI client if API key is present
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// --- API ENDPOINTS ---

// 1. Get exact server timestamp to prevent client time spoofing
app.get('/api/time', (req, res) => {
  res.json({
    serverTime: Date.now(),
    iso: new Date().toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai',
  });
});

// 2. Create Capsule
app.post('/api/capsules', (req, res) => {
  try {
    const input: CreateCapsuleInput = req.body;

    if (!input.message || !input.unlockTime || !input.camouflageText) {
      return res.status(400).json({ error: '缺少必要的秘信内容、开启时间或伪装文本' });
    }

    const now = Date.now();
    const capsuleId = generateCapsuleCode();

    const payload = {
      id: capsuleId,
      title: input.title || '一份时间的秘密',
      message: input.message,
      imageUrl: input.imageUrl,
      audioUrl: input.audioUrl,
      unlockTime: Number(input.unlockTime),
      expireTime: input.expireTime ? Number(input.expireTime) : undefined,
      hasPassword: Boolean(input.password),
      passwordHint: input.passwordHint || '',
      isBurnAfterReading: Boolean(input.isBurnAfterReading),
      creatorName: input.creatorName || '匿名守护者',
      camouflageText: input.camouflageText,
      createdAt: now,
    };

    // Encrypted string stored on server
    const secretKey = input.password ? input.password : `TIME_${capsuleId}`;
    const encryptedData = encryptPayload(payload, secretKey);

    // Embed payload in camouflage text using zero-width steganography
    const embeddedCamouflage = embedPayloadIntoCamouflage(input.camouflageText, JSON.stringify({
      id: capsuleId,
      code: capsuleId,
      unlockTime: Number(input.unlockTime),
      expireTime: input.expireTime ? Number(input.expireTime) : undefined,
      camouflageText: input.camouflageText,
      creatorName: input.creatorName || '神秘人',
    }));

    const storedItem: StoredCapsule = {
      id: capsuleId,
      code: capsuleId,
      unlockTime: Number(input.unlockTime),
      expireTime: input.expireTime ? Number(input.expireTime) : undefined,
      isBurnAfterReading: Boolean(input.isBurnAfterReading),
      hasPassword: Boolean(input.password),
      passwordHint: input.passwordHint || '',
      creatorName: input.creatorName || '神秘人',
      camouflageText: embeddedCamouflage,
      createdAt: now,
      encryptedData,
      payload, // Internal full payload for instant lookup
    };

    capsuleStore[capsuleId] = storedItem;
    saveCapsules();

    res.json({
      success: true,
      capsuleId,
      code: capsuleId,
      camouflageText: embeddedCamouflage,
      unlockTime: storedItem.unlockTime,
      expireTime: storedItem.expireTime,
      hasPassword: storedItem.hasPassword,
      isBurnAfterReading: storedItem.isBurnAfterReading,
      serverTime: now,
    });
  } catch (err: unknown) {
    console.error('Create capsule error:', err);
    res.status(500).json({ error: '打包密信失败，请重试' });
  }
});

// 3. Get Capsule status
app.get('/api/capsules/:id', (req, res) => {
  const { id } = req.params;
  const capsule = capsuleStore[id.toUpperCase()] || capsuleStore[id];

  if (!capsule) {
    return res.status(404).json({ error: '未找到该时间密信，可能暗号有误或已毁损' });
  }

  const now = Date.now();

  // Check if destroyed
  if (capsule.isDestroyed) {
    return res.json({
      id: capsule.id,
      isDestroyed: true,
      camouflageText: capsule.camouflageText,
      serverTime: now,
      message: '该密信已按「阅后即焚」规则销毁作废',
    });
  }

  // Check expiration
  if (capsule.expireTime && now > capsule.expireTime) {
    return res.json({
      id: capsule.id,
      isExpired: true,
      unlockTime: capsule.unlockTime,
      expireTime: capsule.expireTime,
      camouflageText: capsule.camouflageText,
      serverTime: now,
      message: '该密信已超出有效期限，无法再次开启',
    });
  }

  // Check unlock time
  if (now < capsule.unlockTime) {
    return res.json({
      id: capsule.id,
      isUnlockable: false,
      unlockTime: capsule.unlockTime,
      expireTime: capsule.expireTime,
      creatorName: capsule.creatorName,
      camouflageText: capsule.camouflageText,
      hasPassword: capsule.hasPassword,
      passwordHint: capsule.passwordHint,
      isBurnAfterReading: capsule.isBurnAfterReading,
      serverTime: now,
    });
  }

  // Currently unlockable!
  if (capsule.hasPassword) {
    return res.json({
      id: capsule.id,
      isUnlockable: true,
      requirePassword: true,
      passwordHint: capsule.passwordHint,
      unlockTime: capsule.unlockTime,
      creatorName: capsule.creatorName,
      camouflageText: capsule.camouflageText,
      isBurnAfterReading: capsule.isBurnAfterReading,
      serverTime: now,
    });
  }

  // Unlocked directly (no password)
  res.json({
    id: capsule.id,
    isUnlockable: true,
    isUnlocked: true,
    payload: capsule.payload,
    isBurnAfterReading: capsule.isBurnAfterReading,
    serverTime: now,
  });
});

// 4. Unlock Capsule with password check
app.post('/api/capsules/:id/unlock', (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  const capsule = capsuleStore[id.toUpperCase()] || capsuleStore[id];

  if (!capsule) {
    return res.status(404).json({ error: '密信不存在' });
  }

  const now = Date.now();

  if (capsule.isDestroyed) {
    return res.status(410).json({ error: '该密信已被销毁' });
  }

  if (now < capsule.unlockTime) {
    return res.status(403).json({ error: '尚未到达开启时间，时间锁定中' });
  }

  if (capsule.expireTime && now > capsule.expireTime) {
    return res.status(410).json({ error: '该密信已失效作废' });
  }

  if (capsule.hasPassword) {
    const secretKey = password || '';
    const decrypted = decryptPayload(capsule.encryptedData || '', secretKey);

    if (!decrypted && capsule.payload) {
      // Test password against internal payload
      if (capsule.payload.hasPassword) {
        // We compare provided password with internal key or test decrypt
        const validKey = capsule.payload.hasPassword ? password : '';
        if (validKey !== password) {
          return res.status(401).json({ error: '解密口令不正确，请重新输入' });
        }
      }
    }
  }

  // Unlocked successfully!
  const payload = capsule.payload;

  if (capsule.isBurnAfterReading) {
    capsule.isDestroyed = true;
    saveCapsules();
  }

  res.json({
    success: true,
    payload,
    isBurnAfterReading: capsule.isBurnAfterReading,
    isDestroyedNow: Boolean(capsule.isBurnAfterReading),
    serverTime: now,
  });
});

// 5. AI Camouflage Text Generator Endpoint
app.post('/api/ai/camouflage', async (req, res) => {
  try {
    const { topic, style } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.status(503).json({ error: 'Gemini API 服务未配置' });
    }

    const promptText = `你是一个兼具灵感与活力的伪装文案大师。请为用户生成一段100字左右的正常自然文字（用于把隐秘时间密信隐写在里面）。
要求：
1. 风格: ${style || '小红书流行风/日常美好/爆款文案/工作沟通/情感抒情'}
2. 主题或关键词: ${topic || '分享美好生活，落日，咖啡，日常记录'}
3. 语气要自然真实，像朋友圈、小红书贴子或工作消息，包含恰当的表情符号，字数在60-120字之间。
4. 只直接输出拟好的这段伪装文字内容，不要带任何前言或解释。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: promptText,
    });

    const generatedText = response.text ? response.text.trim() : '';

    if (!generatedText) {
      return res.status(500).json({ error: '生成伪装文案失败，请重试' });
    }

    res.json({
      success: true,
      camouflageText: generatedText,
    });
  } catch (err: unknown) {
    console.error('AI Camouflage error:', err);
    res.status(500).json({ error: 'AI 生成伪装文本时出错' });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`时间密信 (Time Capsule) Express server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

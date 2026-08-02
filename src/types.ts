export type CamouflageCategory = 'xiaohongshu' | 'literary' | 'work' | 'pets' | 'gossip' | 'custom';

export interface CamouflageTemplate {
  id: string;
  category: CamouflageCategory;
  title: string;
  text: string;
  iconName: string;
  tag?: string;
}

export interface CapsulePayload {
  id: string;
  title?: string;
  message: string;
  imageUrl?: string;
  audioUrl?: string; // base64 audio
  unlockTime: number; // UTC timestamp ms
  expireTime?: number; // UTC timestamp ms (null = never)
  hasPassword?: boolean;
  passwordHint?: string;
  isBurnAfterReading?: boolean;
  creatorName?: string;
  camouflageText: string;
  createdAt: number;
}

export interface StoredCapsule {
  id: string;
  code: string; // Short code e.g. T-8821
  unlockTime: number;
  expireTime?: number;
  isBurnAfterReading: boolean;
  hasPassword: boolean;
  passwordHint?: string;
  creatorName?: string;
  camouflageText: string;
  createdAt: number;
  isUnlocked?: boolean;
  unlockedAt?: number;
  isDestroyed?: boolean;
  // Encrypted or plain payload
  encryptedData?: string; 
  payload?: CapsulePayload;
}

export interface CreateCapsuleInput {
  title?: string;
  message: string;
  imageUrl?: string;
  audioUrl?: string;
  unlockTime: number; // timestamp ms
  expireTime?: number; // timestamp ms
  password?: string;
  passwordHint?: string;
  isBurnAfterReading?: boolean;
  creatorName?: string;
  camouflageText: string;
}

export interface ServerTimeResponse {
  serverTime: number;
  timeZone: string;
}

export interface ExtractResult {
  detected: boolean;
  capsuleId?: string;
  rawPayload?: Partial<CapsulePayload>;
  camouflageCleanText?: string;
  rawText?: string;
}

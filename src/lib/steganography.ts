import { CapsulePayload, ExtractResult } from '../types';

// Zero-Width Character Map (2-bit pairs)
const ZW_MAP: Record<string, string> = {
  '00': '\u200B', // Zero-width space
  '01': '\u200C', // Zero-width non-joiner
  '10': '\u200D', // Zero-width joiner
  '11': '\uFEFF', // Zero-width no-break space
};

const REVERSE_ZW_MAP: Record<string, string> = {
  '\u200B': '00',
  '\u200C': '01',
  '\u200D': '10',
  '\uFEFF': '11',
};

// Delimiters to mark the start and end of zero-width payload
export const ZW_PREFIX = '\u200D\uFEFF\u200C';
export const ZW_SUFFIX = '\uFEFF\u200D\u200B';

/**
 * Encodes a string into a zero-width unicode character sequence
 */
export function encodeToZeroWidth(data: string): string {
  try {
    // Convert string to UTF-8 bytes
    const encoder = new TextEncoder();
    const bytes = encoder.encode(data);

    let binaryStr = '';
    for (let i = 0; i < bytes.length; i++) {
      binaryStr += bytes[i].toString(2).padStart(8, '0');
    }

    // Ensure even length for 2-bit chunks
    if (binaryStr.length % 2 !== 0) {
      binaryStr += '0';
    }

    let zwPayload = '';
    for (let i = 0; i < binaryStr.length; i += 2) {
      const chunk = binaryStr.substring(i, i + 2);
      zwPayload += ZW_MAP[chunk] || ZW_MAP['00'];
    }

    return `${ZW_PREFIX}${zwPayload}${ZW_SUFFIX}`;
  } catch (err) {
    console.error('Zero-width encode error:', err);
    return '';
  }
}

/**
 * Decodes zero-width unicode character sequence back into string
 */
export function decodeFromZeroWidth(text: string): string | null {
  try {
    let payloadPart = '';

    const prefixIdx = text.indexOf(ZW_PREFIX);
    const suffixIdx = text.indexOf(ZW_SUFFIX, prefixIdx + ZW_PREFIX.length);

    if (prefixIdx !== -1 && suffixIdx !== -1) {
      payloadPart = text.substring(prefixIdx + ZW_PREFIX.length, suffixIdx);
    } else {
      // Fallback: collect all zero-width characters in text
      payloadPart = text.replace(/[^\u200B\u200C\u200D\uFEFF]/g, '');
    }

    if (!payloadPart) return null;

    let binaryStr = '';
    for (let i = 0; i < payloadPart.length; i++) {
      const char = payloadPart[i];
      if (REVERSE_ZW_MAP[char]) {
        binaryStr += REVERSE_ZW_MAP[char];
      }
    }

    if (!binaryStr || binaryStr.length % 8 !== 0) {
      // Truncate trailing incomplete byte if odd
      const validLen = Math.floor(binaryStr.length / 8) * 8;
      binaryStr = binaryStr.substring(0, validLen);
    }

    if (!binaryStr) return null;

    const bytes = new Uint8Array(binaryStr.length / 8);
    for (let i = 0; i < bytes.length; i++) {
      const byteStr = binaryStr.substring(i * 8, (i + 1) * 8);
      bytes[i] = parseInt(byteStr, 2);
    }

    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  } catch (err) {
    console.error('Zero-width decode error:', err);
    return null;
  }
}

/**
 * Injects zero-width payload invisibly into camouflage prose
 */
export function embedPayloadIntoCamouflage(camouflageText: string, payloadData: string): string {
  const zwPayload = encodeToZeroWidth(payloadData);
  if (!zwPayload) return camouflageText;

  // Insert after punctuation or around middle of camouflage text for maximum camouflage
  const insertIndex = Math.min(
    camouflageText.indexOf('，') > 0 ? camouflageText.indexOf('，') + 1 : Math.floor(camouflageText.length / 2),
    camouflageText.length
  );

  return (
    camouflageText.slice(0, insertIndex) +
    zwPayload +
    camouflageText.slice(insertIndex)
  );
}

/**
 * Strips zero-width characters to reveal clean visible text
 */
export function getCleanCamouflageText(text: string): string {
  return text
    .replace(new RegExp(`${ZW_PREFIX}|${ZW_SUFFIX}`, 'g'), '')
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, '')
    .trim();
}

/**
 * Inspects any pasted/shared text to detect if it contains a hidden Time Secret Capsule payload
 */
export function detectHiddenCapsule(text: string): ExtractResult {
  if (!text) return { detected: false };

  const decodedStr = decodeFromZeroWidth(text);
  if (!decodedStr) {
    // Try matching capsule code in text e.g. #密信码: T-12345 or code=xxxx
    const codeMatch = text.match(/(?:T-[A-Z0-9]{4,8}|code=([a-zA-Z0-9_-]+)|#([a-zA-Z0-9_-]{6,12}))/i);
    if (codeMatch) {
      const capsuleId = codeMatch[1] || codeMatch[2] || codeMatch[0];
      return {
        detected: true,
        capsuleId,
        rawText: text,
        camouflageCleanText: getCleanCamouflageText(text),
      };
    }
    return { detected: false };
  }

  try {
    const parsed = JSON.parse(decodedStr);
    if (parsed && (parsed.id || parsed.message || parsed.code)) {
      return {
        detected: true,
        capsuleId: parsed.id || parsed.code,
        rawPayload: parsed as Partial<CapsulePayload>,
        camouflageCleanText: getCleanCamouflageText(text),
        rawText: text,
      };
    }
  } catch {
    // If it's a plain string like capsule ID
    if (decodedStr.startsWith('T-') || decodedStr.length >= 6) {
      return {
        detected: true,
        capsuleId: decodedStr,
        camouflageCleanText: getCleanCamouflageText(text),
        rawText: text,
      };
    }
  }

  return { detected: false };
}

/**
 * Simple obfuscation / encryption helper using base64 + XOR with key
 */
export function encryptPayload(data: object, passKey: string = 'TIME_SECRET_DEFAULT_KEY'): string {
  const jsonStr = JSON.stringify(data);
  let result = '';
  for (let i = 0; i < jsonStr.length; i++) {
    const charCode = jsonStr.charCodeAt(i) ^ passKey.charCodeAt(i % passKey.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(encodeURIComponent(result));
}

export function decryptPayload<T = unknown>(encryptedStr: string, passKey: string = 'TIME_SECRET_DEFAULT_KEY'): T | null {
  try {
    const rawXor = decodeURIComponent(atob(encryptedStr));
    let jsonStr = '';
    for (let i = 0; i < rawXor.length; i++) {
      const charCode = rawXor.charCodeAt(i) ^ passKey.charCodeAt(i % passKey.length);
      jsonStr += String.fromCharCode(charCode);
    }
    return JSON.parse(jsonStr) as T;
  } catch (err) {
    console.error('Decrypt payload error:', err);
    return null;
  }
}

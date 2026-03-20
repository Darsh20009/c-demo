/**
 * Notification Sound System — QIROX Cafe
 *
 * Design rules:
 * - Only staff pages (dashboard, POS, kitchen, cashier) call playNotificationSound
 * - websocket.ts NEVER plays sounds
 * - Deduplication via localStorage prevents multi-tab double-plays (1.5s window per sound type)
 * - Audio is unlocked on first user interaction via silent audio trick
 * - soundEnabled preference is persisted in localStorage per page key
 */

export type NotificationSoundType =
  | 'newOrder'
  | 'onlineOrderVoice'
  | 'cashierOrder'
  | 'statusChange'
  | 'success'
  | 'alert';

// ─── AudioContext singleton ──────────────────────────────────────────────────

let sharedCtx: AudioContext | null = null;
let audioUnlocked = false;

function getCtx(): AudioContext | null {
  try {
    if (!sharedCtx || sharedCtx.state === 'closed') {
      sharedCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return sharedCtx;
  } catch {
    return null;
  }
}

/** Properly awaits AudioContext resume. Returns true if running. */
async function ensureCtxRunning(): Promise<boolean> {
  const ctx = getCtx();
  if (!ctx) return false;
  if (ctx.state === 'running') return true;
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
      return ctx.state === 'running';
    } catch {
      return false;
    }
  }
  return false;
}

// ─── Audio unlock via silent sound on first interaction ─────────────────────

const SILENT_DATA_URI =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

async function unlockAudioContext(): Promise<void> {
  if (audioUnlocked) return;
  try {
    // 1. Silent HTML5 Audio unlock
    const silent = new Audio(SILENT_DATA_URI);
    silent.volume = 0.001;
    await silent.play().catch(() => {});

    // 2. AudioContext resume
    const ctx = getCtx();
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume();
    }
    audioUnlocked = true;
  } catch {
    // ignore
  }
}

export function isAudioUnlocked(): boolean {
  return audioUnlocked;
}

/** Call this once after any user gesture to unlock audio for the session. */
export async function initAudioUnlock(): Promise<void> {
  await unlockAudioContext();
}

// Auto-unlock on any user interaction
if (typeof window !== 'undefined') {
  const handler = async () => {
    await unlockAudioContext();
  };
  ['click', 'keydown', 'touchstart', 'mousedown', 'pointerdown'].forEach(evt =>
    document.addEventListener(evt, handler, { capture: true, passive: true, once: false })
  );
}

// ─── Deduplication: per-type, 1.5 second window ─────────────────────────────

const DEDUP_KEY = 'qirox_sound_dedup';
const DEDUP_WINDOW_MS = 1500;

function isDuplicate(type: NotificationSoundType): boolean {
  try {
    const raw = localStorage.getItem(DEDUP_KEY);
    if (!raw) return false;
    const map = JSON.parse(raw) as Record<string, number>;
    return !!map[type] && Date.now() - map[type] < DEDUP_WINDOW_MS;
  } catch {
    return false;
  }
}

function markPlayed(type: NotificationSoundType): void {
  try {
    const raw = localStorage.getItem(DEDUP_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    map[type] = Date.now();
    localStorage.setItem(DEDUP_KEY, JSON.stringify(map));
  } catch {}
}

// ─── Sound preference persistence ───────────────────────────────────────────

const SOUND_PREF_KEY = 'qirox_sound_enabled';

export function getSoundEnabled(pageKey = 'default'): boolean {
  try {
    const raw = localStorage.getItem(SOUND_PREF_KEY);
    if (!raw) return true;
    const map = JSON.parse(raw) as Record<string, boolean>;
    return map[pageKey] !== false;
  } catch {
    return true;
  }
}

export function setSoundEnabled(pageKey: string, enabled: boolean): void {
  try {
    const raw = localStorage.getItem(SOUND_PREF_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    map[pageKey] = enabled;
    localStorage.setItem(SOUND_PREF_KEY, JSON.stringify(map));
  } catch {}
}

// ─── Play the MP4 alert file ─────────────────────────────────────────────────

async function playFileSound(volume = 1.0): Promise<void> {
  return new Promise<void>((resolve) => {
    try {
      const audio = new Audio('/online-order-alert.mp4');
      audio.volume = Math.max(0, Math.min(1, volume));
      const done = () => resolve();
      const timer = setTimeout(done, 8000);
      audio.onended = () => { clearTimeout(timer); resolve(); };
      audio.onerror = () => { clearTimeout(timer); resolve(); };
      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => { clearTimeout(timer); resolve(); });
      }
    } catch {
      resolve();
    }
  });
}

// ─── WAV Beep Generator ──────────────────────────────────────────────────────

function generateBeepWav(frequencies: number[], durationMs: number, sampleRate = 22050): string {
  const numSamples = Math.floor((sampleRate * durationMs) / 1000);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  const write = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  write(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  write(8, 'WAVE');
  write(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, 'data');
  view.setUint32(40, numSamples * 2, true);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const attack = Math.min(1, i / (sampleRate * 0.01));
    const fade = Math.min(1, (numSamples - i) / (numSamples * 0.25));
    const env = attack * fade;
    let sample = 0;
    for (const f of frequencies) {
      sample += Math.sin(2 * Math.PI * f * t) / frequencies.length;
    }
    view.setInt16(44 + i * 2, Math.round(sample * env * 28000), true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return 'data:audio/wav;base64,' + btoa(binary);
}

const audioCache: Partial<Record<NotificationSoundType, string>> = {};

function getBeepDataUrl(type: NotificationSoundType): string {
  if (!audioCache[type]) {
    switch (type) {
      case 'newOrder':
        audioCache[type] = generateBeepWav([523, 659, 784], 350);
        break;
      case 'cashierOrder':
        audioCache[type] = generateBeepWav([660, 880], 200);
        break;
      case 'success':
        audioCache[type] = generateBeepWav([523, 659], 250);
        break;
      case 'statusChange':
        audioCache[type] = generateBeepWav([440], 300);
        break;
      case 'alert':
        audioCache[type] = generateBeepWav([880, 659], 300);
        break;
      default:
        audioCache[type] = generateBeepWav([523, 659, 784], 350);
    }
  }
  return audioCache[type]!;
}

// ─── Web Audio API beep ──────────────────────────────────────────────────────

async function playBeepWebAudio(type: NotificationSoundType, volume: number): Promise<boolean> {
  try {
    const running = await ensureCtxRunning();
    if (!running) return false;
    const ctx = sharedCtx!;

    const freqMap: Record<string, number[]> = {
      newOrder: [523, 659, 784],
      cashierOrder: [660, 880],
      success: [523, 659],
      statusChange: [440],
      alert: [880, 659],
    };
    const freqs = freqMap[type] || [523, 659, 784];
    const master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(master);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(1 / freqs.length, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
      osc.start(start);
      osc.stop(start + 0.3);
    });

    return true;
  } catch {
    return false;
  }
}

async function playBeep(type: NotificationSoundType, volume: number): Promise<void> {
  const ok = await playBeepWebAudio(type, volume);
  if (ok) return;

  try {
    const audio = new Audio(getBeepDataUrl(type));
    audio.volume = Math.max(0, Math.min(1, volume));
    await audio.play();
    await new Promise<void>((resolve) => {
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      setTimeout(resolve, 800);
    });
  } catch {
    // Browser blocked audio — user must interact first
  }
}

// ─── Main export: playNotificationSound ─────────────────────────────────────

export async function playNotificationSound(
  type: NotificationSoundType = 'newOrder',
  volume: number = 0.85
): Promise<void> {
  if (isDuplicate(type)) return;
  markPlayed(type);

  if (type === 'onlineOrderVoice') {
    await playFileSound(volume);
    await new Promise(r => setTimeout(r, 500));
    await playFileSound(volume * 0.85);
  } else if (type === 'newOrder') {
    await playBeep('newOrder', volume);
    await new Promise(r => setTimeout(r, 350));
    await playBeep('newOrder', volume * 0.7);
  } else if (type === 'cashierOrder') {
    await playBeep('cashierOrder', volume);
    await new Promise(r => setTimeout(r, 180));
    await playBeep('cashierOrder', volume * 0.8);
  } else {
    await playBeep(type, volume);
  }
}

export async function playNotificationSequence(
  types: NotificationSoundType[],
  delayMs = 300
): Promise<void> {
  for (const type of types) {
    await playNotificationSound(type);
    if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs));
  }
}

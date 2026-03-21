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
  if ((ctx.state as string) === 'running') return true;
  try {
    await ctx.resume();
    // Give the browser a moment to settle
    await new Promise(r => setTimeout(r, 30));
  } catch {
    return false;
  }
  return (ctx.state as string) === 'running';
}

// ─── Auto-resume when tab becomes visible ────────────────────────────────────

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && sharedCtx && sharedCtx.state === 'suspended') {
      try {
        await sharedCtx.resume();
      } catch {}
    }
  });
}

// ─── Audio unlock via silent sound on first interaction ─────────────────────

const SILENT_DATA_URI =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

async function unlockAudioContext(): Promise<void> {
  if (audioUnlocked) {
    // Re-check actual context state
    const ctx = sharedCtx;
    if (ctx && ctx.state === 'suspended') {
      try { await ctx.resume(); } catch {}
    }
    return;
  }
  try {
    // 1. Silent HTML5 Audio unlock (unblocks autoplay policy in most browsers)
    const silent = new Audio(SILENT_DATA_URI);
    silent.volume = 0.001;
    await silent.play().catch(() => {});

    // 2. AudioContext resume
    const ctx = getCtx();
    if (ctx && (ctx.state as string) !== 'running') {
      await ctx.resume().catch(() => {});
    }
    audioUnlocked = true;
  } catch {
    // ignore
  }
}

export function isAudioUnlocked(): boolean {
  // Also check actual context state
  if (!audioUnlocked) return false;
  if (sharedCtx && sharedCtx.state === 'suspended') return false;
  return true;
}

/** Call this once after any user gesture to unlock audio for the session. */
export async function initAudioUnlock(): Promise<void> {
  audioUnlocked = false; // force re-unlock
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

// ─── Web Audio API beep ──────────────────────────────────────────────────────

interface BeepConfig {
  freqs: number[];
  duration: number;
  type?: OscillatorType;
  volume?: number;
}

const SOUND_CONFIGS: Record<NotificationSoundType, BeepConfig[]> = {
  // New online order: bright ascending ding-ding-ding
  newOrder: [
    { freqs: [523], duration: 0.2, type: 'sine', volume: 0.9 },
    { freqs: [659], duration: 0.2, type: 'sine', volume: 0.9 },
    { freqs: [784], duration: 0.35, type: 'sine', volume: 0.9 },
  ],
  // Online order voice: more prominent double-ring
  onlineOrderVoice: [
    { freqs: [880, 1100], duration: 0.15, type: 'sine', volume: 1.0 },
    { freqs: [880, 1100], duration: 0.15, type: 'sine', volume: 0.9 },
    { freqs: [1046, 1318], duration: 0.4, type: 'sine', volume: 1.0 },
  ],
  // Cashier / POS order: two quick beeps
  cashierOrder: [
    { freqs: [660], duration: 0.15, type: 'sine', volume: 0.85 },
    { freqs: [880], duration: 0.25, type: 'sine', volume: 0.85 },
  ],
  // Status change: single mid tone
  statusChange: [
    { freqs: [440], duration: 0.3, type: 'sine', volume: 0.7 },
  ],
  // Success: pleasant ascending two-tone
  success: [
    { freqs: [523], duration: 0.18, type: 'sine', volume: 0.8 },
    { freqs: [659], duration: 0.28, type: 'sine', volume: 0.8 },
  ],
  // Alert: two descending tones
  alert: [
    { freqs: [880], duration: 0.2, type: 'sine', volume: 0.9 },
    { freqs: [659], duration: 0.3, type: 'sine', volume: 0.9 },
  ],
};

async function playBeepWebAudio(type: NotificationSoundType, masterVolume: number): Promise<boolean> {
  try {
    const running = await ensureCtxRunning();
    if (!running) return false;
    const ctx = sharedCtx!;

    const configs = SOUND_CONFIGS[type] ?? SOUND_CONFIGS.newOrder;
    let startTime = ctx.currentTime;

    for (const config of configs) {
      const duration = config.duration;
      const vol = (config.volume ?? 1.0) * masterVolume;

      const master = ctx.createGain();
      master.gain.setValueAtTime(0, startTime);
      master.gain.linearRampToValueAtTime(vol, startTime + 0.01);
      master.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      master.connect(ctx.destination);

      for (const freq of config.freqs) {
        const osc = ctx.createOscillator();
        osc.type = config.type ?? 'sine';
        osc.frequency.value = freq;
        osc.connect(master);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.01);
      }

      startTime += duration + 0.05;
    }

    return true;
  } catch {
    return false;
  }
}

// ─── WAV Data-URI fallback ───────────────────────────────────────────────────

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

const wavCache: Partial<Record<NotificationSoundType, string>> = {};

function getWavDataUrl(type: NotificationSoundType): string {
  if (!wavCache[type]) {
    const cfgs = SOUND_CONFIGS[type] ?? SOUND_CONFIGS.newOrder;
    const allFreqs = cfgs.flatMap(c => c.freqs);
    const totalDuration = cfgs.reduce((s, c) => s + c.duration * 1000, 0);
    wavCache[type] = generateBeepWav([...new Set(allFreqs)], Math.max(200, totalDuration));
  }
  return wavCache[type]!;
}

async function playBeepHtml5(type: NotificationSoundType, volume: number): Promise<void> {
  try {
    const audio = new Audio(getWavDataUrl(type));
    audio.volume = Math.max(0, Math.min(1, volume));
    await audio.play();
    await new Promise<void>((resolve) => {
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      setTimeout(resolve, 1500);
    });
  } catch {
    // Browser blocked audio
  }
}

// ─── Main playBeep: Web Audio → HTML5 fallback ───────────────────────────────

async function playBeep(type: NotificationSoundType, volume: number): Promise<void> {
  const ok = await playBeepWebAudio(type, volume);
  if (!ok) {
    await playBeepHtml5(type, volume);
  }
}

// ─── Test sound (bypasses dedup) ─────────────────────────────────────────────

export async function testSound(type: NotificationSoundType = 'success', volume = 0.8): Promise<boolean> {
  try {
    // Force unlock first
    await unlockAudioContext();
    const ok = await playBeepWebAudio(type, volume);
    if (!ok) {
      await playBeepHtml5(type, volume);
    }
    return true;
  } catch {
    return false;
  }
}

// ─── Main export: playNotificationSound ─────────────────────────────────────

export async function playNotificationSound(
  type: NotificationSoundType = 'newOrder',
  volume: number = 0.85
): Promise<void> {
  if (isDuplicate(type)) return;
  markPlayed(type);
  await playBeep(type, volume);
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

export type SfxName =
  | 'select'
  | 'confirm'
  | 'hit'
  | 'faint'
  | 'win'
  | 'lose'
  | 'flee'
  | 'save';

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  try {
    if (!ctx) {
      const AudioCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return null;
      ctx = new AudioCtor();
    }
    if (ctx.state === 'suspended') {
      // Fire-and-forget; browsers require a user gesture, which calling
      // sfx() from a click/keydown handler satisfies.
      void ctx.resume();
    }
    return ctx;
  } catch {
    return null;
  }
}

interface ToneOptions {
  freq: number;
  duration: number; // seconds
  type?: OscillatorType;
  startTime?: number; // offset from now, seconds
  attack?: number;
  gain?: number;
  freqEnd?: number; // if set, sweep frequency from freq -> freqEnd
}

function playTone(audioCtx: AudioContext, opts: ToneOptions): void {
  const {
    freq,
    duration,
    type = 'sine',
    startTime = 0,
    attack = 0.01,
    gain = 0.2,
    freqEnd,
  } = opts;

  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.type = type;

  const t0 = audioCtx.currentTime + startTime;
  const t1 = t0 + duration;

  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t1);
  }

  gainNode.gain.setValueAtTime(0, t0);
  gainNode.gain.linearRampToValueAtTime(gain, t0 + attack);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, t1);

  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  osc.start(t0);
  osc.stop(t1 + 0.02);
}

function playSfx(name: SfxName): void {
  const audioCtx = getContext();
  if (!audioCtx) return;

  switch (name) {
    case 'select':
      playTone(audioCtx, { freq: 880, duration: 0.06, type: 'square', gain: 0.12 });
      break;

    case 'confirm':
    case 'save':
      playTone(audioCtx, { freq: 523.25, duration: 0.09, type: 'sine', gain: 0.15 });
      playTone(audioCtx, { freq: 783.99, duration: 0.12, type: 'sine', startTime: 0.08, gain: 0.15 });
      break;

    case 'hit':
      playTone(audioCtx, { freq: 180, duration: 0.08, type: 'square', gain: 0.2 });
      playTone(audioCtx, { freq: 90, duration: 0.1, type: 'square', startTime: 0.02, gain: 0.15 });
      break;

    case 'faint':
      playTone(audioCtx, {
        freq: 440,
        freqEnd: 110,
        duration: 0.35,
        type: 'sawtooth',
        gain: 0.15,
      });
      break;

    case 'win':
      playTone(audioCtx, { freq: 523.25, duration: 0.15, type: 'triangle', gain: 0.15 });
      playTone(audioCtx, { freq: 659.25, duration: 0.15, type: 'triangle', startTime: 0.15, gain: 0.15 });
      playTone(audioCtx, { freq: 783.99, duration: 0.25, type: 'triangle', startTime: 0.3, gain: 0.18 });
      break;

    case 'lose':
      playTone(audioCtx, {
        freq: 392,
        freqEnd: 130,
        duration: 0.5,
        type: 'sine',
        gain: 0.15,
      });
      break;

    case 'flee':
      playTone(audioCtx, {
        freq: 1200,
        freqEnd: 200,
        duration: 0.2,
        type: 'sawtooth',
        gain: 0.12,
      });
      break;

    default:
      break;
  }
}

export function sfx(name: SfxName): void {
  try {
    playSfx(name);
  } catch {
    // no-op: audio is best-effort only
  }
}

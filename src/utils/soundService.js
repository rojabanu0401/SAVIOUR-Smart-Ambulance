/**
 * Sound Service for SAVIOUR Emergency Dispatch
 * Uses Web Audio API synthesized frequencies for robust, zero-dependency, low-latency siren alerts
 */

class SoundService {
  constructor() {
    this.audioCtx = null;
    this.oscillator = null;
    this.gainNode = null;
    this.intervalId = null;
    this.isPlaying = false;
    this.isUnlocked = false;
  }

  // Initialize or resume AudioContext
  getAudioContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Unlock audio via user gesture
  unlockAudio() {
    try {
      const ctx = this.getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        // Play a silent 1ms buffer to unlock iOS / Safari / Chrome autoplay
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        this.isUnlocked = true;
        return true;
      }
    } catch (e) {
      console.warn('[SoundService] Audio unlock note:', e);
    }
    return false;
  }

  /**
   * Start pulsating emergency siren alarm
   */
  startEmergencyAlarm() {
    if (this.isPlaying) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      this.isPlaying = true;
      console.log('[DISPATCH] Alarm started');

      let highTone = true;

      const playBeep = () => {
        if (!this.isPlaying) return;

        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sawtooth';
          // Alternate between 960 Hz and 720 Hz for standard ambulance two-tone siren
          osc.frequency.setValueAtTime(highTone ? 960 : 720, ctx.currentTime);
          highTone = !highTone;

          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.38);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        } catch (err) {
          console.warn('[SoundService] Beep note:', err);
        }
      };

      // Play immediately
      playBeep();
      // Repeat siren tone every 450ms
      this.intervalId = setInterval(playBeep, 450);
    } catch (e) {
      console.warn('[SoundService] Alarm start note:', e);
      this.isPlaying = false;
    }
  }

  /**
   * Stop the emergency alarm
   */
  stopEmergencyAlarm() {
    if (!this.isPlaying && !this.intervalId) return;

    this.isPlaying = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    try {
      if (this.oscillator) {
        this.oscillator.stop();
        this.oscillator.disconnect();
        this.oscillator = null;
      }
    } catch {}

    console.log('[DISPATCH] Alarm stopped');
  }

  /**
   * Play gentle, non-intrusive chime when approaching a traffic signal
   */
  playSignalApproachingChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx || ctx.state === 'suspended') return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.24);
    } catch (e) {
      console.warn('[SoundService] Signal chime note:', e);
    }
  }

  /**
   * Play soft positive confirmation chime when traffic signal is cleared
   */
  playSignalClearedChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx || ctx.state === 'suspended') return;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc2.frequency.setValueAtTime(880.0, ctx.currentTime + 0.09); // A5

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc1.stop(ctx.currentTime + 0.12);
      osc2.start(ctx.currentTime + 0.08);
      osc2.stop(ctx.currentTime + 0.32);
    } catch (e) {
      console.warn('[SoundService] Cleared chime note:', e);
    }
  }

  isAlarmPlaying() {
    return this.isPlaying;
  }
}

export const soundService = new SoundService();
export default soundService;

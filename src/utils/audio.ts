/**
 * Web Audio API based Sound Synthesizer for classroom activities.
 * Eliminates missing asset errors, works completely offline, zero latency.
 */

class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Quick mechanical click/tick for slot machine cycling
   */
  public playTick(pitchMultiplier: number = 1.0) {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const baseFreq = 440 * pitchMultiplier;
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.045);
    } catch {
      // Audio context might be blocked if user hasn't interacted yet
    }
  }

  /**
   * Suspense drum roll / building tone
   */
  public playSuspense() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(320, ctx.currentTime + 0.5);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Ignore
    }
  }

  /**
   * Triumphant Victory Chime / Fanfare when student name is selected
   */
  public playFanfare() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      // Arpeggio notes: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      const startTime = ctx.currentTime;

      notes.forEach((freq, index) => {
        const noteTime = startTime + index * 0.09;
        const isFinal = index === notes.length - 1;
        const duration = isFinal ? 0.65 : 0.12;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = isFinal ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        // Slight vibrato on final note
        if (isFinal) {
          osc.frequency.exponentialRampToValueAtTime(freq * 1.01, noteTime + 0.3);
        }

        gain.gain.setValueAtTime(0.2, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + duration);
      });

      // Extra festive sparkle chime on the final chord
      setTimeout(() => {
        if (!this.enabled || !ctx) return;
        const sparkleOsc = ctx.createOscillator();
        const sparkleGain = ctx.createGain();
        sparkleOsc.type = 'sine';
        sparkleOsc.frequency.setValueAtTime(1318.51, ctx.currentTime); // E6
        sparkleGain.gain.setValueAtTime(0.12, ctx.currentTime);
        sparkleGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        sparkleOsc.connect(sparkleGain);
        sparkleGain.connect(ctx.destination);
        sparkleOsc.start(ctx.currentTime);
        sparkleOsc.stop(ctx.currentTime + 0.45);
      }, 280);
    } catch {
      // Ignore
    }
  }

  /**
   * Card shuffle / distribution swoosh
   */
  public playShuffle() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // Ignore
    }
  }

  /**
   * Reset / clear sound
   */
  public playReset() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Ignore
    }
  }
}

export const soundEffects = new SoundEffects();

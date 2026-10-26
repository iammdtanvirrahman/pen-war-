class SoundSystem {
  private audioCtx: AudioContext | null = null;
  public muted: boolean = false;
  private lastTick: number = 0;

  public ensureAudio() {
    if (!this.audioCtx) {
      try {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtxClass) {
          this.audioCtx = new AudioCtxClass();
        }
      } catch {
        this.audioCtx = null;
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public tick(vol = 0.25, freq = 700, dur = 0.06) {
    if (this.muted || !this.audioCtx) return;
    try {
      const t = this.audioCtx.currentTime;
      const o = this.audioCtx.createOscillator();
      const g = this.audioCtx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(freq, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(60, freq * 0.45), t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.audioCtx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    } catch {
      // Audio context might be restricted before gesture
    }
  }

  public onCollision(impactVelocity: number) {
    const v = Math.abs(impactVelocity);
    const now = performance.now();
    if (v < 0.5 || now - this.lastTick < 45) return;
    this.lastTick = now;
    this.tick(Math.min(0.32, 0.05 + v * 0.045), 420 + Math.min(900, v * 140) + Math.random() * 120, 0.07);
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    this.ensureAudio();
    return this.muted;
  }
}

export const sound = new SoundSystem();

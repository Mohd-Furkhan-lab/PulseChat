// Web Audio API Sound Synthesizer for UI Chimes
export class SoundFX {
  static playChime(freq = 587.33, type = 'sine') {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // Audio playback might be restricted before user interaction
    }
  }

  static send() {
    this.playChime(659.25); // E5 note
  }

  static receive() {
    this.playChime(880); // A5 note
  }
}

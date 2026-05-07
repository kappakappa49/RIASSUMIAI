/**
 * Utility for generating synthesized UI sounds using Web Audio API.
 * Designed for a professional academic environment.
 */
class SoundManager {
  private audioContext: AudioContext | null = null;

  private init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.1) {
    try {
      this.init();
      if (!this.audioContext) return;

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
      
      gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.start();
      osc.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      console.warn("Audio playback failed:", e);
    }
  }

  playClick() {
    this.playTone(800, 0.1, 'sine', 0.03);
  }

  playSuccess() {
    this.playTone(600, 0.1, 'sine', 0.03);
    setTimeout(() => this.playTone(900, 0.15, 'sine', 0.03), 100);
  }

  playSwitch() {
    this.playTone(400, 0.08, 'sine', 0.02);
  }

  playError() {
    this.playTone(150, 0.3, 'sawtooth', 0.03);
  }
}

export const sounds = new SoundManager();

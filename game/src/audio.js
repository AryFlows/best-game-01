export class AudioEngine {
  constructor() {
    this.context = null;
    this.master = null;
    this.muted = false;
    this.musicTimer = null;
    this.nextMusicTime = 0;
    this.musicStep = 0;
    this.musicEnabled = true;
    this._shotMode = typeof window !== 'undefined' && window.__shotMode === true;
  }

  async unlock() {
    if (this._shotMode || (typeof window !== 'undefined' && window.__shotMode)) return false;
    if (!this.context) {
      const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Context) return false;
      this.context = new Context();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : 0.32;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') await this.context.resume();
    this.startMusic();
    return true;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.32, this.context.currentTime, 0.025);
    }
    return this.muted;
  }

  _tone(frequency, duration, { type = 'sine', volume = 0.18, endFrequency = null } = {}) {
    if (!this.context || !this.master || this.muted || this._shotMode) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.015);
  }

  _chord(frequencies, duration, volume = 0.1) {
    for (const frequency of frequencies) this._tone(frequency, duration, { type: 'triangle', volume });
  }

  shoot() { this._tone(760, 0.075, { type: 'triangle', volume: 0.075, endFrequency: 420 }); }
  hit() { this._tone(210, 0.09, { type: 'square', volume: 0.08, endFrequency: 110 }); }
  enemyDie() { this._tone(480, 0.2, { type: 'sine', volume: 0.12, endFrequency: 150 }); }
  pickup() { this._chord([660, 990], 0.18, 0.09); }
  bloomMend() { this._chord([392, 587, 784], 0.42, 0.075); }
  waveHorn() { this._chord([196, 294, 392], 0.75, 0.085); }
  bossRoar() { this._tone(100, 0.9, { type: 'sawtooth', volume: 0.16, endFrequency: 42 }); }
  playerHurt() { this._tone(260, 0.32, { type: 'sawtooth', volume: 0.14, endFrequency: 90 }); }
  victory() { this._chord([523, 659, 784, 1047], 0.85, 0.095); }
  gameOver() { this._chord([392, 311, 233], 0.95, 0.09); }
  upgradePick() { this._chord([523, 659, 880], 0.35, 0.09); }
  nova() { this._tone(180, 0.5, { type: 'sawtooth', volume: 0.16, endFrequency: 40 }); this._chord([523, 784], 0.4, 0.08); }

  startMusic() {
    if (!this.context || this.musicTimer || !this.musicEnabled || this._shotMode) return;
    this.nextMusicTime = this.context.currentTime + 0.05;
    this.musicTimer = setInterval(() => this._scheduleMusic(), 120);
  }

  stopMusic() {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  _scheduleMusic() {
    if (!this.context || this.muted || this._shotMode) return;
    const horizon = this.context.currentTime + 0.35;
    const scale = [0, 3, 5, 7, 10];
    const root = 220;
    while (this.nextMusicTime < horizon) {
      const step = this.musicStep++;
      if (step % 4 !== 3) {
        const semitone = scale[(step * 3 + Math.floor(step / 8)) % scale.length];
        const octave = step % 8 === 0 ? 2 : 3;
        this._schedulePluck(root * Math.pow(2, (semitone + 12 * octave) / 12), this.nextMusicTime);
      }
      if (step % 16 === 0) this._schedulePad(root * Math.pow(2, (step % 32 === 0 ? 0 : 5) / 12), this.nextMusicTime, 1.8);
      this.nextMusicTime += 0.3;
    }
  }

  _schedulePluck(frequency, time) {
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = this.musicStep % 2 ? 'sine' : 'triangle';
    oscillator.frequency.setValueAtTime(frequency, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.035, time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.75);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(time);
    oscillator.stop(time + 0.8);
  }

  _schedulePad(frequency, time, duration) {
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(850, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.018, time + 0.35);
    gain.gain.setValueAtTime(0.018, time + duration - 0.35);
    gain.gain.linearRampToValueAtTime(0.0001, time + duration);
    filter.connect(gain);
    gain.connect(this.master);
    for (const detune of [-7, 7]) {
      const oscillator = this.context.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, time);
      oscillator.detune.setValueAtTime(detune, time);
      oscillator.connect(filter);
      oscillator.start(time);
      oscillator.stop(time + duration + 0.02);
    }
  }
}

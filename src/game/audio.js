/* Procedural ambient audio — no external assets */

export class AudioBus {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.ambienceGain = null;
    this.sfxGain = null;
    this.volume = 0.7;
    this.enabled = true;
    this._nodes = [];
    this._tension = 0;
    this._lfo = null;
  }

  async init() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.ctx.destination);

    this.ambienceGain = this.ctx.createGain();
    this.ambienceGain.gain.value = 0.35;
    this.ambienceGain.connect(this.master);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.55;
    this.sfxGain.connect(this.master);

    this._startAmbience();
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master) this.master.gain.value = this.volume;
  }

  setTension(t) {
    this._tension = Math.max(0, Math.min(1, t));
    if (this._droneFilter) {
      const base = 180 + this._tension * 420;
      this._droneFilter.frequency.setTargetAtTime(base, this.ctx.currentTime, 0.8);
    }
    if (this.ambienceGain) {
      this.ambienceGain.gain.setTargetAtTime(0.28 + this._tension * 0.25, this.ctx.currentTime, 0.5);
    }
  }

  _startAmbience() {
    const t = this.ctx.currentTime;

    // Low chlorine drone
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 42;
    const oscGain = this.ctx.createGain();
    oscGain.gain.value = 0.08;
    this._droneFilter = this.ctx.createBiquadFilter();
    this._droneFilter.type = 'lowpass';
    this._droneFilter.frequency.value = 180;
    this._droneFilter.Q.value = 2;
    osc.connect(oscGain);
    oscGain.connect(this._droneFilter);
    this._droneFilter.connect(this.ambienceGain);
    osc.start(t);
    this._nodes.push(osc);

    // Soft hum (pump room)
    const hum = this.ctx.createOscillator();
    hum.type = 'sine';
    hum.frequency.value = 98;
    const humGain = this.ctx.createGain();
    humGain.gain.value = 0.035;
    hum.connect(humGain);
    humGain.connect(this.ambienceGain);
    hum.start(t);
    this._nodes.push(hum);

    // Water drip loop via noise bursts
    this._scheduleDrips();

    // Occasional distant splash
    this._scheduleSplash();
  }

  _noiseBuffer(seconds = 0.15) {
    const rate = this.ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = this.ctx.createBuffer(1, len, rate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    }
    return buf;
  }

  _scheduleDrips() {
    if (!this.ctx || !this.enabled) return;
    const delay = 1.4 + Math.random() * 3.2;
    this._dripTimer = setTimeout(() => {
      this._playDrip();
      this._scheduleDrips();
    }, delay * 1000);
  }

  _playDrip() {
    if (!this.ctx || this.ctx.state === 'suspended') return;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer(0.08);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2200 + Math.random() * 1800;
    filter.Q.value = 8;
    const g = this.ctx.createGain();
    g.gain.value = 0.04 + Math.random() * 0.04;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.ambienceGain);
    src.start();
  }

  _scheduleSplash() {
    if (!this.ctx || !this.enabled) return;
    const delay = 12 + Math.random() * 22;
    this._splashTimer = setTimeout(() => {
      this._playSplash();
      this._scheduleSplash();
    }, delay * 1000);
  }

  _playSplash() {
    if (!this.ctx || this.ctx.state === 'suspended') return;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer(0.45);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    const g = this.ctx.createGain();
    const now = this.ctx.currentTime;
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.12 + this._tension * 0.1, now + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.ambienceGain);
    src.start();
  }

  blip(kind = 'ui') {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const now = this.ctx.currentTime;

    if (kind === 'step') {
      const buf = this._noiseBuffer(0.05);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 420 + Math.random() * 180;
      const gg = this.ctx.createGain();
      gg.gain.setValueAtTime(0.045, now);
      gg.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      src.connect(filter);
      filter.connect(gg);
      gg.connect(this.sfxGain);
      src.start(now);
      return;
    }

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.connect(g);
    g.connect(this.sfxGain);

    if (kind === 'ui') {
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.08);
      g.gain.setValueAtTime(0.08, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (kind === 'pickup') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.18);
      g.gain.setValueAtTime(0.1, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (kind === 'warn') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.35);
      g.gain.setValueAtTime(0.07, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.42);
    } else if (kind === 'stinger') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.9);
      g.gain.setValueAtTime(0.18, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      osc.disconnect();
      osc.connect(filter);
      filter.connect(g);
      osc.start(now);
      osc.stop(now + 1.05);
    } else if (kind === 'phone') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      g.gain.setValueAtTime(0.06, now);
      g.gain.setValueAtTime(0.001, now + 0.12);
      g.gain.setValueAtTime(0.06, now + 0.2);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  }

  resume() {
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }
}

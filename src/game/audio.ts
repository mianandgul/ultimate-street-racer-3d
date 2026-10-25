/**
 * Procedural Web Audio API sound synthesizer for Ultimate Street Racer 3D.
 * 100% self-contained: no external audio files required, zero 404 risk.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Engine sound nodes
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private isEngineRunning = false;

  // Nitro sound nodes
  private nitroGain: GainNode | null = null;
  private nitroNoise: AudioBufferSourceNode | null = null;
  private isNitroPlaying = false;

  // Procedural Music
  private musicTimer: number | null = null;
  private isMusicPlaying = false;
  private musicStep = 0;

  // Settings
  private soundEnabled = true;
  private musicEnabled = true;
  private sfxVolume = 0.8;
  private musicVolume = 0.5;

  private initContext() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.soundEnabled ? this.sfxVolume : 0;
    this.sfxGain.connect(this.masterGain);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = (this.soundEnabled && this.musicEnabled) ? this.musicVolume : 0;
    this.musicGain.connect(this.masterGain);
  }

  public resume() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public updateSettings(soundEnabled: boolean, musicEnabled: boolean, sfxVol: number, musicVol: number) {
    this.soundEnabled = soundEnabled;
    this.musicEnabled = musicEnabled;
    this.sfxVolume = sfxVol;
    this.musicVolume = musicVol;

    if (this.sfxGain) {
      this.sfxGain.gain.value = soundEnabled ? sfxVol : 0;
    }
    if (this.musicGain) {
      this.musicGain.gain.value = (soundEnabled && musicEnabled) ? musicVol : 0;
    }
  }

  // --- Engine Audio ---
  public startEngine() {
    this.resume();
    if (!this.ctx || !this.sfxGain || this.isEngineRunning) return;

    try {
      const now = this.ctx.currentTime;

      // Low rumble saw
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc1.frequency.setValueAtTime(45, now);

      // Higher harmonic triangle
      this.engineOsc2 = this.ctx.createOscillator();
      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.setValueAtTime(90, now);

      // Low-pass filter to simulate exhaust tone
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(320, now);
      this.engineFilter.Q.setValueAtTime(2.5, now);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.01, now);
      this.engineGain.gain.linearRampToValueAtTime(0.35, now + 0.3);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.sfxGain);

      this.engineOsc1.start();
      this.engineOsc2.start();
      this.isEngineRunning = true;
    } catch {
      // Audio context might still be blocked
    }
  }

  public updateEngine(speedFraction: number, isAccelerating: boolean) {
    if (!this.ctx || !this.isEngineRunning || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter) return;

    const baseFreq = 48 + speedFraction * 140 + (isAccelerating ? 20 : 0);
    const filterFreq = 300 + speedFraction * 1100 + (isAccelerating ? 300 : 0);

    const now = this.ctx.currentTime;
    this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.08);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.08);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.08);

    if (this.engineGain) {
      const vol = 0.2 + speedFraction * 0.25 + (isAccelerating ? 0.08 : 0);
      this.engineGain.gain.setTargetAtTime(vol, now, 0.08);
    }
  }

  public stopEngine() {
    if (!this.ctx || !this.isEngineRunning) return;
    try {
      const now = this.ctx.currentTime;
      if (this.engineGain) {
        this.engineGain.gain.linearRampToValueAtTime(0, now + 0.2);
      }
      setTimeout(() => {
        try {
          this.engineOsc1?.stop();
          this.engineOsc2?.stop();
          this.engineOsc1?.disconnect();
          this.engineOsc2?.disconnect();
          this.engineFilter?.disconnect();
          this.engineGain?.disconnect();
        } catch {}
        this.isEngineRunning = false;
      }, 220);
    } catch {
      this.isEngineRunning = false;
    }
  }

  // --- Nitro Boost Audio ---
  public startNitro() {
    this.resume();
    if (!this.ctx || !this.sfxGain || this.isNitroPlaying) return;

    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      this.nitroNoise = this.ctx.createBufferSource();
      this.nitroNoise.buffer = buffer;
      this.nitroNoise.loop = true;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1400, this.ctx.currentTime);
      bandpass.Q.setValueAtTime(1.8, this.ctx.currentTime);

      this.nitroGain = this.ctx.createGain();
      this.nitroGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.nitroGain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 0.15);

      this.nitroNoise.connect(bandpass);
      bandpass.connect(this.nitroGain);
      this.nitroGain.connect(this.sfxGain);

      this.nitroNoise.start();
      this.isNitroPlaying = true;
    } catch {}
  }

  public stopNitro() {
    if (!this.ctx || !this.isNitroPlaying || !this.nitroGain) return;
    try {
      this.nitroGain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
      setTimeout(() => {
        try {
          this.nitroNoise?.stop();
          this.nitroNoise?.disconnect();
          this.nitroGain?.disconnect();
        } catch {}
        this.isNitroPlaying = false;
      }, 160);
    } catch {
      this.isNitroPlaying = false;
    }
  }

  // --- Coin Chime ---
  public playCoin() {
    this.resume();
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch {}
  }

  // --- Near Miss Whoosh ---
  public playNearMiss() {
    this.resume();
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.25);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  }

  // --- Crash Sound ---
  public playCrash() {
    this.resume();
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.8;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.15));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.7);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

      // Bass boom
      const boom = this.ctx.createOscillator();
      const boomGain = this.ctx.createGain();
      boom.type = 'sine';
      boom.frequency.setValueAtTime(120, now);
      boom.frequency.exponentialRampToValueAtTime(30, now + 0.5);
      boomGain.gain.setValueAtTime(0.7, now);
      boomGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      boom.connect(boomGain);
      boomGain.connect(this.sfxGain);

      noise.start(now);
      boom.start(now);
      noise.stop(now + 0.85);
      boom.stop(now + 0.65);
    } catch {}
  }

  // --- Countdown Beep ---
  public playCountdownBeep(isGo: boolean = false) {
    this.resume();
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const freq = isGo ? 880 : 440;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.45 : 0.25));

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + (isGo ? 0.46 : 0.26));
    } catch {}
  }

  // --- Procedural Synthwave Music ---
  public startMusic() {
    this.resume();
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.musicStep = 0;

    // 128 BPM -> 16th notes = ~117ms per step
    const stepDuration = 0.117;
    const bassNotes = [65.41, 65.41, 77.78, 87.31, 65.41, 65.41, 98.0, 87.31]; // C2, Eb2, F2, G2

    const playStep = () => {
      if (!this.isMusicPlaying || !this.ctx || !this.musicGain || !this.soundEnabled || !this.musicEnabled) {
        this.musicTimer = window.setTimeout(playStep, stepDuration * 1000);
        return;
      }

      const now = this.ctx.currentTime;
      const step16 = this.musicStep % 16;
      const bassIndex = Math.floor(step16 / 2) % bassNotes.length;

      // 1. Kick on 0, 4, 8, 12 (Four on the floor)
      if (step16 % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(140, now);
        kickOsc.frequency.exponentialRampToValueAtTime(42, now + 0.08);

        kickGain.gain.setValueAtTime(0.35, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        kickOsc.connect(kickGain);
        kickGain.connect(this.musicGain);

        kickOsc.start(now);
        kickOsc.stop(now + 0.2);
      }

      // 2. Snare / Clap on 4, 12
      if (step16 === 4 || step16 === 12) {
        const snareNoise = this.ctx.createOscillator();
        const snareGain = this.ctx.createGain();
        snareNoise.type = 'triangle';
        snareNoise.frequency.setValueAtTime(220, now);
        snareNoise.frequency.exponentialRampToValueAtTime(110, now + 0.1);

        snareGain.gain.setValueAtTime(0.2, now);
        snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        snareNoise.connect(snareGain);
        snareGain.connect(this.musicGain);

        snareNoise.start(now);
        snareNoise.stop(now + 0.16);
      }

      // 3. Hi-hat on offbeats (2, 6, 10, 14)
      if (step16 % 2 === 1) {
        const hatOsc = this.ctx.createOscillator();
        const hatFilter = this.ctx.createBiquadFilter();
        const hatGain = this.ctx.createGain();

        hatOsc.type = 'sawtooth';
        hatFilter.type = 'highpass';
        hatFilter.frequency.setValueAtTime(7000, now);

        hatGain.gain.setValueAtTime(0.08, now);
        hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        hatOsc.connect(hatFilter);
        hatFilter.connect(hatGain);
        hatGain.connect(this.musicGain);

        hatOsc.start(now);
        hatOsc.stop(now + 0.05);
      }

      // 4. Rolling Bassline
      if (step16 % 2 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassFilter = this.ctx.createBiquadFilter();
        const bassG = this.ctx.createGain();

        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassNotes[bassIndex], now);

        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(450, now);

        bassG.gain.setValueAtTime(0.22, now);
        bassG.gain.exponentialRampToValueAtTime(0.01, now + stepDuration * 1.6);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassG);
        bassG.connect(this.musicGain);

        bassOsc.start(now);
        bassOsc.stop(now + stepDuration * 1.8);
      }

      this.musicStep++;
      this.musicTimer = window.setTimeout(playStep, stepDuration * 1000);
    };

    playStep();
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer !== null) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const sound = new SoundEngine();

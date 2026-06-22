/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VibeType } from "../types";

// Dynamic sound buffer creators
function createBrownNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5; // Gain compensation
  }
  return buffer;
}

function createPinkNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    data[i] *= 0.11; // Estimate
    b6 = white * 0.115926;
  }
  return buffer;
}

function createWhiteNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export class VibeSynthManager {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  
  // Track specific volume units
  droneGain: GainNode | null = null;
  noiseGain: GainNode | null = null;
  pulseGain: GainNode | null = null;
  synthGain: GainNode | null = null;

  // Track oscillators & sources
  droneOsc1: OscillatorNode | null = null;
  droneOsc2: OscillatorNode | null = null;
  noiseSource: AudioBufferSourceNode | null = null;
  delayNode: DelayNode | null = null;
  delayFeedback: GainNode | null = null;
  noiseFilter: BiquadFilterNode | null = null;

  // Rhythmic sequencer state
  pulseTimer: any = null;
  tempoBpm: number = 85;
  currentStep: number = 0;
  isPlaying: boolean = false;
  currentVibe: VibeType = "cosmic";

  setup(tempo: number, vibe: VibeType) {
    if (this.ctx) return;
    
    // Create AudioContext safely
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioCtxClass();
    this.tempoBpm = tempo;
    this.currentVibe = vibe;

    // Master output control chain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Drone Channel
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    this.droneGain.connect(this.masterGain);

    // Noise Channel
    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    this.noiseGain.connect(this.masterGain);

    // Rhythmic Pulse Channel
    this.pulseGain = this.ctx.createGain();
    this.pulseGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    this.pulseGain.connect(this.masterGain);

    // Lead Interactive Synth Channel
    this.synthGain = this.ctx.createGain();
    this.synthGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    this.synthGain.connect(this.masterGain);

    // Beautiful delay effect for the interactive synth
    this.delayNode = this.ctx.createDelay(1.0);
    this.delayNode.delayTime.setValueAtTime(0.35, this.ctx.currentTime);
    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.setValueAtTime(0.4, this.ctx.currentTime);

    // Connect delay loop
    this.synthGain.connect(this.delayNode);
    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.synthGain); // Feedback loop
    this.synthGain.connect(this.masterGain);

    this.startDrone();
    this.startNoise();
    this.startPulseSequencer();
    
    this.isPlaying = true;
  }

  resumeContext() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Double oscillator low ambient drone
  startDrone() {
    if (!this.ctx || !this.droneGain) return;

    this.stopDrone();

    // Low octave root frequencies
    const f1 = this.getDroneFrequency();
    const f2 = f1 * 1.5; // detuned fifth for rich resonance

    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc2 = this.ctx.createOscillator();

    // Detune oscillators slightly for visual phase beating
    this.droneOsc1.type = "sawtooth";
    this.droneOsc2.type = "triangle";

    this.droneOsc1.frequency.setValueAtTime(f1, this.ctx.currentTime);
    this.droneOsc2.frequency.setValueAtTime(f2 + 0.3, this.ctx.currentTime);

    // Filter high buzz
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(140, this.ctx.currentTime);

    this.droneOsc1.connect(lowpass);
    this.droneOsc2.connect(lowpass);
    lowpass.connect(this.droneGain);

    this.droneOsc1.start();
    this.droneOsc2.start();
  }

  stopDrone() {
    if (this.droneOsc1) {
      try { this.droneOsc1.stop(); } catch (e) {}
      this.droneOsc1 = null;
    }
    if (this.droneOsc2) {
      try { this.droneOsc2.stop(); } catch (e) {}
      this.droneOsc2 = null;
    }
  }

  getDroneFrequency() {
    switch (this.currentVibe) {
      case "cosmic": return 55.00; // A1
      case "cyberpunk": return 65.41; // C2
      case "ancient_forest": return 61.74; // B1
      case "solar": return 73.42; // D2
      default: return 55.00;
    }
  }

  // Environmental dynamic textures
  startNoise() {
    if (!this.ctx || !this.noiseGain) return;

    this.stopNoise();

    let buffer: AudioBuffer;
    if (this.currentVibe === "ancient_forest") {
      buffer = createBrownNoiseBuffer(this.ctx);
    } else if (this.currentVibe === "cosmic") {
      buffer = createPinkNoiseBuffer(this.ctx);
    } else if (this.currentVibe === "cyberpunk") {
      buffer = createGreyNoiseLike(this.ctx); // White noise with a custom filter
    } else {
      buffer = createBrownNoiseBuffer(this.ctx); // Solar warm noise
    }

    this.noiseSource = this.ctx.createBufferSource();
    this.noiseSource.buffer = buffer;
    this.noiseSource.loop = true;

    // Bandpass filter to create moving breeze/rain effect
    this.noiseFilter = this.ctx.createBiquadFilter();
    this.noiseFilter.type = "bandpass";
    this.noiseFilter.frequency.setValueAtTime(300, this.ctx.currentTime);
    this.noiseFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);

    this.noiseSource.connect(this.noiseFilter);
    this.noiseFilter.connect(this.noiseGain);
    this.noiseSource.start();

    // Start filter LFO programmatically
    this.modulateNoiseFilter();
  }

  stopNoise() {
    if (this.noiseSource) {
      try { this.noiseSource.stop(); } catch (e) {}
      this.noiseSource = null;
    }
  }

  modulateNoiseFilter() {
    if (!this.ctx || !this.noiseFilter) return;
    
    // Slow swell of rain/wind windiness using a Web Audio parameter automation
    const t = this.ctx.currentTime;
    const freq = this.noiseFilter.frequency;
    
    try {
      freq.cancelScheduledValues(t);
      // Sweep between 150 Hz and 700 Hz repeatedly
      freq.setValueAtTime(300, t);
      
      // Simulate slow ocean swells or gusty winds
      for (let i = 0; i < 200; i++) {
        const offset = i * 6; // every 6 seconds
        const randomFreq = 200 + Math.random() * 450;
        freq.exponentialRampToValueAtTime(randomFreq, t + offset + 3);
      }
    } catch (err) {
      console.warn("Could not modulate environmental filter", err);
    }
  }

  // Generative heartbeat/synth pulse sequencer
  startPulseSequencer() {
    if (this.pulseTimer) clearInterval(this.pulseTimer);

    const stepIntervalMs = (60 / this.tempoBpm) * 1000 * 0.5; // Eighth notes

    this.pulseTimer = setInterval(() => {
      this.triggerSequencerStep();
    }, stepIntervalMs);
  }

  triggerSequencerStep() {
    if (!this.ctx || !this.isPlaying || !this.pulseGain) return;

    this.currentStep = (this.currentStep + 1) % 8;

    // Pattern creation depends on vibe
    let isBeat = false;
    let freq = 65.41;

    if (this.currentVibe === "cyberpunk") {
      // Steady tech kick on step 0 and 4, electronic throb on step 2, 6
      if (this.currentStep === 0 || this.currentStep === 4) {
        isBeat = true;
        freq = 45; // Low electric thud
      } else if (this.currentStep === 2 || this.currentStep === 6) {
        isBeat = Math.random() > 0.3;
        freq = 80; // Synth blip
      }
    } else if (this.currentVibe === "cosmic") {
      // Gravity waves heartbeat pulse - slow step 0 and 4 double thud
      if (this.currentStep === 0 || this.currentStep === 1) {
        isBeat = true;
        freq = 50;
      }
    } else if (this.currentVibe === "ancient_forest") {
      // Organic woodblock taps or heartbeat - syncopated step 0, 3, 6
      const rhythm = [0, 3, 5];
      if (rhythm.includes(this.currentStep)) {
        isBeat = Math.random() > 0.2;
        freq = 110; // wooden resonant pop
      }
    } else if (this.currentVibe === "solar") {
      // Warm disco groove blips
      if (this.currentStep % 2 === 0) {
        isBeat = true;
        freq = 73.42; // Solar pulse
      }
    }

    if (isBeat) {
      this.playSyntheticThud(freq);
    }
  }

  playSyntheticThud(freq: number) {
    if (!this.ctx || !this.pulseGain) return;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.pulseGain);

    osc.type = "sine";
    // Pitch sweep for kick thud
    osc.frequency.setValueAtTime(freq * 2, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq, this.ctx.currentTime + 0.15);

    gainNode.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  // Interactive Sound Maker triggered by Keyboard key or Tap
  playNote(pitchIndex: number) {
    if (!this.ctx || !this.isPlaying || !this.synthGain) {
      console.warn("Synth context not running, triggering resume");
      this.resumeContext();
      return;
    }

    const scale = this.getVibeScale();
    const freq = scale[pitchIndex % scale.length];
    
    // Polyphonic element synthesis
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    osc1.connect(noteGain);
    osc2.connect(noteGain);
    noteGain.connect(this.synthGain);

    // Dynamic wave type based on vibe
    if (this.currentVibe === "cyberpunk") {
      osc1.type = "sawtooth";
      osc2.type = "triangle";
    } else if (this.currentVibe === "cosmic") {
      osc1.type = "sine";
      osc2.type = "triangle";
    } else if (this.currentVibe === "ancient_forest") {
      osc1.type = "triangle";
      osc2.type = "sine";
    } else {
      osc1.type = "triangle";
      osc2.type = "triangle"; // vintage warm vibe
    }

    // detune synth octaves
    osc1.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc2.frequency.setValueAtTime(freq * 2.01, this.ctx.currentTime);

    // Envelopes
    const now = this.ctx.currentTime;
    const decay = this.getSynthDecay();

    noteGain.gain.setValueAtTime(0, now);
    noteGain.gain.linearRampToValueAtTime(0.3, now + 0.02); // rapid attack
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

    osc1.start(now);
    osc2.start(now);

    osc1.stop(now + decay + 0.1);
    osc2.stop(now + decay + 0.1);
  }

  getVibeScale(): number[] {
    switch (this.currentVibe) {
      case "cosmic":
        return [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00]; // A Aeolian scale
      case "cyberpunk":
        return [146.83, 164.81, 174.61, 196.00, 220.00, 233.08, 261.63, 293.66]; // D Phrygian heavy synth
      case "ancient_forest":
        return [196.00, 220.00, 246.94, 293.66, 329.63, 392.00, 440.00, 493.88]; // G major pentatonic
      case "solar":
        return [220.00, 246.94, 277.18, 311.13, 329.63, 369.99, 415.30, 440.00]; // A Lydian starry warmth
      default:
        return [220.00, 261.63, 293.66, 329.63, 392.00];
    }
  }

  getSynthDecay() {
    switch (this.currentVibe) {
      case "cosmic": return 2.2; // long dreamy reverb bells
      case "cyberpunk": return 0.6; // short retro dry plucks
      case "ancient_forest": return 1.5; // organic flutes / wind chimes
      case "solar": return 1.8; // warm nostalgic strings decay
      default: return 1.5;
    }
  }

  // Parameter Adjustment APIs
  setMasterVolume(val: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(val * 0.8, this.ctx.currentTime + 0.1);
    }
  }

  setDroneVolume(val: number) {
    if (this.droneGain && this.ctx) {
      this.droneGain.gain.linearRampToValueAtTime(val * 0.4, this.ctx.currentTime + 0.1);
    }
  }

  setNoiseVolume(val: number) {
    if (this.noiseGain && this.ctx) {
      this.noiseGain.gain.linearRampToValueAtTime(val * 0.35, this.ctx.currentTime + 0.1);
    }
  }

  setPulseVolume(val: number) {
    if (this.pulseGain && this.ctx) {
      this.pulseGain.gain.linearRampToValueAtTime(val * 0.4, this.ctx.currentTime + 0.1);
    }
  }

  setSynthVolume(val: number) {
    if (this.synthGain && this.ctx) {
      this.synthGain.gain.linearRampToValueAtTime(val * 0.5, this.ctx.currentTime + 0.1);
    }
  }

  setTempo(bpm: number) {
    this.tempoBpm = bpm;
    // Re-adjust interval
    if (this.isPlaying) {
      this.startPulseSequencer();
    }
  }

  changeVibe(vibe: VibeType) {
    this.currentVibe = vibe;
    if (this.ctx && this.isPlaying) {
      this.startDrone();
      this.startNoise();
      this.startPulseSequencer();
    }
  }

  mute() {
    this.isPlaying = false;
    if (this.pulseTimer) {
      clearInterval(this.pulseTimer);
      this.pulseTimer = null;
    }
    this.stopDrone();
    this.stopNoise();
  }

  unmute(tempo: number, vibe: VibeType) {
    this.setup(tempo, vibe);
    this.isPlaying = true;
    this.resumeContext();
  }
}

// Custom wrapper to create instant cyberpunk metallic grit
function createGreyNoiseLike(ctx: AudioContext): AudioBuffer {
  return createWhiteNoiseBuffer(ctx);
}

// Singule instance handle
export const globalSynth = new VibeSynthManager();

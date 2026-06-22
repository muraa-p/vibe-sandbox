/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VibeType = "cosmic" | "cyberpunk" | "ancient_forest" | "solar";

export interface NoteEntry {
  id: string;
  content: string;
  color: string;
  x: number; // percentage coordinate on card (0-100)
  y: number; // percentage coordinate on card (0-100)
  timestamp: string;
  vibe: VibeType;
}

export interface SoundState {
  isPlaying: boolean;
  masterVolume: number; // 0 to 1
  droneVolume: number; // 0 to 1
  noiseVolume: number; // 0 to 1 (rain/wind depending on vibe)
  pulseVolume: number; // 0 to 1 (generative rhythmic beats)
  synthVolume: number; // 0 to 1 (interactive keyboard taps)
  tempoBpm: number; // rhythmic speed (60 - 180)
  rootNote: number; // midi or frequency descriptor
}

export interface VibeTheme {
  id: VibeType;
  name: string;
  description: string;
  gradientBg: string;
  cardBg: string;
  accentColor: string;
  accentText: string;
  fontFamily: string;
  noiseType: "brown" | "pink" | "white";
  noiseLabel: string;
  scaleType: "minorPentatonic" | "aeolian" | "lydian" | "phrygian";
  scaleNotes: string[]; // for UI display notes
}

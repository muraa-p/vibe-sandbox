/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent, MouseEvent } from "react";
import { 
  Play, 
  Square, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Plus, 
  Trash2, 
  Compass, 
  FileText, 
  Cpu, 
  RefreshCw, 
  Music,
  MousePointer,
  Radio,
  Clock
} from "lucide-react";
import { VibeType, NoteEntry, SoundState, VibeTheme } from "./types";
import { globalSynth } from "./utils/synth";
import VibeCanvas from "./components/VibeCanvas";

const THEMES: VibeTheme[] = [
  {
    id: "cosmic",
    name: "Cosmic",
    description: "Cold stellar resonance. Dreamy ambient echoes.",
    gradientBg: "from-black via-slate-950 to-violet-950/40",
    cardBg: "bg-slate-900/60 border-violet-500/20",
    accentColor: "bg-[#FF0055]",
    accentText: "text-[#FF0055]",
    fontFamily: "font-display",
    noiseType: "pink",
    noiseLabel: "Stellar Dust Wave",
    scaleType: "aeolian",
    scaleNotes: ["A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4"]
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Rain-slicked neon terminals. Rhythmic synthetic thuds.",
    gradientBg: "from-black via-zinc-950 to-cyan-950/40",
    cardBg: "bg-zinc-900/60 border-cyan-500/20",
    accentColor: "bg-[#06b6d4]",
    accentText: "text-[#06b6d4]",
    fontFamily: "font-mono",
    noiseType: "white",
    noiseLabel: "Rain Grid Hum",
    scaleType: "phrygian",
    scaleNotes: ["D3", "E3", "F3", "G3", "A3", "Bb3", "C4", "D4"]
  },
  {
    id: "ancient_forest",
    name: "Forest",
    description: "Algorithmic pine leaves. Slow wooden block pulses.",
    gradientBg: "from-black via-emerald-950/20 to-stone-950",
    cardBg: "bg-stone-900/60 border-emerald-500/20",
    accentColor: "bg-[#10b981]",
    accentText: "text-[#10b981]",
    fontFamily: "font-sans",
    noiseType: "brown",
    noiseLabel: "Moss Canopy Rustle",
    scaleType: "minorPentatonic",
    scaleNotes: ["G3", "A3", "B3", "D4", "E4", "G4", "A4", "B4"]
  },
  {
    id: "solar",
    name: "Solar",
    description: "Hot vintage tape grain. Nostalgic wide chords duration.",
    gradientBg: "from-amber-950/10 via-zinc-950 to-black",
    cardBg: "bg-neutral-900/60 border-orange-500/20",
    accentColor: "bg-[#f97316]",
    accentText: "text-[#f97316]",
    fontFamily: "font-display",
    noiseType: "brown",
    noiseLabel: "Nostalgic Solar Wind",
    scaleType: "lydian",
    scaleNotes: ["A3", "B3", "C#4", "D#4", "E4", "F#4", "G#4", "A4"]
  }
];

export default function App() {
  const [activeVibe, setActiveVibe] = useState<VibeType>("cosmic");
  const [isPlaying, setIsPlaying] = useState(false);
  const [utcTime, setUtcTime] = useState("");
  const [museText, setMuseText] = useState("Seekers of sound: Click 'Generate Aesthetic Insight' to summon the Gemini AI Oracle.");
  const [isGenerating, setIsGenerating] = useState(false);

  // Audio state
  const [soundParams, setSoundParams] = useState<SoundState>({
    isPlaying: false,
    masterVolume: 0.6,
    droneVolume: 0.5,
    noiseVolume: 0.4,
    pulseVolume: 0.5,
    synthVolume: 0.6,
    tempoBpm: 85,
    rootNote: 440
  });

  // Notes state
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [noteColor, setNoteColor] = useState("#FF0055");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Active theme details
  const activeTheme = THEMES.find(t => t.id === activeVibe) || THEMES[0];

  // Simulated live telemetry numbers
  const [resonance, setResonance] = useState(88.4);
  const [telemetryState, setTelemetryState] = useState("STABLE_ALIGNMENT");

  // Keyboard mapping
  const keyboardKeys = ["A", "S", "D", "F", "G", "H", "J", "K"];

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      setUtcTime(`${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}:UTC_STB`);
    };
    updateTime();
    const subInterval = setInterval(updateTime, 1000);
    return () => clearInterval(subInterval);
  }, []);

  // Sync state & presets from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem("vibe_sandbox_notes");
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error("Could not parse saved notes", e);
      }
    }
  }, []);

  // Save notes to localStorage
  const saveNotesToStorage = (updatedNotes: NoteEntry[]) => {
    setNotes(updatedNotes);
    localStorage.setItem("vibe_sandbox_notes", JSON.stringify(updatedNotes));
  };

  // Telemetry fluctuation effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying) {
        setResonance(prev => {
          const delta = (Math.random() - 0.5) * 1.5;
          const next = Math.max(78, Math.min(99.6, Number((prev + delta).toFixed(1))));
          return next;
        });

        // Toggle random telemetry tags
        const statusMsgs = ["RESONATING", "STABLE_ALIGNMENT", "SIGNAL_LOCKED", "HARMONIC_DILATION", "DRIFT_SYNCED"];
        setTelemetryState(statusMsgs[Math.floor(Math.random() * statusMsgs.length)]);
      } else {
        setResonance(0.0);
        setTelemetryState("SUSPENDED");
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Audio control trigger updates
  const handleVibeChange = (v: VibeType) => {
    setActiveVibe(v);
    globalSynth.changeVibe(v);
  };

  const toggleSound = () => {
    if (isPlaying) {
      globalSynth.mute();
      setIsPlaying(false);
    } else {
      globalSynth.unmute(soundParams.tempoBpm, activeVibe);
      // set starting parameters
      globalSynth.setMasterVolume(soundParams.masterVolume);
      globalSynth.setDroneVolume(soundParams.droneVolume);
      globalSynth.setNoiseVolume(soundParams.noiseVolume);
      globalSynth.setPulseVolume(soundParams.pulseVolume);
      globalSynth.setSynthVolume(soundParams.synthVolume);
      setIsPlaying(true);
    }
  };

  // Keyboard mapping dynamic trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyUpper = e.key.toUpperCase();
      const index = keyboardKeys.indexOf(keyUpper);
      if (index !== -1) {
        // Trigger a chime
        globalSynth.playNote(index);
        // Temporarily flash visual grid indicators
        const pulse = document.getElementById(`synth-pad-${index}`);
        if (pulse) {
          pulse.classList.add("scale-[1.05]");
          pulse.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
          setTimeout(() => {
            pulse.classList.remove("scale-[1.05]");
            pulse.style.backgroundColor = "";
          }, 150);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeVibe, isPlaying]);

  // Modifiers
  const updateVolume = (field: keyof SoundState, val: number) => {
    setSoundParams(prev => ({ ...prev, [field]: val }));
    if (field === "masterVolume") globalSynth.setMasterVolume(val);
    else if (field === "droneVolume") globalSynth.setDroneVolume(val);
    else if (field === "noiseVolume") globalSynth.setNoiseVolume(val);
    else if (field === "pulseVolume") globalSynth.setPulseVolume(val);
    else if (field === "synthVolume") globalSynth.setSynthVolume(val);
  };

  const updateTempo = (val: number) => {
    setSoundParams(prev => ({ ...prev, tempoBpm: val }));
    globalSynth.setTempo(val);
  };

  // Adding random visual floating notes
  const registerNewNote = (e: FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newNote: NoteEntry = {
      id: "note_" + Date.now(),
      content: newNoteText,
      color: noteColor,
      x: 10 + Math.random() * 60, // random start coordinates
      y: 15 + Math.random() * 50,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      vibe: activeVibe
    };

    const nextNotes = [...notes, newNote];
    saveNotesToStorage(nextNotes);
    setNewNoteText("");
  };

  const deleteNote = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    const nextNotes = notes.filter(n => n.id !== id);
    saveNotesToStorage(nextNotes);
  };

  // AI Creative Muse Query
  const fetchCreativeMuse = async () => {
    setIsGenerating(true);
    setMuseText("Contacting the celestial deep. Listening to background cosmic noise...");
    
    // Pick the most recent note content if available
    const lastNote = notes.filter(n => n.vibe === activeVibe).slice(-1)[0]?.content || "";

    try {
      const response = await fetch("/api/muse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vibe: activeVibe,
          contextNote: lastNote
        })
      });
      const data = await response.json();
      if (data.text) {
        setMuseText(data.text);
      } else {
        setMuseText("The circuit signal was clean, but return text was empty. Breathe deeply and tap another note.");
      }
    } catch (err) {
      console.error(err);
      setMuseText("[Offline Echo] Synchronize your heartbeat with the current pulse speed. You are looking at infinite silicon structures, dreaming.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative py-0 select-none overflow-x-hidden font-sans">
      
      {/* Dynamic Background Canvas Elements */}
      <VibeCanvas vibe={activeVibe} isMuted={!isPlaying} />

      {/* STARK BOLD TYPOGRAPHY BRUTALIST HEADER BAR */}
      <header className="flex justify-between items-center px-6 md:px-12 py-5 border-b border-white/10 relative z-30 bg-black/70 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isPlaying ? 'bg-[#FF0055]' : 'bg-neutral-600'}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isPlaying ? 'bg-[#FF0055]' : 'bg-neutral-700'}`}></span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.4em] font-black leading-none text-white/90">
              VIBE_CORE // OS 1.04
            </span>
            <span className="text-[9px] font-mono text-white/50 lowercase">
              {isPlaying ? telemetryState : "suspended.power_save"}
            </span>
          </div>
        </div>

        {/* Ambient Vibe Presets selectors */}
        <div className="flex bg-white/5 border border-white/10 rounded-full p-1 max-w-sm">
          {THEMES.map((theme) => {
            const isSelected = activeVibe === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => handleVibeChange(theme.id)}
                id={`vibe-btn-${theme.id}`}
                className={`px-3 py-1.5 rounded-full text-[10px] sm:text-xs uppercase tracking-widest font-bold transition-all duration-300 ${
                  isSelected 
                    ? "bg-white text-black shadow-lg scale-105" 
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                {theme.name}
              </button>
            );
          })}
        </div>

        {/* Timed Metadata Indicator */}
        <div className="hidden md:flex gap-8 text-right">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">NODE_ALIGN</span>
            <span className="text-xs font-mono font-medium text-white/70">77-B / RE</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">SYSTEM_CLOCK</span>
            <span className="text-xs font-mono text-white/80">{utcTime || "00:00:00:UTC"}</span>
          </div>
        </div>
      </header>

      {/* CORE HERO WORKSPACE */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 relative z-10 p-4 md:p-8 gap-6 w-full max-w-7xl mx-auto">
        
        {/* LEFT COLUMN: Stark Title Display, Visual Waves, interactive synthesizer */}
        <section className="lg:col-span-7 flex flex-col justify-between relative px-2 py-4">
          
          {/* Stark Section Index Label */}
          <div className="flex flex-col gap-1 mb-4 select-none">
            <span className="text-[11px] uppercase tracking-widest text-[#FF0055] font-black">
              01 // CONCEPTUAL_CANVAS
            </span>
            <div className="h-[2px] w-12 bg-[#FF0055]"></div>
          </div>

          {/* MASSIVE HERO brutalist TYPOGRAPHY */}
          <div className="my-auto py-8">
            <h1 className="text-[75px] sm:text-[105px] md:text-[140px] font-black leading-[0.75] tracking-[-0.06em] uppercase flex flex-col m-0 select-none">
              <span className="text-white hover:italic transition-all duration-300 cursor-default">Vibe</span>
              <span className="text-[#FF0055] -mt-2 translate-x-4 sm:translate-x-8 italic select-none">Core</span>
            </h1>
            
            <p className="mt-6 text-sm md:text-md text-white/65 max-w-md font-sans leading-relaxed">
              Generative environment for atmospheric alignment. Click background to generate sound ripples, customized for high-frequency vibes and structural acoustic harmony.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                id="btn-play-pause"
                onClick={toggleSound}
                className={`px-8 py-4 rounded-full flex items-center gap-3 transition-all duration-300 ${
                  isPlaying 
                    ? "bg-[#FF0055] text-white hover:bg-rose-600 scale-105 shadow-[0_0_20px_rgba(255,0,85,0.4)]" 
                    : "bg-white text-black hover:bg-neutral-200"
                }`}
              >
                {isPlaying ? (
                  <>
                    <Square size={16} fill="currentColor" />
                    <span className="text-xs uppercase tracking-[0.2em] font-black">Pause Frequency</span>
                  </>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" />
                    <span className="text-xs uppercase tracking-[0.2em] font-black">Initiate Grid</span>
                  </>
                )}
              </button>

              <button
                id="btn-vibe-random"
                onClick={() => {
                  const vibeKeys: VibeType[] = ["cosmic", "cyberpunk", "ancient_forest", "solar"];
                  const nextV = vibeKeys[(vibeKeys.indexOf(activeVibe) + 1) % vibeKeys.length];
                  handleVibeChange(nextV);
                }}
                className="px-6 py-4 border border-white/20 rounded-full text-xs uppercase tracking-widest hover:border-white hover:bg-white/5 transition-all text-white/80"
              >
                Shift Realm
              </button>
            </div>
          </div>

          {/* INTERACTIVE SYNTH NOTEPADS / GRID CONTROLLER */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Music size={14} className="text-[#FF0055]" />
                <span className="text-[11px] uppercase tracking-widest font-extrabold text-white/50">
                  Interactive Synthesizer Keyboard
                </span>
              </div>
              <span className="text-[10px] font-mono text-white/40">
                Type keys <kbd className="bg-white/10 px-1 py-0.5 rounded font-bold font-mono">A S D F G H J K</kbd> to chime
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {keyboardKeys.map((key, i) => (
                <button
                  key={key}
                  id={`synth-pad-${i}`}
                  onClick={() => globalSynth.playNote(i)}
                  className="h-16 rounded-lg glass-panel-light border border-white/10 flex flex-col justify-between p-2 hover:bg-white/10 hover:border-white/30 transition-all active:scale-95 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[10px] font-mono text-white/30 self-start">{key}</span>
                  <span className="text-[12px] font-mono font-black text-white group-hover:text-[#FF0055] self-end pt-1">
                    {activeTheme.scaleNotes[i]}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </section>

        {/* RIGHT COLUMN: Interactive Control center & Custom notes deck */}
        <section className="lg:col-span-5 flex flex-col gap-6 relative">
          
          {/* THE CONTROL MODULE CARD */}
          <div id="control-card" className="glass-panel rounded-2xl p-6 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-[#FF0055]" />
                <h3 className="text-xs uppercase tracking-[0.2em] font-black">
                  Resonance Controllers
                </h3>
              </div>
              <span className="text-[10px] font-mono select-none px-2 py-0.5 rounded bg-white/5 text-white/60">
                ACTIVE_SPECTRUM
              </span>
            </div>

            {/* Controller Sliders */}
            <div className="space-y-4">
              
              {/* Master Volume */}
              <div>
                <div className="flex justify-between items-center mb-1 text-[11px] font-mono uppercase text-white/65">
                  <span className="flex items-center gap-1">
                    <Volume2 size={12} /> Master Energy
                  </span>
                  <span>{Math.round(soundParams.masterVolume * 100)}%</span>
                </div>
                <input
                  id="slider-master-volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={soundParams.masterVolume}
                  onChange={(e) => updateVolume("masterVolume", parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF0055]"
                />
              </div>

              {/* Drone Volume */}
              <div>
                <div className="flex justify-between items-center mb-1 text-[11px] font-mono uppercase text-white/65">
                  <span>Frequency Drone</span>
                  <span>{Math.round(soundParams.droneVolume * 100)}%</span>
                </div>
                <input
                  id="slider-drone-volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={soundParams.droneVolume}
                  onChange={(e) => updateVolume("droneVolume", parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>

              {/* Wind / Environmental Noise Volume */}
              <div>
                <div className="flex justify-between items-center mb-1 text-[11px] font-mono uppercase text-white/65">
                  <span className="truncate">{activeTheme.noiseLabel}</span>
                  <span>{Math.round(soundParams.noiseVolume * 100)}%</span>
                </div>
                <input
                  id="slider-noise-volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={soundParams.noiseVolume}
                  onChange={(e) => updateVolume("noiseVolume", parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>

              {/* Sequencer Pulse Volume */}
              <div>
                <div className="flex justify-between items-center mb-1 text-[11px] font-mono uppercase text-white/65">
                  <span>Step Sequencer Throb</span>
                  <span>{Math.round(soundParams.pulseVolume * 100)}%</span>
                </div>
                <input
                  id="slider-pulse-volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={soundParams.pulseVolume}
                  onChange={(e) => updateVolume("pulseVolume", parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>

              {/* BPM / Sequencer speed */}
              <div>
                <div className="flex justify-between items-center mb-1 text-[11px] font-mono uppercase text-white/65">
                  <span>Pulses Speed (BPM)</span>
                  <span>{soundParams.tempoBpm} BPM</span>
                </div>
                <input
                  id="slider-tempo"
                  type="range"
                  min="60"
                  max="170"
                  step="1"
                  value={soundParams.tempoBpm}
                  onChange={(e) => updateTempo(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF0055]"
                />
              </div>

            </div>
          </div>

          {/* VIBE WRITEBACK NOTEBOOK / DIARY DECK */}
          <div id="vibe-logs-card" className="glass-panel rounded-2xl p-6 border border-white/10 flex-1 flex flex-col min-h-[220px]">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-[#FF0055]" />
                <h3 className="text-xs uppercase tracking-[0.2em] font-black">
                  Thought Logbook
                </h3>
              </div>
              <span className="text-[10px] font-mono text-white/40">
                {notes.filter(n => n.vibe === activeVibe).length} logs stored
              </span>
            </div>

            {/* Note Entry Creation Form */}
            <form onSubmit={registerNewNote} className="mb-4">
              <div className="flex gap-2">
                <input
                  id="input-new-note"
                  type="text"
                  placeholder="Record an ephemeral vintage feeling..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  maxLength={120}
                  className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-xs border border-white/10 focus:outline-none focus:border-[#FF0055] text-white"
                />
                
                {/* Visual Note Color selectors */}
                <select
                  id="select-note-color"
                  value={noteColor}
                  onChange={(e) => setNoteColor(e.target.value)}
                  className="bg-[#0f172a] text-xs px-2 py-1 rounded border border-white/10 text-white cursor-pointer"
                >
                  <option value="#FF0055">Crimson</option>
                  <option value="#06b6d4">Cyan</option>
                  <option value="#10b981">Green</option>
                  <option value="#f97316">Orange</option>
                  <option value="#a855f7">Purple</option>
                </select>

                <button
                  id="btn-add-note"
                  type="submit"
                  className="bg-white text-black px-3 rounded-lg text-xs hover:bg-neutral-200 transition-colors"
                >
                  Pin
                </button>
              </div>
            </form>

            {/* Real Scrollable Logs view */}
            <div className="flex-1 overflow-y-auto max-h-[170px] space-y-2 pr-1">
              {notes.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-center p-6 text-white/40 border border-dashed border-white/5 rounded-lg">
                  <span className="text-xs">No entries are pinned to this sandbox.</span>
                  <span className="text-[10px] uppercase tracking-wider mt-1">Record your first thought above</span>
                </div>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    id={`note-item-${note.id}`}
                    className="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/25 transition-all text-xs flex flex-col justify-between gap-1 relative group"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <p className="font-sans text-white/80 leading-relaxed word-break whitespace-pre-wrap">{note.content}</p>
                      
                      <button
                        onClick={(e) => deleteNote(note.id, e)}
                        className="text-white/30 hover:text-rose-500 scale-90 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete log"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="flex justify-between items-center mt-2 text-[9px] font-mono text-white/40">
                      <span className="flex items-center gap-1 uppercase">
                        <span className="font-bold uppercase tracking-wider" style={{ color: note.color }}>
                          ● {note.vibe}
                        </span>
                      </span>
                      <span>{note.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </section>

      </main>

      {/* FOOTER SECTION: Dynamic Modular Grid containing Telemetry statistics, Visualizers and the GEMINI AI MUSE */}
      <footer className="mt-8 border-t border-white/10 relative z-10 z-20 bg-black/80 backdrop-blur-md">
        
        {/* Dynamic Gemini Oracle Panel */}
        <div className="px-6 md:px-12 py-5 border-b border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <Sparkles size={18} className="text-[#FF0055] shrink-0" />
            <div className="text-left">
              <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/50 leading-none mb-1">
                Gemini AI Creative Companion
              </h4>
              <p className="text-xs text-white/80 font-mono italic leading-relaxed max-w-2xl bg-black/10 p-1 rounded-lg border border-white/5">
                "{museText}"
              </p>
            </div>
          </div>
          
          <button
            id="btn-generate-insight"
            onClick={fetchCreativeMuse}
            disabled={isGenerating}
            className="w-full md:w-auto px-6 py-2.5 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-full hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 disabled:bg-neutral-600 disabled:text-neutral-400"
          >
            <RefreshCw size={12} className={isGenerating ? "animate-spin" : ""} />
            <span>Generate Aesthetic Insight</span>
          </button>
        </div>

        {/* Modular telemetry grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 select-none">
          
          <div className="border-r border-b md:border-b-0 border-white/10 p-6 flex flex-col justify-between gap-4">
            <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Resonance Integrity</span>
            <div className="flex flex-col gap-2">
              <div className="h-1 bg-[#FF0055] w-full rounded-sm" />
              <div className="h-1 bg-white/20 w-3/4 rounded-sm" />
              <div className="h-1 bg-white/25 w-1/2 rounded-sm" />
            </div>
            <span className="text-2xl font-black font-sans leading-none">{isPlaying ? resonance : "0.0"}%</span>
          </div>

          <div className="border-r border-b md:border-b-0 border-white/10 p-6 flex flex-col justify-between gap-4">
            <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Frequency Node</span>
            <div className="flex flex-col gap-1 text-white/50 font-mono text-xs">
              <div className="flex justify-between">
                <span>ACTIVE_REALM:</span>
                <span className="font-bold text-white">{activeVibe.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span>SCALETYPE:</span>
                <span className="text-white">{activeTheme.scaleType}</span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold uppercase text-white/80 tracking-wider">
              {isPlaying ? "DRONE_OSCILLATION_LIVE" : "DRONE_MUTED"}
            </span>
          </div>

          <div className="border-r border-b md:border-b-0 border-white/10 p-6 flex flex-col justify-between gap-4">
            <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Telemetry status</span>
            <div className="text-2xl font-light italic text-white/80 flex items-center gap-2">
              <Radio size={16} className={isPlaying ? "animate-pulse text-[#FF0055]" : "text-neutral-600"} />
              <span className="font-display font-black tracking-tight">{isPlaying ? telemetryState : "OFFLINE"}</span>
            </div>
            <div className="flex gap-1">
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-[#FF0055]' : 'bg-neutral-800'}`}></div>
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-[#FF0055]/50' : 'bg-neutral-800'}`}></div>
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-[#FF0055]/20' : 'bg-neutral-800'}`}></div>
            </div>
          </div>

          <div className="p-6 flex flex-col justify-between items-end gap-3 text-right">
            <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">System proprietary v1.0</span>
            <div className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white/5 cursor-pointer transition-colors">
              <div className="w-2 h-2 bg-[#FF0055] rotate-45 animate-pulse"></div>
            </div>
            <span className="text-[10px] font-mono text-white/30 uppercase">
              aligned_harmony_ready
            </span>
          </div>

        </div>

        {/* Tiny Side Branding bar rotated */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 px-2 select-none pointer-events-none hidden xl:block">
          <div className="text-[8px] uppercase tracking-[0.5em] text-white/20 transform rotate-180" style={{ writingMode: "vertical-rl" }}>
            VIBE_CORE_LABS_2026 // RESONATING TRUTH
          </div>
        </div>
      </footer>

    </div>
  );
}

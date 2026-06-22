import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialize Gemini client
let ai: GoogleGenAI | null = null;
function getGemini() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. AI features will fallback to offline aesthetic statements.");
      return null;
    }
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

// Creative Muse / AI Inspiration endpoint
app.post("/api/muse", async (req, res) => {
  const { vibe, element, contextNote } = req.body;

  const client = getGemini();
  if (!client) {
    // Elegant fallbacks if Gemini API Key isn't provided yet
    const fallbacks: Record<string, string[]> = {
      cosmic: [
        "Empty your thoughts and listen to the cold resonance of simulated stars. What words would you send to a signal that takes a thousand years to reply?",
        "You are a quiet observer at the edge of the universe. Record a fragment of your memory on a sticky note and let it drift.",
        "The digital silence is a canvas. Allow the drone of the nebula to frame your current reflection."
      ],
      cyberpunk: [
        "Rain slicked cables hum with electric dreams. Write down a fragment of code, a secret, or a slogan on a virtual note.",
        "In the neon-washed shadows of the lower circuit, you are completely anonymous. What confession do you want to archive?",
        "The rhythm beats like a synthesized pulse. Use this momentum to sketch out an abstract plan for tomorrow's terminal run."
      ],
      ancient_forest: [
        "In this digital grove, moss grows over cold silicon. Breathe along with the wind's gentle, slow frequency. What does the silence ask of you?",
        "Moss remembers what the sky forgot. Leave a quiet, green thought here for future travelers.",
        "The leaves rustle in algorithmic harmony. Jot down what you are holding onto, then delete it, or leave it to rest."
      ],
      solar: [
        "Warm vintage grit fills your sensory field. The sun flare rises—remember a warm July afternoon and describe its texture.",
        "Glow with the expansion of high energy chords. What action can you take today that radiates warmth toward another person?",
        "Bask in the golden noise. Let your ideas expand like hot plasma. Pin down a solar dream."
      ]
    };

    const list = fallbacks[vibe] || fallbacks.cosmic;
    const randomFallback = list[Math.floor(Math.random() * list.length)];
    return res.json({ text: `[Aesthetic Backup Guide] ${randomFallback}` });
  }

  try {
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are a creative muse, philosophical companion, and artistic storyteller for a sound and visual meditative space called "Vibe Sandbox".
The user is currently immersed in the vibe: "${vibe}" (representing ${
        vibe === 'cosmic' ? 'deep space, endless stars, celestial dark, cosmic ambient' : 
        vibe === 'cyberpunk' ? 'rainy neon alleys, computer terminals, synth retro-future, chrome' : 
        vibe === 'ancient_forest' ? 'thick moss, whispering leaves, organic deep roots, primeval woods' : 
        'retro sun flares, warm tape saturation, golden grain, vibrant vintage beach'
      }).
They are interacting with the sound element / synth controller.
${contextNote ? `They recently wrote down this thought or diary entry in their vibe logs: "${contextNote}"` : `They are seeking a spark of creative inspiration/prompt.`}

Generate a short, atmospheric, and highly evocative prompt, query or reflection. Keep it under 3 elegant sentences.
Speak like a quiet, comforting guide, the designer of an abstract universe, or your favorite retro synthesizer enthusiast. Avoid jargon, be poetic, deep, but humble. Output only raw prose, no markdown titles.`,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI inspiration" });
  }
});

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

start();

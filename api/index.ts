import express from "express";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "20mb" }));

// Initialize Google GenAI with the recommended User-Agent for modern build platforms
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    }
  }
});

// ==========================================
// SERVER SIDE GEMINI API ENDPOINTS
// ==========================================

const handleNarrate = async (req: express.Request, res: express.Response) => {
  try {
    const { text, voice = "Kore" } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Text content is required for narration" });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured inside server credentials" });
    }

    // Convert written narrative into immersive spoken voice output in French
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Veuillez lire le texte de fiction suivant avec une intonation théâtrale, chaleureuse et captivante en français : ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice }, // 'Kore' (deep, resonant), 'Puck', etc.
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(502).json({ error: "No audio stream returned from Gemini Voice service" });
    }

    return res.json({ base64Audio });
  } catch (error: any) {
    console.error("Narration API Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate narrative voice play" });
  }
};

const handleSoundscape = async (req: express.Request, res: express.Response) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Story text is required for soundscape extraction" });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Dialogue and story text to assess: "${text}"`,
      config: {
        systemInstruction: "You are a world-class ambient sound designer and game composer specializing in Panafrican acoustic media. Analyze the text and return JSON configuration for local synth triggers and mood styles for the backdrop layer.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mood: {
              type: Type.STRING,
              description: "The stylistic emotional mood title in French (e.g., Mystique Sahélien, Brise du Baobab, Crépuscule Nomade, Battement Tribal, Techno Dakar-Future)."
            },
            musicPrompt: {
              type: Type.STRING,
              description: "An evocative brief English prompt describing matching ambient loop content, e.g. 'cinematic soft kora chords with rain and wind blowing'."
            },
            colorStyle: {
              type: Type.STRING,
              description: "Tailwind hue theme color code for background glow, hex-format (e.g. '#1e1b4b' dark indigo, '#4c1d95' purple, '#7c2d12' rust orange, '#064e3b' deep emerald)."
            },
            tempo: {
              type: Type.STRING,
              description: "Vibe tempo speed label: 'slow', 'medium' or 'fast'."
            },
            soundEffects: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of exactly 2 or 3 sound triggers matching the story description, e.g. ['river murmur', 'faraway djembe drumming', 'crickets under night canopy']."
            }
          },
          required: ["mood", "musicPrompt", "colorStyle", "tempo", "soundEffects"]
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      return res.status(502).json({ error: "No soundscape metadata generated from the analyzer" });
    }

    const output = JSON.parse(textOutput.trim());
    return res.json(output);
  } catch (error: any) {
    console.error("Soundscape Analyser API Error:", error);
    return res.status(500).json({ error: error.message || "Failed to compile background environment specifications" });
  }
};

const handleCowriter = async (req: express.Request, res: express.Response) => {
  try {
    const { text, promptType, instruction } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Reference text is required for the writing mentor" });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
    }

    let queryPrompt = "";
    if (promptType === "continue") {
      queryPrompt = `Tâche : Écris la suite immédiate et poétique du récit africain suivant. Respecte la terminologie culturelle et l'ambiance. Texte : ${text}. Instruction additionnelle : ${instruction || "aucune"}.`;
    } else if (promptType === "choices") {
      queryPrompt = `Tâche : Établis trois choix interactifs passionnants et cohérents qui s'offrent au héros à partir de la situation suivante : ${text}.`;
    } else {
      queryPrompt = `Tâche : Retravaille, embellis et enrichis le texte suivant avec des descriptions culinaires, paysagères ou de rythmes africains profonds : ${text}. Instruction : ${instruction || "le rendre plus immersif"}.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: queryPrompt,
      config: {
        systemInstruction: "Tu es Stilova-AI, un conteur et co-écrivain littéraire virtuel hautement récompensé pour ton sens des récits d'Afrofuturisme, fictions merveilleuses et drames de vie contemporains. Fournis ton retour structuré sous forme d'objet JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            writerFeedback: {
              type: Type.STRING,
              description: "Warm stylistic advisory feedback in French from the virtual co-writer (e.g. advice on suspense or word choice)."
            },
            adaptedText: {
              type: Type.STRING,
              description: "The core generated content contribution or continuation in French."
            },
            suggestedPaths: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  choiceTitle: {
                    type: Type.STRING,
                    description: "Short interactive label button, e.g. 'Traverser le fleuve à la nage'"
                  },
                  synopsisIdea: {
                    type: Type.STRING,
                    description: "Brief draft outlines of where this choice leads the reader."
                  }
                },
                required: ["choiceTitle", "synopsisIdea"]
              }
            }
          },
          required: ["writerFeedback", "adaptedText", "suggestedPaths"]
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      return res.status(502).json({ error: "No co-writing suggestions compiled" });
    }

    const output = JSON.parse(textOutput.trim());
    return res.json(output);
  } catch (error: any) {
    console.error("Co-writer API Error:", error);
    return res.status(500).json({ error: error.message || "Failed to execute co-writer feedback loop" });
  }
};

// Route support for /api/ai/*
app.post("/api/ai/narrate", handleNarrate);
app.post("/api/ai/soundscape", handleSoundscape);
app.post("/api/ai/cowriter", handleCowriter);

// Base API route support (if Vercel path mapping strips prefix)
app.post("/ai/narrate", handleNarrate);
app.post("/ai/soundscape", handleSoundscape);
app.post("/ai/cowriter", handleCowriter);

// Default status endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "alive" });
});
app.get("/api", (req, res) => {
  res.json({ status: "Stilova API operational" });
});

export default app;

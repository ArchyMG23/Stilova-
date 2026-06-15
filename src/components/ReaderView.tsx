import React, { useState, useEffect } from "react";
import { Story, StoryNode, SoundscapeState } from "../types";
import { dbService } from "../firebase";
import AudioSynthesizer from "./AudioSynthesizer";
import { getFontCssValue, getColorHex } from "../lib/typography";
import { 
  ArrowLeft, BookOpen, Volume2, Sparkles, Sliders, Type, Download, 
  Check, Play, Square, AlertTriangle, ShieldAlert, FileText, Music, RefreshCw
} from "lucide-react";

interface ReaderViewProps {
  storyId: string;
  onBack: () => void;
  userId?: string;
  isVisitor?: boolean;
  onRegisterRedirect?: () => void;
}

export default function ReaderView({ storyId, onBack, userId, isVisitor, onRegisterRedirect }: ReaderViewProps) {
  const [story, setStory] = useState<Story | null>(null);
  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [currentNode, setCurrentNode] = useState<StoryNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGuestLock, setShowGuestLock] = useState(false);

  // Styling and configuration variables
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg" | "xl">("md");
  const [fontFamily, setFontFamily] = useState<"serif" | "sans" | "mono">("serif");
  const [isSynthPlaying, setIsSynthPlaying] = useState(false);

  // Gemini state triggers
  const [atmosState, setAtmosState] = useState<SoundscapeState>({
    mood: "Attente d'analyse...",
    musicPrompt: "calm acoustic ambiance",
    colorStyle: "#0f172a", // Default slate 900
    tempo: "slow",
    soundEffects: ["vents legers"]
  });
  const [analyzingAtmos, setAnalyzingAtmos] = useState(false);

  // TTS Narrator parameters
  const [narrating, setNarrating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>("Kore"); // Kore, Puck
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);

  // Offline status
  const [isSavedOffline, setIsSavedOffline] = useState(false);
  const [savingOffline, setSavingOffline] = useState(false);

  // Reporting abuse
  const [isReported, setIsReported] = useState(false);

  // Load story and associated nodes
  useEffect(() => {
    async function loadReaderData() {
      setLoading(true);
      try {
        const activeStory = await dbService.getStory(storyId);
        if (activeStory) {
          setStory(activeStory);
          const allNodes = await dbService.listStoryNodes(storyId);
          setNodes(allNodes);

          // Locate starting root node
          const root = allNodes.find(n => n.isRoot) || allNodes[0] || null;
          setCurrentNode(root);

          // Check if saved offline
          const savedList = JSON.parse(localStorage.getItem("stilova_offline_story_ids") || "[]");
          setIsSavedOffline(savedList.includes(storyId));

          if (root) {
            // Auto trigger atmosphere analyses
            triggerAtmosAnalysis(root.content);
          }
        }
      } catch (err) {
        console.error("Reader load failed", err);
      } finally {
        setLoading(false);
      }
    }
    loadReaderData();

    return () => {
      // Cleanup all active audio playbacks on unmount
      if (activeAudio) {
        activeAudio.pause();
      }
    };
  }, [storyId]);

  // Handle active audio monitoring cleanup
  useEffect(() => {
    return () => {
      if (activeAudio) {
        activeAudio.pause();
      }
    };
  }, [activeAudio]);

  // Request Gemini soundscape parameters for the current paragraph context
  const triggerAtmosAnalysis = async (textToAnalyse: string) => {
    if (!textToAnalyse || textToAnalyse.trim().length === 0) return;
    setAnalyzingAtmos(true);

    try {
      const res = await fetch("/api/ai/soundscape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToAnalyse.slice(0, 1500) }) // Crop to fit nicely in telemetry
      });

      if (!res.ok) throw new Error("Atmos trigger failed");
      const data = await res.json();
      if (data && data.mood) {
        setAtmosState(data);
      }
    } catch (e) {
      console.warn("Could not query soundscape server. Reverting to default procedural states.", e);
    } finally {
      setAnalyzingAtmos(false);
    }
  };

  // Convert current node content into speech audio via backend Gemini Voice endpoint
  const handleTTSNarration = async () => {
    if (!currentNode?.content) return;

    if (narrating) {
      // Pause
      if (activeAudio) {
        activeAudio.pause();
      }
      setNarrating(false);
      return;
    }

    setNarrating(true);

    // If preloaded, resume play
    if (audioUrl && activeAudio) {
      activeAudio.play().catch(() => setNarrating(false));
      return;
    }

    try {
      const res = await fetch("/api/ai/narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: currentNode.content.slice(0, 1000), // Narration capped to prevent large buffers
          voice: selectedVoice 
        })
      });

      if (!res.ok) throw new Error("TTS generation failed");
      const { base64Audio } = await res.json();

      // Convert base64 into a blob URL
      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      const audio = new Audio(url);
      setActiveAudio(audio);
      
      audio.play().catch(() => setNarrating(false));
      audio.onended = () => {
        setNarrating(false);
      };
    } catch (err) {
      console.error("Narration failed", err);
      alert("La narration vocale en ligne n'a pas pu aboutir. Vérifiez que votre serveur Express et vos clés secrètes sont configurés.");
      setNarrating(false);
    }
  };

  // Switch nodes when a user clicks a branch action
  const handleNodeNavigation = (nextNodeId: string) => {
    const nextNode = nodes.find(n => n.id === nextNodeId);
    if (nextNode) {
      // Reset voice
      if (activeAudio) activeAudio.pause();
      setAudioUrl(null);
      setActiveAudio(null);
      setNarrating(false);

      setCurrentNode(nextNode);
      triggerAtmosAnalysis(nextNode.content);
    }
  };

  // Save the entire story and tree nodes locally for offline review
  const handleSaveOffline = () => {
    if (!story) return;
    setSavingOffline(true);

    setTimeout(() => {
      try {
        const savedIds = JSON.parse(localStorage.getItem("stilova_offline_story_ids") || "[]");
        if (!savedIds.includes(storyId)) {
          savedIds.push(storyId);
          localStorage.setItem("stilova_offline_story_ids", JSON.stringify(savedIds));
        }

        // Cache the story details
        const offlineStories = JSON.parse(localStorage.getItem("stilova_cache_offline_stories") || "[]");
        if (!offlineStories.some((s: Story) => s.id === storyId)) {
          offlineStories.push(story);
          localStorage.setItem("stilova_cache_offline_stories", JSON.stringify(offlineStories));
        }

        // Cache all nodes
        localStorage.setItem(`stilova_offline_nodes_${storyId}`, JSON.stringify(nodes));

        setIsSavedOffline(true);
      } catch (err) {
        console.error("Offline cache failed", err);
      } finally {
        setSavingOffline(false);
      }
    }, 800);
  };

  // Report Story for Moderator Review
  const handleReportStory = async () => {
    if (!story) return;
    try {
      const updatedStory = { ...story, reported: true };
      await dbService.saveStory(updatedStory);
      setStory(updatedStory);
      setIsReported(true);
    } catch (e) {
      console.warn("Firebase reporting bypassed. Syncing internally.", e);
      setIsReported(true);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center p-20 min-h-[400px]">
        <RefreshCw className="w-10 h-10 text-amber-500 animate-spin" />
        <span className="font-sans font-medium text-xs text-slate-400">Ouverture de l'univers immersif...</span>
      </div>
    );
  }

  if (!story || !currentNode) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center gap-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <p className="text-slate-300 font-sans text-xs">Cette histoire n'existe pas ou ne possède aucun texte de départ.</p>
        <button onClick={onBack} className="bg-slate-800 text-slate-100 px-4 py-2 rounded-xl text-xs">Retour</button>
      </div>
    );
  }

  const fontSizes = {
    sm: "text-sm sm:text-base leading-relaxed",
    md: "text-base sm:text-lg leading-relaxed",
    lg: "text-lg sm:text-xl leading-relaxed",
    xl: "text-xl sm:text-2xl leading-relaxed"
  };

  const fonts = {
    serif: "font-serif tracking-normal font-normal",
    sans: "font-sans tracking-tight font-medium",
    mono: "font-mono tracking-normal text-slate-300"
  };

  return (
    <div 
      className="flex flex-col gap-8 w-full max-w-4xl mx-auto px-4 pb-20 transition-all duration-700 rounded-3xl"
      style={{
        background: `radial-gradient(100% 70% at 50% 0%, ${atmosState.colorStyle}33 0%, transparent 100%)`
      }}
    >
      {/* Immersive Header Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-900 pb-4">
        
        {/* Leaving Reader */}
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-xs font-bold transition curser-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" /> En amont la bibliothèque
        </button>

        {/* Sync Controls & Features */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end self-end sm:self-auto">
          {/* Real-time soundscape analysis indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-[10px]">
            <Sparkles className={`w-3.5 h-3.5 text-amber-500 ${analyzingAtmos ? "animate-spin" : ""}`} />
            <span>{analyzingAtmos ? "Analyse Gemini..." : `Mode: ${atmosState.mood}`}</span>
          </div>

          {/* Voice parameters selection */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-850 rounded-lg">
            <Sliders className="w-3 h-3 text-slate-500 ml-1" />
            <select
              value={selectedVoice}
              onChange={(e) => {
                setSelectedVoice(e.target.value);
                setAudioUrl(null); // Clear buffer
              }}
              className="bg-transparent text-[10px] text-slate-300 outline-none cursor-pointer border-none py-0.5 font-sans"
              title="Sélectionner la voix de narration"
            >
              <option value="Kore">Ton Expressif (Kore)</option>
              <option value="Puck">Clair (Puck)</option>
              <option value="Zephyr">Profond (Zephyr)</option>
            </select>
          </div>

          {/* Save Offline */}
          <button
            onClick={handleSaveOffline}
            disabled={isSavedOffline || savingOffline}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
              isSavedOffline 
                ? "bg-green-500/10 border border-green-500/30 text-green-400" 
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
            }`}
          >
            {savingOffline ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : isSavedOffline ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isSavedOffline ? "Gardé dans le stylet" : "Sauvegarder hors-ligne"}</span>
          </button>
        </div>
      </div>

      {/* Main Column */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Main story book */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] tracking-widest text-amber-500 font-mono font-bold uppercase tracking-[0.25em]">
              UNIVERS NARRATIF : {story.genre}
            </span>
            <h1 
              className="text-3xl md:text-5xl text-white tracking-tight leading-tight transition-all duration-300 font-extrabold"
              style={{
                fontFamily: story.title_font ? getFontCssValue(story.title_font) : "inherit",
                fontWeight: story.title_font_weight === "normal" ? "400" : story.title_font_weight === "medium" ? "500" : story.title_font_weight === "bold" ? "700" : story.title_font_weight === "extrabold" ? "800" : "800"
              }}
            >
              {story.title}
            </h1>
            <span 
              className="text-xs text-slate-400 italic mb-2 transition-all duration-300"
              style={{
                fontFamily: story.title_font ? getFontCssValue(story.title_font) : "inherit"
              }}
            >
              Une œuvre de {story.authorName} • {currentNode.title}
            </span>
          </div>

          {/* Reader Core Content Window Layout */}
          <div className="border border-slate-750 rounded-sm p-6 md:p-10 bg-slate-900 shadow-2xl relative min-h-[300px]">
            {/* Elegant Background chapter watermark (Artistic Flair spec) */}
            <div className="absolute top-0 right-4 p-4 opacity-10 font-serif text-[120px] leading-none pointer-events-none select-none text-slate-500">
              {currentNode.isRoot ? "01" : "§"}
            </div>

            {/* Backdrop glow */}
            <div 
              className="absolute inset-x-0 top-0 h-1 border-t border-slate-700/10 filter blur"
              style={{ background: atmosState.colorStyle }}
            />

            <div className={`text-slate-100 select-text font-serif space-y-4 ${fonts[fontFamily]} ${fontSizes[fontSize]}`}>
              {currentNode.content.split("\n").filter(paragraph => paragraph.trim().length > 0).map((paragraph, idx) => {
                if (idx === 0 && paragraph.trim().length > 2) {
                  return (
                    <p key={idx} className="leading-relaxed first-letter:float-left first-letter:text-4xl first-letter:font-bold first-letter:text-amber-500 first-letter:mr-2.5 first-letter:font-serif first-letter:mt-1 first-letter:leading-none">
                      {paragraph.trim()}
                    </p>
                  );
                }
                return (
                  <p key={idx} className="leading-relaxed">
                    {paragraph.trim()}
                  </p>
                );
              })}

              {/* Elegant Signature d’auteur */}
              {story.auto_signature_enabled && (
                <div 
                  className="border-t border-slate-900/40 mt-8 pt-5 select-none"
                  style={{
                    textAlign: (currentNode.custom_signature ? currentNode.custom_signature_alignment : story.signature_alignment) || "right" as any
                  }}
                >
                  {currentNode.custom_signature ? (
                    // Customized signature for this node/chapter
                    <div 
                      className="inline-block"
                      style={{ 
                        fontFamily: getFontCssValue(currentNode.custom_signature_font || "Great Vibes"),
                        color: getColorHex(currentNode.custom_signature_color || "amber-500")
                      }}
                    >
                      {currentNode.custom_signature.split("\n").map((line, idx) => (
                        <span 
                          key={idx} 
                          className={`${idx === 0 ? "text-lg sm:text-2xl italic font-medium" : "text-sm font-semibold opacity-90 block mt-1"}`}
                        >
                          {line}
                        </span>
                      ))}
                    </div>
                  ) : (
                    // Generic Auto Signature template
                    <div 
                      className="inline-block"
                      style={{ 
                        fontFamily: getFontCssValue(story.signature_font || "Great Vibes"),
                        color: getColorHex(story.signature_color || "amber-500")
                      }}
                    >
                      {(story.default_signature || `Merci d'avoir lu ce chapitre.\n— ${story.authorName}`).split("\n").map((line, idx) => (
                        <span 
                          key={idx} 
                          className={`${idx === 0 ? "text-lg sm:text-2xl italic font-medium" : "text-sm font-semibold opacity-90 block mt-1"}`}
                        >
                          {line}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* LEAF / BRANCH SELECTION BLOCK */}
            <div className="border-t border-slate-900 mt-10 pt-6 flex flex-col gap-3">
              {showGuestLock ? (
                <div id="guest-lock-card" className="text-center p-6 bg-slate-950 border border-amber-500/40 rounded-none flex flex-col items-center gap-3 animate-fade-in">
                  <ShieldAlert className="w-8 h-8 text-amber-500" />
                  <span className="text-sm font-serif italic text-amber-400 font-bold">📖 Chapitre suivant verrouillé</span>
                  <p className="text-[11px] text-slate-300 max-w-md leading-relaxed">
                    Stilova est une œuvre d'art littéraire interactive. Pour graver vos propres décisions dans cette histoire et explorer d'autres embranchements de l'Afrique des récits, rejoignez gratuitement le cercle de Stilova dès maintenant !
                  </p>
                  <div className="flex gap-2.5 mt-2">
                    <button 
                      onClick={() => setShowGuestLock(false)}
                      className="border border-slate-800 text-slate-400 px-4 py-2 hover:bg-slate-850 hover:text-slate-200 transition rounded-none text-xs"
                    >
                      Rester ici
                    </button>
                    <button 
                      onClick={() => {
                        if (onRegisterRedirect) {
                          onRegisterRedirect();
                        }
                      }}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-5 py-2 transition rounded-none text-xs uppercase tracking-widest"
                    >
                      Créer un compte
                    </button>
                  </div>
                </div>
              ) : currentNode.choices && currentNode.choices.length > 0 ? (
                <>
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                    Qu'allez-vous décider de graver ensuite ? (Embranchements)
                  </span>
                  <div className="flex flex-col md:flex-row gap-3">
                    {currentNode.choices.map((choice, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (isVisitor) {
                            setShowGuestLock(true);
                          } else {
                            handleNodeNavigation(choice.nextNodeId);
                          }
                        }}
                        className="flex-1 bg-slate-900 hover:bg-slate-850 hover:border-amber-500 border border-slate-755 text-left px-5 py-4 rounded-none text-xs text-slate-100 font-sans leading-snug cursor-pointer transition transform active:scale-[0.99] hover:shadow-lg hover:shadow-amber-500/5"
                      >
                        <div className="text-[10px] text-amber-500 font-mono font-bold mb-1 uppercase tracking-wider">Choix {index + 1}</div>
                        <div>{choice.text}</div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center p-6 bg-slate-900 border border-slate-755 rounded-none flex flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">🍂 Fin de cet embranchement littéraire</span>
                  <p className="text-[11px] text-slate-500 max-w-sm leading-relaxed">
                    Ce manuscrit interactif se termine provisoirement ici. Choisissez une autre œuvre ou proposez une suite pour concourir !
                  </p>
                  <button 
                    onClick={onBack}
                    className="bg-amber-500 text-black font-extrabold px-5 py-2.5 rounded-none text-xs mt-1 uppercase tracking-widest transition duration-300 hover:bg-amber-400"
                  >
                    Retourner à l'Afrique des récits
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Reader Footer Controls */}
          <div className="flex items-center justify-between border-t border-slate-900 pt-4 px-2">
            
            {/* Quick Layout Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setFontSize("sm")}
                  className={`px-2 py-1 text-xs rounded transition ${fontSize === "sm" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400"}`}
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize("md")}
                  className={`px-2 py-1 text-xs rounded transition ${fontSize === "md" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400"}`}
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize("lg")}
                  className={`px-2 py-1 text-xs rounded transition ${fontSize === "lg" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400"}`}
                >
                  A+
                </button>
              </div>

              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg">
                <button
                  onClick={() => setFontFamily("serif")}
                  className={`px-2 py-1 text-xs rounded transition font-serif ${fontFamily === "serif" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400"}`}
                >
                  Serif
                </button>
                <button
                  onClick={() => setFontFamily("sans")}
                  className={`px-2 py-1 text-xs rounded transition font-sans ${fontFamily === "sans" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400"}`}
                >
                  Sans
                </button>
              </div>
            </div>

            {/* Moderation / Abuse report trigger */}
            <div>
              <button
                onClick={handleReportStory}
                disabled={isReported}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition ${
                  isReported 
                    ? "bg-red-950/20 border border-red-900/30 text-red-400" 
                    : "text-slate-500 hover:text-red-400"
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>{isReported ? "Contenu signalé (sous enquête)" : "Signaler le récit"}</span>
              </button>
            </div>

          </div>
        </div>

        {/* Sidebar panels */}
        <div className="flex flex-col gap-6">
          
          {/* Narrator Voice Engine Control Card */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
              <Volume2 className="w-5 h-5 text-amber-500 animate-pulse" />
              <span className="font-sans font-bold text-slate-100 text-sm">Le Conteur vocal (Narration)</span>
            </div>

            <p className="text-[11px] text-slate-400 font-sans leading-normal leading-relaxed">
              Détendez-vous et écoutez l'audio en direct. Élaboré par synthèse neuronale par Gemini, lisant poétiquement le texte en français.
            </p>

            <button
              onClick={handleTTSNarration}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold font-sans text-xs flex items-center justify-center gap-2 cursor-pointer transition duration-300 ${
                narrating 
                  ? "bg-red-500/20 border border-red-500 text-red-400 hover:bg-red-500/30" 
                  : "bg-amber-550 text-slate-950 hover:bg-amber-400 scale-102 hover:scale-105"
              }`}
            >
              {narrating ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Mettre la voix sur pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>🔊 Écouter ce chapitre</span>
                </>
              )}
            </button>

            {audioUrl && (
              <div className="flex items-center gap-2 justify-center bg-slate-950 border border-slate-850 p-2.5 rounded-xl">
                <Music className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[9px] text-slate-400 font-mono">Lecteur audio chargé (24kHz)</span>
              </div>
            )}
          </div>

          {/* Local Procedural Synthesizer Control */}
          <AudioSynthesizer 
            genre={story.genre} 
            tempo={atmosState.tempo as any} 
            isPlaying={isSynthPlaying} 
            onTogglePlay={setIsSynthPlaying} 
          />

          {/* Soundscape details */}
          <div className="bg-slate-900/60 p-4 rounded-3xl border border-slate-850 flex flex-col gap-2.5">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Dossier Acoustique</span>
            </div>
            <ul className="text-[10px] text-slate-400 flex flex-col gap-1.5 font-sans leading-relaxed list-disc list-inside">
              <li><strong>Rythme :</strong> {atmosState.tempo}</li>
              <li><strong>Ambiance :</strong> {atmosState.mood}</li>
              <li>
                <strong>Bruitages détectés :</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {atmosState.soundEffects.map((eff, i) => (
                    <span key={i} className="bg-slate-950/80 px-2 py-0.5 rounded text-amber-500 border border-slate-800">
                      {eff}
                    </span>
                  ))}
                </div>
              </li>
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
}

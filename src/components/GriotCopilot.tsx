import React, { useState } from "react";
import { Sparkles, ArrowRight, RefreshCw, AlertCircle, Copy, Check } from "lucide-react";

interface ChoiceSuggestion {
  choiceTitle: string;
  synopsisIdea: string;
}

interface CoWriterResponse {
  writerFeedback: string;
  adaptedText: string;
  suggestedPaths: ChoiceSuggestion[];
}

interface GriotCopilotProps {
  currentText: string;
  onApplyText: (newText: string) => void;
  onApplyChoices?: (choices: { text: string; nextNodeId: string }[]) => void;
}

export default function GriotCopilot({ currentText, onApplyText, onApplyChoices }: GriotCopilotProps) {
  const [promptType, setPromptType] = useState<"continue" | "improve" | "choices">("continue");
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CoWriterResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAskGriot = async () => {
    if (!currentText || currentText.trim().length < 5) {
      setError("Veuillez saisir au moins un paragraphe court dans votre éditeur avant d'invoquer le Co-Écrivain.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/ai/cowriter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: currentText,
          promptType,
          instruction
        })
      });

      if (!response.ok) {
        throw new Error("Le serveur Stilova-AI n'a pas répondu favorablement.");
      }

      const data = await response.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Impossible de joindre le service de co-écriture. Vérifiez vos clés secrètes.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.adaptedText) {
      navigator.clipboard.writeText(result.adaptedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
          <h3 className="font-sans font-bold text-slate-100">Le Stylet d'Or AI — Copilote</h3>
        </div>
        <span className="text-[10px] bg-amber-550/10 text-amber-500 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-mono font-medium">
          @gemini-3.5
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-slate-400 font-semibold">Mode d'aide du Co-Écrivain AI :</label>
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => { setPromptType("continue"); setResult(null); }}
            className={`py-2 text-xs rounded-lg transition-all ${promptType === "continue" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"}`}
          >
            Continuer le récit
          </button>
          <button
            type="button"
            onClick={() => { setPromptType("improve"); setResult(null); }}
            className={`py-2 text-xs rounded-lg transition-all ${promptType === "improve" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"}`}
          >
            Enrichir le style
          </button>
          <button
            type="button"
            onClick={() => { setPromptType("choices"); setResult(null); }}
            className={`py-2 text-xs rounded-lg transition-all ${promptType === "choices" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"}`}
          >
            Générer des choix
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-slate-400 font-semibold">Instructions de style (Optionnel) :</label>
        <input
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder={
            promptType === "continue" 
              ? "Ex: Ajouter du suspense, introduire de la pluie tropicale..." 
              : promptType === "improve" 
              ? "Ex: Rendre les métaphores plus mandingues, ajouter de la rythmique..." 
              : "Ex: Un choix héroïque, un choix d'infiltration..."
          }
          className="bg-slate-950 border border-slate-850 px-3.5 py-2.5 rounded-xl text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-slate-600 font-sans"
        />
      </div>

      <button
        onClick={handleAskGriot}
        disabled={loading}
        className="w-full bg-gradient-to-r from-amber-550 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-xs transition duration-250 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
            <span>Consultation des esprits littéraires...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Demander l'inspiration à l'AI</span>
          </>
        )}
      </button>

      {/* ERROR HANDLER DISPLAY */}
      {error && (
        <div className="bg-red-950/40 border border-red-900 text-red-300 p-3.5 rounded-xl text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* RESULTS DISPLAY */}
      {result && (
        <div className="flex flex-col gap-4 border-t border-slate-800 pt-4 animate-fade-in">
          {result.writerFeedback && (
            <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-2xl">
              <div className="text-[10px] text-amber-500 tracking-wide font-bold uppercase mb-1">Le Conseil du Sage :</div>
              <p className="text-slate-300 text-xs leading-relaxed font-sans italic">
                "{result.writerFeedback}"
              </p>
            </div>
          )}

          {result.adaptedText && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Proposition de plume rédigée :</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="p-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                    title="Copier le texte"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => onApplyText(result.adaptedText)}
                    className="text-[10px] text-slate-950 bg-green-400 hover:bg-green-300 font-bold px-2 rounded flex items-center gap-1 transition"
                  >
                    Appliquer à l'éditeur <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl max-h-48 overflow-y-auto text-slate-200 text-xs leading-relaxed font-sans whitespace-pre-wrap">
                {result.adaptedText}
              </div>
            </div>
          )}

          {result.suggestedPaths && result.suggestedPaths.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-semibold">Idées de choix générées :</span>
                {onApplyChoices && (
                  <button
                    onClick={() => {
                      const formalChoices = result.suggestedPaths.map((p, idx) => ({
                        text: p.choiceTitle,
                        nextNodeId: `node_gen_${Date.now()}_${idx}`
                      }));
                      onApplyChoices(formalChoices);
                    }}
                    className="text-[10px] text-slate-950 bg-amber-450 hover:bg-amber-400 font-bold px-2.5 py-1 rounded transition"
                  >
                    Assigner ces choix
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {result.suggestedPaths.map((path, idx) => (
                  <div key={idx} className="bg-slate-950/60 border border-slate-850 p-3 rounded-xl flex flex-col gap-1 hover:border-slate-800">
                    <div className="text-xs font-bold text-amber-400">
                      → {path.choiceTitle}
                    </div>
                    <p className="text-[11px] text-slate-400 font-serif leading-normal">
                      {path.synopsisIdea}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Story, UserProfile, AuditLog } from "../types";
import { dbService } from "../firebase";
import { 
  BookOpen, Star, Sparkles, MessageSquare, BookMarked,CheckCircle, 
  Trash2, Send, Bookmark, Heart, Award, ArrowUpRight
} from "lucide-react";

interface EditorialPanelProps {
  stories: Story[];
  onRefreshStories: () => void;
  currentUser: UserProfile;
}

interface SimulatedAnnotation {
  id: string;
  storyId: string;
  storyTitle: string;
  editorName: string;
  text: string;
  category: "correction" | "annotation" | "critique" | "selection";
  createdAt: string;
}

export default function EditorialPanel({ stories, onRefreshStories, currentUser }: EditorialPanelProps) {
  const [activeTab, setActiveTab] = useState<"relire" | "selections" | "critiques">("relire");
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  
  // Annotation states
  const [annotations, setAnnotations] = useState<SimulatedAnnotation[]>([]);
  const [newAnnotationText, setNewAnnotationText] = useState("");
  const [annotationCategory, setAnnotationCategory] = useState<"correction" | "annotation" | "critique" | "selection">("annotation");

  useEffect(() => {
    loadEditorialData();
  }, [stories]);

  const loadEditorialData = () => {
    // Load local stored annotations
    const saved = localStorage.getItem("stilova_editor_annotations");
    if (saved) {
      setAnnotations(JSON.parse(saved));
    } else {
      const initial: SimulatedAnnotation[] = [
        {
          id: "ann_1",
          storyId: stories[0]?.id || "mock_1",
          storyTitle: stories[0]?.title || "L'Aube des Empires Guerriers",
          editorName: "Amara Seye (Éditeur)",
          text: "Le style narratif du premier chapitre est excellent, mais la transition temporelle mériterait d'être plus douce.",
          category: "annotation",
          createdAt: new Date().toISOString()
        }
      ];
      setAnnotations(initial);
      localStorage.setItem("stilova_editor_annotations", JSON.stringify(initial));
    }
  };

  // Recommendations and featured state triggers
  const handleToggleFeature = async (story: Story) => {
    try {
      const updated: Story = {
        ...story,
        isFeatured: !story.isFeatured,
        updatedAt: new Date().toISOString()
      };
      await dbService.saveStory(updated);
      
      // Save log
      await dbService.saveAuditLog({
        id: "log_" + Date.now(),
        action: updated.isFeatured ? "PROMOTION_EDITEUR" : "RETRAIT_PROMOTION",
        performedBy: currentUser.uid,
        performedByName: currentUser.displayName,
        targetUserId: story.authorId,
        targetUserName: story.authorName,
        details: `Recommandation éditoriale : l'œuvre "${story.title}" a été ${updated.isFeatured ? "mise en valeur" : "retirée des sélections"}.`,
        timestamp: new Date().toISOString()
      });

      onRefreshStories();
    } catch (e) {
      console.error("Failed to toggle feature:", e);
    }
  };

  const submitAnnotation = () => {
    if (!selectedStory || !newAnnotationText.trim()) return;

    const newAnn: SimulatedAnnotation = {
      id: "ann_" + Date.now(),
      storyId: selectedStory.id,
      storyTitle: selectedStory.title,
      editorName: currentUser.displayName || "Éditeur Stilova",
      text: newAnnotationText.trim(),
      category: annotationCategory,
      createdAt: new Date().toISOString()
    };

    const updated = [newAnn, ...annotations];
    setAnnotations(updated);
    localStorage.setItem("stilova_editor_annotations", JSON.stringify(updated));
    setNewAnnotationText("");

    // Audit log
    dbService.saveAuditLog({
      id: "log_" + Date.now(),
      action: "ANNOTATION_EDITEUR",
      performedBy: currentUser.uid,
      performedByName: currentUser.displayName,
      targetUserId: selectedStory.authorId,
      targetUserName: selectedStory.authorName,
      details: `Critique/annotation de type [${annotationCategory}] publiée sur "${selectedStory.title}".`,
      timestamp: new Date().toISOString()
    });
  };

  const deleteAnnotation = (id: string) => {
    const filtered = annotations.filter(a => a.id !== id);
    setAnnotations(filtered);
    localStorage.setItem("stilova_editor_annotations", JSON.stringify(filtered));
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1440px] mx-auto px-4 pb-16 animate-fade-in">
      
      {/* Editorial Header */}
      <div className="bg-gradient-to-r from-slate-900 via-[#182245]/20 to-transparent p-6 rounded-3xl border border-slate-805 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <BookMarked className="w-8 h-8 text-amber-500" />
          </div>
          <div className="text-left">
            <span className="text-[10px] bg-amber-500/15 border border-amber-500/30 text-amber-500 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
              Comité Éditorial Stilova
            </span>
            <h2 className="font-sans font-extrabold text-slate-100 text-lg md:text-2xl mt-1">
              Pupitres de Relecture & Sélection Gérant
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5 max-w-2xl leading-relaxed">
              En tant que responsable de la ligne éditoriale, relisez les manuscrits, apposez des annotations critiques et propulsez les œuvres d'excellence au sommet du catalogue.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto pb-px">
        <button
          onClick={() => { setActiveTab("relire"); setSelectedStory(null); }}
          className={`px-5 py-3 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "relire" ? "border-amber-500 text-amber-500" : "border-transparent text-slate-400 hover:text-slate-250"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Œuvres à relire ({stories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("selections")}
          className={`px-5 py-3 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "selections" ? "border-amber-500 text-amber-500" : "border-transparent text-slate-400 hover:text-slate-250"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Sélections & Recommandations</span>
        </button>

        <button
          onClick={() => setActiveTab("critiques")}
          className={`px-5 py-3 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "critiques" ? "border-amber-500 text-amber-500" : "border-transparent text-slate-400 hover:text-slate-250"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Registre des Critiques ({annotations.length})</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column or unified views */}
        <div className="lg:col-span-2 bg-[#0F1117] border border-slate-800 rounded-3xl p-6 min-h-[400px]">
          {activeTab === "relire" && (
            <div className="flex flex-col gap-6 text-left">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">Manuscrit en relecture active</span>
              
              {!selectedStory ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <BookOpen className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
                  <h3 className="font-sans font-bold text-slate-300 text-sm">Sélectionner une œuvre pour amorcer l'expertise</h3>
                  <p className="text-[11px] text-slate-500 max-w-sm mt-1">Le catalogue complet des récits est disponible ci-contre. Choisissez un titre pour ouvrir le pupitre de critique.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-5 animate-fade-in">
                  <div className="flex items-start gap-4 p-4 bg-slate-950/40 border border-slate-900 rounded-2xl">
                    <img src={selectedStory.coverUrl} className="w-20 h-28 object-cover rounded-xl border border-slate-800 shadow" />
                    <div className="flex-1">
                      <span className="text-[9px] bg-slate-900 hover:bg-slate-850 px-2 py-0.5 rounded font-bold text-amber-500 uppercase border border-slate-800">{selectedStory.genre}</span>
                      <h3 className="font-sans font-extrabold text-slate-100 text-base mt-1.5">{selectedStory.title}</h3>
                      <p className="text-[11px] text-slate-400 mt-1 italic">{selectedStory.authorName}</p>
                      <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed">{selectedStory.description}</p>
                    </div>
                  </div>

                  {/* Add Critique Section */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-900 flex flex-col gap-4">
                    <h4 className="text-xs font-bold text-slate-350 uppercase tracking-wide">Fiche de Synthèse Éditoriale</h4>
                    
                    <div className="flex flex-col gap-1 text-[11px]">
                      <label className="text-slate-450 font-bold uppercase">Type d'avis ou annotation</label>
                      <select
                        value={annotationCategory}
                        onChange={(e) => setAnnotationCategory(e.target.value as any)}
                        className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 outline-none focus:border-amber-500 flex-1 max-w-xs mt-1"
                      >
                        <option value="annotation">Annotation (Style & Récit)</option>
                        <option value="correction">Proposition de Correction</option>
                        <option value="critique">Critique Littéraire Complète</option>
                        <option value="selection">Coup de Cœur (Sélection Édito)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1 text-[11px]">
                      <label className="text-slate-450 font-bold uppercase">Note d'annotation & corrections suggérées</label>
                      <textarea
                        rows={4}
                        value={newAnnotationText}
                        onChange={(e) => setNewAnnotationText(e.target.value)}
                        placeholder="Rédigez ici vos retours détaillés concernant la syntaxe, la profondeur de l'intrigue ou la cohérence de l'univers..."
                        className="bg-[#0B0C0E] border border-slate-850 rounded-xl p-3 text-xs text-slate-100 outline-none focus:border-amber-500 w-full resize-none mt-1"
                      />
                    </div>

                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setSelectedStory(null)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-slate-400 hover:text-white cursor-pointer transition"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={submitAnnotation}
                        className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-450 cursor-pointer transition flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5 text-slate-950" />
                        Publier au Grimoire d'Auteur
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "selections" && (
            <div className="flex flex-col gap-6 text-left animate-fade-in">
              <span className="text-[11px] font-bold text-slate-405 uppercase tracking-widest font-mono">Sélection Éditoriale Globale</span>
              <p className="text-xs text-slate-450 -mt-3">Mettez en avant les récits d'envergure. Les œuvres cochées apparaîtront en tête d'affiche du catalogue pour l'ensemble des lecteurs.</p>
              
              <div className="flex flex-col gap-3">
                {stories.map(story => (
                  <div key={story.id} className="flex items-center justify-between p-3.5 bg-slate-950 rounded-2xl border border-slate-900 hover:border-slate-850 transition">
                    <div className="flex items-center gap-3">
                      <img src={story.coverUrl} className="w-10 h-14 object-cover rounded-lg border border-slate-800" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-100 font-sans">{story.title}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{story.authorName} • {story.genre}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleFeature(story)}
                      className={`px-4 py-2 rounded-xl text-[11px] font-bold transition flex items-center gap-2 cursor-pointer ${
                        story.isFeatured
                          ? "bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20"
                          : "bg-slate-900 border border-slate-850 text-slate-400 hover:text-white"
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${story.isFeatured ? "fill-amber-500 text-amber-500" : ""}`} />
                      <span>{story.isFeatured ? "Haut de l'Affiche" : "Mettre en vedette"}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "critiques" && (
            <div className="flex flex-col gap-6 text-left animate-fade-in">
              <span className="text-[11px] font-bold text-slate-405 uppercase tracking-widest font-mono">Registre des revues publiées</span>
              
              {annotations.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                  <BookMarked className="w-10 h-10 text-slate-800 mx-auto mb-2" />
                  <p className="text-xs font-sans">Aucune critique n'a été rédigée à ce jour par le comité.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {annotations.map(ann => (
                    <div key={ann.id} className="bg-slate-950 p-4 rounded-2xl border border-[#2d2d3d]/25 hover:border-slate-800 transition flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] uppercase tracking-wider font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 mr-2">
                            {ann.category}
                          </span>
                          <span className="text-xs font-extrabold text-slate-100 font-sans">{ann.storyTitle}</span>
                        </div>
                        <button
                          onClick={() => deleteAnnotation(ann.id)}
                          className="p-1 rounded text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                          title="Supprimer la critique"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">{ann.text}</p>
                      
                      <div className="flex items-center justify-between border-t border-slate-900/60 pt-2 text-[10px] text-slate-500">
                        <span>Signé : {ann.editorName}</span>
                        <span>{new Date(ann.createdAt).toLocaleDateString("fr-FR")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column (Manuscrit List for Relecture Selection) */}
        <div className="bg-[#0F1117]/60 border border-slate-850 rounded-3xl p-5 flex flex-col gap-4 text-left">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-sans font-bold text-sm text-slate-250">Manuscrits du Cercle</h3>
          </div>
          
          <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
            {stories.map(story => (
              <button
                key={story.id}
                onClick={() => { setActiveTab("relire"); setSelectedStory(story); }}
                className={`relative w-full text-left p-3 rounded-2xl border transition cursor-pointer flex gap-3 ${
                  selectedStory?.id === story.id
                    ? "border-amber-500 bg-amber-500/5"
                    : "border-slate-850 bg-slate-950/40 hover:border-slate-800 hover:bg-slate-950"
                }`}
              >
                <img src={story.coverUrl} className="w-12 h-16 object-cover rounded-xl border border-slate-900 bg-slate-900 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[8.5px] uppercase font-bold text-amber-550 border border-amber-500/20 px-1.5 py-0.2 rounded font-mono">
                    {story.genre}
                  </span>
                  <h4 className="font-sans font-bold text-xs text-slate-150 truncate mt-1">{story.title}</h4>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">Par {story.authorName}</p>
                  
                  {story.isFeatured && (
                    <span className="inline-flex items-center gap-1 text-[8.5px] text-amber-400 mt-2 font-bold bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                      ★ Recommandé
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

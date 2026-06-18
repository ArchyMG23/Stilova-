import React, { useState, useEffect } from "react";
import { Story } from "../types";
import { 
  BookOpen, Clock, Heart, Download, FolderHeart, 
  PlayCircle, RefreshCw, Trash2, Plus, Bookmark, CheckCircle, FolderPlus,
  BookMarked
} from "lucide-react";

interface BibliothequeViewProps {
  stories: Story[];
  onSelectStory: (storyId: string) => void;
}

interface Collection {
  id: string;
  name: string;
  description: string;
  storyIds: string[];
}

export default function BibliothequeView({ stories, onSelectStory }: BibliothequeViewProps) {
  // Navigation tabs of Bibliotheque
  const [activeTab, setActiveTab] = useState<"resume" | "saved" | "favorites" | "offline" | "collections">("resume");
  
  // States loaded from LocalStorage
  const [resumeStories, setResumeStories] = useState<Story[]>([]);
  const [savedStories, setSavedStories] = useState<Story[]>([]);
  const [favoriteStories, setFavoriteStories] = useState<Story[]>([]);
  const [offlineStories, setOfflineStories] = useState<Story[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  // Modal for creating collection
  const [isNewCollectionModalOpen, setIsNewCollectionModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");

  // Load indices state on mount and tab modifications
  useEffect(() => {
    loadAllLibraryData();
  }, [stories, activeTab]);

  const loadAllLibraryData = () => {
    try {
      // 1. Resume playing / reading history
      const resumeIds: string[] = JSON.parse(localStorage.getItem("stilova_resume_story_ids") || "[]");
      const filteredResume = stories.filter(s => resumeIds.includes(s.id));
      setResumeStories(filteredResume);

      // 2. Saved stories / bookmarks
      const savedIds: string[] = JSON.parse(localStorage.getItem("stilova_saved_story_ids") || "[]");
      // Fallback - combine with active reading cache if needed
      const filteredSaved = stories.filter(s => savedIds.includes(s.id));
      setSavedStories(filteredSaved);

      // 3. Favorites list
      const favoriteIds: string[] = JSON.parse(localStorage.getItem("stilova_favorite_story_ids") || "[]");
      const filteredFavorites = stories.filter(s => favoriteIds.includes(s.id));
      setFavoriteStories(filteredFavorites);

      // 4. Offline downloaded stories
      const offlineIds: string[] = JSON.parse(localStorage.getItem("stilova_offline_story_ids") || "[]");
      const filteredOffline = stories.filter(s => offlineIds.includes(s.id));
      setOfflineStories(filteredOffline);

      // 5. Personal Collections
      const savedCollections: Collection[] = JSON.parse(
        localStorage.getItem("stilova_personal_collections") || "[]"
      );
      if (savedCollections.length === 0) {
        // Seed default collections if empty
        const defaultCol: Collection = {
          id: "col_default",
          name: "Épopées Légendaires",
          description: "Récits héroïques et contes dynastiques de l'Afrique de l'Ouest.",
          storyIds: stories.slice(0, 2).map(s => s.id)
        };
        setCollections([defaultCol]);
        localStorage.setItem("stilova_personal_collections", JSON.stringify([defaultCol]));
      } else {
        setCollections(savedCollections);
      }
    } catch (e) {
      console.warn("[Bibliothèque] Erreur lors du chargement des préférences locales:", e);
    }
  };

  // Helper action to clear / delete item from specific stack
  const handleRemoveFromStack = (storyId: string, stackKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const storageKey = `stilova_${stackKey}_story_ids`;
      const currentIds: string[] = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const updatedIds = currentIds.filter(id => id !== storyId);
      localStorage.setItem(storageKey, JSON.stringify(updatedIds));
      loadAllLibraryData();
    } catch (err) {
      console.error(err);
    }
  };

  // Create personal collection record
  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    const newCol: Collection = {
      id: "col_" + Date.now(),
      name: newCollectionName.trim(),
      description: newCollectionDesc.trim() || "Collection d'œuvres thématiques personnalisées.",
      storyIds: []
    };

    const updated = [...collections, newCol];
    setCollections(updated);
    localStorage.setItem("stilova_personal_collections", JSON.stringify(updated));
    
    setNewCollectionName("");
    setNewCollectionDesc("");
    setIsNewCollectionModalOpen(false);
  };

  // Delete whole collection
  const handleDeleteCollection = (collectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = collections.filter(c => c.id !== collectionId);
    setCollections(updated);
    localStorage.setItem("stilova_personal_collections", JSON.stringify(updated));
  };

  // Associate a story inside collection list
  const handleToggleStoryInCollection = (storyId: string, collectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = collections.map(c => {
      if (c.id === collectionId) {
        const alreadyIn = c.storyIds.includes(storyId);
        return {
          ...c,
          storyIds: alreadyIn 
            ? c.storyIds.filter(id => id !== storyId)
            : [...c.storyIds, storyId]
        };
      }
      return c;
    });
    setCollections(updated);
    localStorage.setItem("stilova_personal_collections", JSON.stringify(updated));
  };

  // Render Story Cards for standard views
  const renderStoryGrid = (storiesList: Story[], stackKey: string) => {
    if (storiesList.length === 0) {
      return (
        <div className="bg-slate-950/40 border border-dashed border-slate-850 p-12 rounded-3xl text-center flex flex-col items-center justify-center gap-3 animate-fade-in w-full">
          <BookMarked className="w-12 h-12 text-slate-700" />
          <h5 className="font-sans font-bold text-slate-350 text-sm">Aucun récit dans cette étagère</h5>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            Parcourez le Catalogue des œuvres africaines et ajoutez vos préférées au furet de votre lecture !
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
        {storiesList.map((story) => (
          <div
            key={story.id}
            onClick={() => onSelectStory(story.id)}
            className="group relative bg-[#0F1117] border border-slate-800 hover:border-amber-500/30 rounded-3xl p-4 flex gap-4 cursor-pointer transition duration-300 shadow-md"
          >
            <img 
              src={story.coverUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300"}
              alt={story.title}
              loading="lazy"
              decoding="async"
              className="w-20 h-28 object-cover rounded-2xl border border-slate-800/80 group-hover:scale-103 transition duration-200"
            />
            
            <div className="flex flex-col justify-between flex-1 min-w-0">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] bg-slate-950 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full capitalize w-max font-mono font-bold">
                  {story.genre}
                </span>
                <h4 className="font-sans font-bold text-slate-100 text-sm truncate mt-1 group-hover:text-amber-400 transition">
                  {story.title}
                </h4>
                <p className="text-[11px] text-slate-400 font-serif italic truncate">Par {story.authorName}</p>
                <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed mt-1">{story.description}</p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-900 pt-2 mt-2">
                <span className="text-[9px] text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                  <CheckCircle className="w-2.5 h-2.5" /> Synchronisé
                </span>
                <button
                  onClick={(e) => handleRemoveFromStack(story.id, stackKey, e)}
                  title="Retirer de cette section"
                  className="bg-slate-950 hover:bg-red-950/45 p-1.5 rounded-xl border border-slate-850 hover:border-red-500/30 text-slate-500 hover:text-red-400 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto px-4 pb-16 animate-fade-in">
      
      {/* Brand Page Cover */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <BookOpen className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <h1 className="font-sans font-black text-slate-100 text-xl md:text-3xl">Ma Bibliothèque Sacrée</h1>
            <p className="text-xs text-slate-400 font-sans mt-1 max-w-xl leading-relaxed">
              Votre portail d'écriture personnel. Aménagez vos collections de récits, reprenez vos lectures interactives suspendues et lisez vos fiches même hors réseau.
            </p>
          </div>
        </div>
      </div>

      {/* Main Tab bar and View Panels Wrapper */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Library Sub-Navigation tabs */}
        <div className="w-full lg:w-64 shrink-0 bg-[#0F1117] border border-slate-800 p-3 rounded-3xl flex flex-col gap-1 shadow-md">
          <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider px-3 py-2 border-b border-slate-900 mb-1.5">
            Étagères livresques
          </span>
          
          <button
            onClick={() => setActiveTab("resume")}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-3 transition ${
              activeTab === "resume"
                ? "bg-amber-500 text-black font-extrabold"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            <span>Reprendre la lecture ({resumeStories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("saved")}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-3 transition ${
              activeTab === "saved"
                ? "bg-amber-500 text-black font-extrabold"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Histoires enregistrées ({savedStories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("favorites")}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-3 transition ${
              activeTab === "favorites"
                ? "bg-amber-500 text-black font-extrabold"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Mes Favoris ({favoriteStories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("offline")}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-3 transition ${
              activeTab === "offline"
                ? "bg-amber-500 text-black font-extrabold"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Lectures Hors Ligne ({offlineStories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("collections")}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-3 transition ${
              activeTab === "collections"
                ? "bg-amber-500 text-black font-extrabold"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <FolderHeart className="w-4 h-4" />
            <span>Collections Personnelles ({collections.length})</span>
          </button>
        </div>

        {/* Right Tab Content area */}
        <div className="flex-1 bg-[#0B0D13]/40 border border-slate-900 p-6 rounded-3xl min-h-[420px] w-full">
          
          {/* Active Tab Panel 1: PLAY RESUME */}
          {activeTab === "resume" && (
            <div className="flex flex-col gap-4">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest px-1 font-mono">
                Reprendre la lecture ({resumeStories.length})
              </span>
              {renderStoryGrid(resumeStories, "resume")}
            </div>
          )}

          {/* Active Tab Panel 2: SAVED WORKS */}
          {activeTab === "saved" && (
            <div className="flex flex-col gap-4">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest px-1 font-mono">
                Histoires enregistrées ({savedStories.length})
              </span>
              {renderStoryGrid(savedStories, "saved")}
            </div>
          )}

          {/* Active Tab Panel 3: FAVORITES */}
          {activeTab === "favorites" && (
            <div className="flex flex-col gap-4">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest px-1 font-mono">
                Favoris ({favoriteStories.length})
              </span>
              {renderStoryGrid(favoriteStories, "favorite")}
            </div>
          )}

          {/* Active Tab Panel 4: OFFLINE */}
          {activeTab === "offline" && (
            <div className="flex flex-col gap-4">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest px-1 font-mono">
                Téléchargements hors ligne ({offlineStories.length})
              </span>
              {renderStoryGrid(offlineStories, "offline")}
            </div>
          )}

          {/* Active Tab Panel 5: CUSTOM COLLECTIONS */}
          {activeTab === "collections" && (
            <div className="flex flex-col gap-6 w-full">
              
              {/* Header and create collection trigger */}
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest px-1 font-mono">
                  Collections personnalisées
                </span>
                
                <button
                  onClick={() => setIsNewCollectionModalOpen(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer select-none"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nouvelle collection</span>
                </button>
              </div>

              {/* Collections Grid list */}
              {collections.length === 0 ? (
                <div className="bg-slate-950/40 border border-dashed border-slate-850 p-12 rounded-3xl text-center flex flex-col items-center justify-center gap-3 animate-fade-in w-full">
                  <FolderPlus className="w-12 h-12 text-slate-700" />
                  <h5 className="font-sans font-bold text-slate-350 text-sm">Aucune collection personnelle</h5>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed mx-auto">
                    Créez des étagères privées thématiques pour regrouper des livres de contreforts et de genres différents !
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-6 animate-fade-in w-full">
                  {collections.map((col) => {
                    const matchedStoriesInCol = stories.filter(s => col.storyIds.includes(s.id));
                    return (
                      <div key={col.id} className="bg-[#0F1117] border border-slate-800 rounded-3xl p-6 flex flex-col gap-4 shadow-sm relative">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex flex-col">
                            <h4 className="font-sans font-extrabold text-amber-500 text-sm">{col.name}</h4>
                            <p className="text-xs text-slate-400 mt-1">{col.description}</p>
                          </div>
                          
                          <button
                            onClick={(e) => handleDeleteCollection(col.id, e)}
                            title="Supprimer la collection"
                            className="bg-slate-950 hover:bg-red-950/45 p-1.5 rounded-xl border border-slate-850 hover:border-red-500/30 text-slate-500 hover:text-red-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Stories associated in this collection */}
                        {matchedStoriesInCol.length === 0 ? (
                          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-900 text-slate-500 text-[11px] font-sans">
                            Aucune œuvre n'est encore rangée dans cette collection. Pour l'étoffer, utilisez l'éditeur ou ajoutez des livres du catalogue.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {matchedStoriesInCol.map((st) => (
                              <div
                                key={st.id}
                                onClick={() => onSelectStory(st.id)}
                                className="bg-slate-950 hover:bg-[#141822] p-3 rounded-2xl border border-slate-900 hover:border-slate-800 flex gap-3 items-center cursor-pointer transition"
                              >
                                <img
                                  src={st.coverUrl}
                                  alt={st.title}
                                  loading="lazy"
                                  decoding="async"
                                  className="w-10 h-14 object-cover rounded shadow"
                                />
                                <div className="flex flex-col min-w-0">
                                  <span className="font-bold text-slate-200 text-xs truncate">{st.title}</span>
                                  <span className="text-[10px] text-slate-450 truncate">Par {st.authorName}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add / edit association options inside list */}
                        <div className="flex flex-wrap items-center gap-2 border-t border-slate-900 pt-3.5 mt-1.5">
                          <span className="text-[9px] text-[#8C8C8C] font-mono leading-none">Ranger / Retirer :</span>
                          {stories.slice(0, 5).map(st => {
                            const isPresent = col.storyIds.includes(st.id);
                            return (
                              <button
                                key={st.id}
                                onClick={(e) => handleToggleStoryInCollection(st.id, col.id, e)}
                                className={`text-[9.5px] px-2.5 py-1 rounded-lg border transition ${
                                  isPresent
                                    ? "bg-amber-500/10 border-amber-500/40 text-amber-400 font-bold"
                                    : "bg-slate-950 hover:bg-slate-900 border-slate-850 text-slate-400"
                                }`}
                              >
                                {isPresent ? "✔ " : "+ "} {st.title.slice(0, 18)}...
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Popup modal simple to create collection */}
              {isNewCollectionModalOpen && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                  <div className="bg-[#0F1117] border border-slate-800 w-full max-w-md p-6 rounded-3xl flex flex-col gap-4 shadow-2xl">
                    <div className="border-b border-slate-900 pb-2">
                      <h4 className="font-sans font-bold text-slate-100 text-sm">Créer une Collection Thématique</h4>
                      <p className="text-[11px] text-[#A3A3A3] mt-0.5">Aménagez un nouvel écrin pour ranger vos pièces épiques.</p>
                    </div>

                    <form onSubmit={handleCreateCollection} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Identité / Nom de collection</label>
                        <input
                          type="text"
                          value={newCollectionName}
                          onChange={(e) => setNewCollectionName(e.target.value)}
                          placeholder="Ex: Mythes Antiques, Eaux Invisibles..."
                          className="bg-slate-950 border border-slate-850 px-3.5 py-3 rounded-2xl text-xs text-slate-200 outline-none focus:ring-1 focus:ring-amber-500 w-full"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Descriptif / Rôle de l'étagère</label>
                        <textarea
                          value={newCollectionDesc}
                          onChange={(e) => setNewCollectionDesc(e.target.value)}
                          placeholder="Quel type d'inspiration regroupez-vous ici ?"
                          rows={3}
                          className="bg-slate-950 border border-slate-850 px-3.5 py-3 rounded-2xl text-xs text-slate-200 outline-none focus:ring-1 focus:ring-amber-500 w-full resize-none font-sans"
                        />
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        <button
                          type="button"
                          onClick={() => setIsNewCollectionModalOpen(false)}
                          className="flex-1 bg-slate-955 hover:bg-slate-900 py-3 rounded-xl text-xs text-slate-400 transition"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-amber-500 hover:bg-amber-400 py-3 rounded-xl text-xs text-slate-950 font-bold transition"
                        >
                          Graver l'écrin
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>

    </div>
  );
}

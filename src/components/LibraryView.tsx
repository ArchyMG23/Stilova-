import React, { useState } from "react";
import { Story, AfricanGenre } from "../types";
import { BookOpen, Search, Filter, Sparkles, Flame, Eye, Star, Plus } from "lucide-react";

interface LibraryViewProps {
  stories: Story[];
  onSelectStory: (storyId: string) => void;
  currentUserRole?: string;
  onOpenCreateModal?: () => void;
}

const GENRES: { key: AfricanGenre | "all"; label: string; icon: string }[] = [
  { key: "all", label: "Toute l'Afrique", icon: "🌍" },
  { key: "afrofuturism", label: "Afrofuturisme", icon: "🚀" },
  { key: "mythology", label: "Mythologie", icon: "🔱" },
  { key: "historical", label: "Histoire / Chronique", icon: "📜" },
  { key: "romance", label: "Roman d'Amour", icon: "💖" },
  { key: "drama", label: "Drame Social", icon: "🎭" }
];

export default function LibraryView({ stories, onSelectStory, currentUserRole, onOpenCreateModal }: LibraryViewProps) {
  const [selectedGenre, setSelectedGenre] = useState<AfricanGenre | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStories = stories.filter(story => {
    const matchGenre = selectedGenre === "all" || story.genre === selectedGenre;
    const matchSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        story.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        story.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchGenre && matchSearch && story.isPublished;
  });

  const featuredStories = stories.filter(s => s.isFeatured && s.isPublished);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* Search and write trigger bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-3xl border border-slate-800 backdrop-blur-md">
        
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une histoire, un auteur, un thème..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
          />
        </div>

        {/* Dynamic write creation shortcut if writer role */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {onOpenCreateModal && (
            <button
              onClick={onOpenCreateModal}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 cursor-pointer transition scale-100 active:scale-95"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Graver une nouvelle histoire</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Featured slider if present */}
      {featuredStories.length > 0 && searchQuery === "" && selectedGenre === "all" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-slate-100 font-bold font-sans text-sm tracking-wide">
            <Flame className="w-5 h-5 text-red-500" />
            <span>À la Une de Stilova</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredStories.map((story) => (
              <div
                key={story.id}
                onClick={() => onSelectStory(story.id)}
                className="group relative bg-slate-900 border border-slate-750 hover:border-amber-500/50 rounded-none p-4 flex gap-4 cursor-pointer transition duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/5 overflow-hidden animate-fade-in"
              >
                {/* Backdrop lighting */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent pointer-events-none" />

                <img
                  src={story.coverUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300"}
                  alt={story.title}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300";
                  }}
                  className="w-24 h-32 rounded-none object-cover shrink-0 border border-slate-750 shadow-lg group-hover:scale-105 transition duration-300"
                />

                <div className="flex flex-col justify-between flex-1 min-w-0">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] bg-slate-950 border border-amber-500/30 text-amber-500 font-bold px-2 py-0.5 rounded-none capitalize w-max font-sans tracking-wide">
                        {story.genre}
                      </span>
                      {story.isInteractive && (
                        <span className="text-[9px] bg-slate-950 border border-sky-500/30 text-sky-400 font-bold px-2 py-0.5 rounded-none font-sans tracking-wide">
                          Interactif 🕹️
                        </span>
                      )}
                    </div>

                    <h4 className="font-sans font-bold text-slate-100 text-sm leading-snug group-hover:text-amber-400 transition truncate">
                      {story.title}
                    </h4>

                    <span className="text-[11px] text-slate-400 font-serif italic truncate">
                      Par {story.authorName}
                    </span>

                    <p className="text-[11px] text-slate-500 leading-normal line-clamp-3 mt-1 font-sans">
                      {story.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono mt-2 border-t border-slate-900 pt-2">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-slate-500" />
                      {story.viewsCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      {story.rating}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Genre Filter ribbons */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-slate-400 font-semibold font-sans">Univers Narratifs :</span>
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {GENRES.map((genre) => (
            <button
              key={genre.key}
              onClick={() => setSelectedGenre(genre.key)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap border transition duration-200 cursor-pointer flex items-center gap-2 ${
                selectedGenre === genre.key
                  ? "bg-amber-500 border-amber-400 text-slate-950 font-bold scale-105 shadow-md shadow-amber-500/10"
                  : "bg-slate-900/60 border-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              <span>{genre.icon}</span>
              <span>{genre.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Bookshelf */}
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
            Récits ({filteredStories.length})
          </span>
        </div>

        {filteredStories.length === 0 ? (
          <div className="bg-slate-900/30 border border-dashed border-slate-800 p-12 rounded-3xl text-center flex flex-col items-center justify-center gap-3">
            <BookOpen className="w-12 h-12 text-slate-600" />
            <h5 className="font-sans font-bold text-slate-300 text-sm">Aucun stylet n'a encore gravé cette histoire</h5>
            <p className="text-xs text-slate-500 max-w-md font-sans">
              Aucun récit ne correspond à votre recherche ou à ce genre pour le moment. Rejoignez le cercle des auteurs pour graver le premier !
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredStories.map((story) => (
              <div
                key={story.id}
                onClick={() => onSelectStory(story.id)}
                className="group flex flex-col bg-slate-900 border border-slate-750 hover:border-amber-500/50 rounded-none overflow-hidden cursor-pointer transition duration-300 transform hover:-translate-y-1.5 hover:shadow-xl shadow-md"
              >
                {/* Book Cover Image aspect height */}
                <div className="relative aspect-[3/4] overflow-hidden bg-slate-950">
                  <img
                    src={story.coverUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300"}
                    alt={story.title}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300";
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-505"
                  />
                  
                  {/* Aspect gradient filter */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                  {/* Corner tags */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                    <span className="text-[9px] bg-slate-950/90 backdrop-blur-md text-amber-500 font-bold border border-amber-500/30 px-2 py-0.5 rounded-none capitalize font-sans tracking-wide">
                      {story.genre}
                    </span>
                    {story.isInteractive && (
                      <span className="text-[9px] bg-slate-950/90 backdrop-blur-md text-sky-450 font-bold border border-sky-500/30 px-2 py-0.5 rounded-none font-sans tracking-wide">
                        Interactif 🕹️
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 flex flex-col justify-between flex-1 min-h-[140px]">
                  <div className="flex flex-col gap-1">
                    <h4 className="font-sans font-bold text-slate-100 text-sm leading-snug group-hover:text-amber-400 transition line-clamp-2">
                      {story.title}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-serif italic line-clamp-1">
                      Par {story.authorName}
                    </span>
                    <p className="text-[11px] text-slate-500 leading-normal line-clamp-2 mt-1 font-sans">
                      {story.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-3 border-t border-slate-900 pt-3">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-slate-500" />
                      {story.viewsCount} lectures
                    </span>
                    <span className="flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded text-amber-400">
                      <Star className="w-3 h-3 fill-current" />
                      {story.rating}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

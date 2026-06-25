import React from "react";
import { Story } from "../types";
import { getFontCssValue } from "../lib/typography";
import { dbService } from "../firebase";
import { 
  BookOpen, Star, Eye, Calendar, Sparkles, User, ArrowLeft, 
  Play, Bookmark, MessageSquare, Award, Clock, Share2, CornerDownRight, Heart
} from "lucide-react";

interface StoryDetailViewProps {
  story: Story;
  chapterCount: number;
  onBack: () => void;
  onStartReading: () => void;
  isVisitor: boolean;
  onActionLockTrigger: () => void;
  currentUser: any;
}

export default function StoryDetailView({ 
  story, 
  chapterCount, 
  onBack, 
  onStartReading, 
  isVisitor, 
  onActionLockTrigger,
  currentUser
}: StoryDetailViewProps) {
  
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [isLiked, setIsLiked] = React.useState(false);
  const [likesCount, setLikesCount] = React.useState(0);
  const [followersCount, setFollowersCount] = React.useState(0);

  React.useEffect(() => {
    if (!isVisitor && currentUser) {
      dbService.isFollowing(currentUser.uid, story.authorId).then(setIsFollowing);
      dbService.isStoryLiked(story.id, currentUser.uid).then(setIsLiked);
    }
    dbService.getFollowers(story.authorId).then(list => setFollowersCount(list.length));
    dbService.getStoryLikes(story.id).then(list => setLikesCount(list.length));
  }, [story.id, story.authorId, currentUser, isVisitor]);

  const handleFollowToggle = async () => {
    if (isVisitor) {
      onActionLockTrigger();
      return;
    }
    if (!currentUser) return;
    const nowFollowing = await dbService.toggleFollow(currentUser.uid, story.authorId);
    setIsFollowing(nowFollowing);
    setFollowersCount(prev => nowFollowing ? prev + 1 : prev - 1);
  };

  const handleLikeToggle = async () => {
    if (isVisitor) {
      onActionLockTrigger();
      return;
    }
    if (!currentUser) return;
    const nowLiked = await dbService.toggleLikeStory(story.id, currentUser.uid, story.title, story.authorId);
    setIsLiked(nowLiked);
    setLikesCount(prev => nowLiked ? prev + 1 : prev - 1);
  };

  const handleBookmarkToggle = () => {
    if (isVisitor) {
      onActionLockTrigger();
    } else {
      alert("Ajouté avec succès à votre Stylet virtuel de lecture !");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Lien de l'histoire copié dans le presse-papiers !");
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 animate-fade-in">
      
      {/* Back button */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-xs font-bold font-sans transition mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Retour à la Bibliothèque
      </button>

      {/* Main Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Artistic ambient backdrop lighting */}
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-gradient-to-br from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        
        {/* Split Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 md:p-10">
          
          {/* Cover and secondary buttons (Column 1) */}
          <div className="md:col-span-1 flex flex-col gap-4">
            <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border border-slate-750 shadow-2xl bg-slate-950">
              <img 
                src={story.coverUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400"} 
                alt={story.title}
                fetchPriority="high"
                decoding="sync"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                <span className="text-[10px] bg-slate-950/90 backdrop-blur-md text-amber-550 border border-amber-500/30 px-3 py-1 font-bold rounded-none uppercase tracking-wider font-sans">
                  {story.genre}
                </span>
                {story.isInteractive && (
                  <span className="text-[10px] bg-slate-950/90 backdrop-blur-md text-sky-450 border border-sky-500/30 px-3 py-1 font-bold rounded-none uppercase tracking-wider font-sans">
                    Interactif 🕹️
                  </span>
                )}
              </div>
            </div>

            {/* Side Action Buttons */}
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              <button
                onClick={handleBookmarkToggle}
                className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl border border-slate-800 bg-slate-950/40 text-[10px] font-sans font-bold text-slate-200 hover:text-amber-500 hover:border-amber-500/30 transition cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Ajouter</span>
              </button>
              <button
                onClick={handleLikeToggle}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl border text-[10px] font-sans font-bold cursor-pointer transition ${
                  isLiked
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                    : "bg-slate-950/40 border-slate-800 text-slate-200 hover:text-rose-400 hover:border-rose-500/25"
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-rose-400 text-rose-400" : "text-slate-405"}`} />
                <span>{isLiked ? "Aimé" : "Aimer"}</span>
              </button>
              <button
                onClick={handleShare}
                className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl border border-slate-800 bg-slate-950/40 text-[10px] font-sans font-bold text-slate-200 hover:text-white transition cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Partager</span>
              </button>
            </div>
          </div>

          {/* Book Info Column (Column 2 & 3) */}
          <div className="md:col-span-2 flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              
              {/* Core header info */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#D97706]/90 uppercase">
                    Oeuvre Littéraire Panafricaine
                  </span>
                  {story.isFeatured && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-550/10 text-amber-400 border border-amber-500/20 animation-pulse">
                      ★ Recommandé
                    </span>
                  )}
                </div>
                
                <h2 
                  className="font-extrabold text-3xl md:text-5xl text-white tracking-tight leading-indigo transition-all duration-300"
                  style={{
                    fontFamily: story.title_font ? getFontCssValue(story.title_font) : "inherit",
                    fontWeight: story.title_font_weight === "normal" ? "400" : story.title_font_weight === "medium" ? "500" : story.title_font_weight === "bold" ? "700" : "800"
                  }}
                >
                  {story.title}
                </h2>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2 bg-slate-950/20 p-3.5 rounded-2xl border border-slate-850/40">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-850 border border-slate-750 flex items-center justify-center text-[10px] font-bold text-amber-500 font-mono">
                      {story.authorName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-slate-300 font-sans font-medium">
                      Par <strong className="font-serif italic text-white">{story.authorName}</strong>
                    </span>
                  </div>
                  
                  {!isVisitor && currentUser && currentUser.uid !== story.authorId && (
                    <button
                      onClick={handleFollowToggle}
                      className={`px-3 py-1.5 rounded-xl border text-[11px] font-sans font-bold cursor-pointer transition flex items-center gap-1.5 ${
                        isFollowing 
                          ? "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900" 
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/25"
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>{isFollowing ? "Abonné ✓" : "S'abonner"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Stats badges ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/40 p-4 border border-slate-850 rounded-2xl text-xs font-sans">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-500 font-medium font-sans">Lectures</span>
                  <span className="text-slate-200 font-bold flex items-center gap-1 font-sans">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    {story.viewsCount}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-500 font-medium font-sans">Abonnés Plume</span>
                  <span className="text-slate-200 font-bold flex items-center gap-1 font-sans">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {followersCount}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-500 font-medium font-sans">Favoris / Likes</span>
                  <span className="text-slate-200 font-bold flex items-center gap-1 font-sans">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/10" />
                    {likesCount}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-500 font-medium font-sans">Chapitres</span>
                  <span className="text-slate-200 font-bold flex items-center gap-1 font-sans">
                    <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                    {chapterCount} scène{chapterCount > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Synopsis Text split */}
              <div className="flex flex-col gap-1.5 mt-2">
                <span className="text-[11px] font-mono uppercase font-bold text-slate-400 tracking-wider">Synopsis de l'œuvre</span>
                <p className="text-xs text-slate-300 leading-relaxed font-sans font-light">
                  {story.description || "Aucun résumé n'a encore été gravé pour cette œuvre interactive."}
                </p>
              </div>

              {/* Chapter extract sneak peek */}
              <div className="flex flex-col gap-2 mt-3 border-t border-slate-900 pt-4">
                <span className="text-[11px] font-mono uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Structure de l'aventure
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Cette œuvre interactive se déploie à travers des nœuds de décisions. Vous commencerez par l'introduction officielle gratuite. Chaque choix gravera votre propre débranchement au sein des mondes virtuels de Stilova.
                </p>
              </div>

            </div>

            {/* BIG ACTION RUNNER */}
            <div className="flex flex-col sm:flex-row items-center gap-3.5 mt-4 pt-4 border-t border-slate-900">
              <button
                onClick={onStartReading}
                className="w-full sm:flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans font-black py-4 px-6 rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition transform active:scale-98 shadow-lg shadow-amber-500/10 cursor-pointer"
              >
                <Play className="w-4 h-4 text-slate-950 fill-slate-950" />
                <span>Commencer la lecture (Gratuit)</span>
              </button>
              
              {isVisitor && (
                <span className="text-[10px] text-slate-500 italic text-center sm:text-left leading-normal max-w-xs font-sans">
                  Mode Visiteur : lecture de chapitres gratuite. Les embranchements avancés requerront une inscription d'auteur.
                </span>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

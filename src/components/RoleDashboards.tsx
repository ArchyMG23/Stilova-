import React, { useState, useEffect } from "react";
import { Story, UserProfile, Competition, AuditLog, UserRole } from "../types";
import { dbService } from "../firebase";
import { 
  TrendingUp, Users, DollarSign, Database, Activity, Trophy, Shield, 
  BookMarked, HelpCircle, Server, Key, Eye, EyeOff, Plus, Check, 
  Ban, ShieldCheck, Heart, Trash2, ArrowRight, CornerDownRight, 
  Zap, PenTool, BookOpen, AlertCircle, MessageSquare, Award, Star,
  RefreshCw, FolderHeart, Edit2, Sparkles
} from "lucide-react";

interface RoleDashboardsProps {
  currentUser: UserProfile;
  stories: Story[];
  onRefreshStories: () => void;
  changeRoute: (route: string) => void;
  handleOpenStoryReader: (storyId: string) => void;
}

export default function RoleDashboards({
  currentUser,
  stories,
  onRefreshStories,
  changeRoute,
  handleOpenStoryReader
}: RoleDashboardsProps) {
  const role = currentUser.role;

  // Local dashboard states with fast local storage initialization (SWR Pattern for 0ms visual delay)
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    try {
      const cached = localStorage.getItem("stilova_cache_users_profiles");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [competitions, setCompetitions] = useState<Competition[]>(() => {
    try {
      const cached = localStorage.getItem("stilova_cache_competitions");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const cached = localStorage.getItem("stilova_cache_audit_logs");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const cachedProfile = localStorage.getItem("stilova_cache_users_profiles");
      return cachedProfile ? false : true;
    } catch {
      return true;
    }
  });

  // Growth Chart & Premium Simulator
  const [subscriptionPrice, setSubscriptionPrice] = useState(4.99); // Simulation de prix
  const [premiumUserRatio, setPremiumUserRatio] = useState(15);      // Simulation du taux d'abonnés %
  const [revenueSliderMultiplier, setRevenueSliderMultiplier] = useState(1);

  // Secrets toggler for Founder
  const [revealSecrets, setRevealSecrets] = useState(false);

  // Specific role variables
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<UserRole>("ADMIN");

  // Editorial annotation creator
  const [selectedReviewStoryId, setSelectedReviewStoryId] = useState("");
  const [annotationValue, setAnnotationValue] = useState("");
  const [annotations, setAnnotations] = useState<any[]>([]);

  // Moderator lists
  const [warningsList, setWarningsList] = useState<string[]>([]);
  const [reportedStories, setReportedStories] = useState<Story[]>([]);

  // Followed authors
  const [followedAuthors, setFollowedAuthors] = useState<string[]>(["Abdoulaye Diallo", "Kemi Adebayo"]);

  useEffect(() => {
    loadDashboardData();
  }, [stories]);

  const loadDashboardData = async () => {
    // Only trigger loading screen initially if cache is completely empty
    if (profiles.length === 0) {
      setLoading(true);
    }
    try {
      const usersList = await dbService.listProfiles();
      setProfiles(usersList);

      const compsList = await dbService.listCompetitions();
      setCompetitions(compsList);

      if (["FOUNDER_OWNER", "SUPER_ADMIN"].includes(role)) {
        const logsList = await dbService.listAuditLogs();
        setAuditLogs(logsList);
      }

      // Initialize reported stories list
      setReportedStories(stories.filter(s => s.reported));

      // Load editor annotations
      const savedAnnotations = localStorage.getItem("stilova_editor_annotations");
      if (savedAnnotations) {
        setAnnotations(JSON.parse(savedAnnotations));
      } else {
        const initialAnnotations = [
          {
            id: "ann_1",
            storyTitle: stories[0]?.title || "Les Sentinelles de Gorée-2099",
            editorName: "Amara Seye (Éditeur)",
            text: "Très bon rythme narratif, les embranchements de choix multiples sont particulièrement fluides.",
            createdAt: new Date().toISOString()
          }
        ];
        setAnnotations(initialAnnotations);
        localStorage.setItem("stilova_editor_annotations", JSON.stringify(initialAnnotations));
      }
    } catch (e) {
      console.warn("Erreur de chargement des métriques de dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  // Actions: Create Administrative Accounts (Founder exclusive)
  const handleCreateAdminAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminName.trim()) return;

    try {
      const simulatedId = "usr_" + Date.now();
      const newProfile: UserProfile = {
        uid: simulatedId,
        displayName: newAdminName.trim(),
        email: newAdminEmail.trim(),
        role: newAdminRole,
        bio: `Membre du conseil de Stilova (${newAdminRole}) créé souverainement.`,
        favoriteGenres: [],
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(newAdminName)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await dbService.saveProfile(newProfile);

      // Save Log
      await dbService.saveAuditLog({
        id: "log_" + Date.now(),
        action: "CREATION_COMPTE_ADMINISTRATIF",
        performedBy: currentUser.uid,
        performedByName: currentUser.displayName,
        targetUserId: simulatedId,
        targetUserName: newProfile.displayName,
        details: `Le FOUNDER_OWNER a forgé le compte administratif de type [${newAdminRole}] pour ${newAdminName}.`,
        timestamp: new Date().toISOString()
      });

      setNewAdminEmail("");
      setNewAdminName("");
      loadDashboardData();
      alert(`Compte administratif ${newAdminRole} créé avec succès !`);
    } catch (err) {
      console.error(err);
    }
  };

  // Actions: User Promotion (SuperAdmin exclusive)
  const handlePromoteRole = async (targetUserId: string, targetRole: UserRole) => {
    const target = profiles.find(p => p.uid === targetUserId);
    if (!target) return;

    try {
      const updatedProfile = { ...target, role: targetRole, updatedAt: new Date().toISOString() };
      await dbService.saveProfile(updatedProfile);

      await dbService.saveAuditLog({
        id: "log_" + Date.now(),
        action: "PROMOTION_ROLE",
        performedBy: currentUser.uid,
        performedByName: currentUser.displayName,
        targetUserId,
        targetUserName: target.displayName,
        details: `Promotion au rang de [${targetRole}] accordée.`,
        timestamp: new Date().toISOString()
      });

      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // Actions: Suspend/Reactivate citizen (Admin/Funder exclusive)
  const handleToggleSuspension = async (user: UserProfile) => {
    if (user.role === "FOUNDER_OWNER") {
      alert("Le compte souverain du Fondateur ne peut pas être suspendu.");
      return;
    }
    try {
      const updated = { ...user, suspended: !user.suspended, updatedAt: new Date().toISOString() };
      await dbService.saveProfile(updated);

      await dbService.saveAuditLog({
        id: "log_" + Date.now(),
        action: updated.suspended ? "SUSPENSION_COMPTE" : "REACTIVATION_COMPTE",
        performedBy: currentUser.uid,
        performedByName: currentUser.displayName,
        targetUserId: user.uid,
        targetUserName: user.displayName,
        details: updated.suspended ? `Citoyen temporairement suspendu.` : `Rétablissement complet du compte citoyen.`,
        timestamp: new Date().toISOString()
      });

      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // Actions: Annotate story (Editor exclusive)
  const handleAddAnnotation = () => {
    if (!selectedReviewStoryId || !annotationValue.trim()) return;
    const matchedStory = stories.find(s => s.id === selectedReviewStoryId);
    if (!matchedStory) return;

    const newAnn = {
      id: "ann_" + Date.now(),
      storyTitle: matchedStory.title,
      editorName: currentUser.displayName || "Éditeur Stilova",
      text: annotationValue.trim(),
      createdAt: new Date().toISOString()
    };

    const updated = [newAnn, ...annotations];
    setAnnotations(updated);
    localStorage.setItem("stilova_editor_annotations", JSON.stringify(updated));
    setAnnotationValue("");
    alert("Annotation éditoriale enregistrée !");
  };

  // Actions: Dismiss/Mask stories (Moderator exclusive)
  const handleModerateReport = async (story: Story, forceHide: boolean) => {
    try {
      const updated = { ...story, reported: false, isPublished: !forceHide, updatedAt: new Date().toISOString() };
      await dbService.saveStory(updated);

      await dbService.saveAuditLog({
        id: "log_" + Date.now(),
        action: forceHide ? "MASQUAGE_CONTENU" : "CLASSIFICATION_SANS_SUITE",
        performedBy: currentUser.uid,
        performedByName: currentUser.displayName,
        targetUserId: story.authorId,
        targetUserName: story.authorName,
        details: forceHide ? `L'histoire"${story.title}" a été masquée par modération.` : `L'histoire "${story.title}" a été disculpée suite à révision.`,
        timestamp: new Date().toISOString()
      });

      onRefreshStories();
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle follows
  const handleToggleFollow = (authorName: string) => {
    if (followedAuthors.includes(authorName)) {
      setFollowedAuthors(followedAuthors.filter(a => a !== authorName));
    } else {
      setFollowedAuthors([...followedAuthors, authorName]);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 min-h-[400px] gap-4">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        <span className="text-xs text-slate-400 font-mono uppercase tracking-widest">Initialisation du tableau de bord d'État...</span>
      </div>
    );
  }

  // --- 1. DASHBOARD FOUNDER_OWNER ---
  if (role === "FOUNDER_OWNER") {
    const monthlyAbonnes = Math.round(profiles.length * (premiumUserRatio / 100));
    const simulatedRevenue = Math.round(monthlyAbonnes * subscriptionPrice * revenueSliderMultiplier);
    
    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto animate-fade-in text-left">
        
        {/* Sovereign Header */}
        <div className="rounded-3xl p-8 border border-amber-500/20 bg-gradient-to-r from-slate-950 via-[#1e1b4b]/30 to-[#1e1141]/20 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-4 z-10">
            <div className="p-3 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl flex items-center justify-center">
              <Award className="w-9 h-9 text-amber-500 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono font-bold px-3 py-1 rounded-full tracking-widest uppercase">
                👑 FONDATEUR SOUVERAIN (FOUNDER_OWNER)
              </span>
              <h2 className="text-xl sm:text-2xl font-sans font-black text-white mt-2">
                Sanctuaire de Commandement Stilova
              </h2>
              <p className="text-xs text-slate-400 max-w-xl font-sans mt-0.5 font-light">
                Bienvenue, Majesté {currentUser.displayName}. Ce poste d'observation souverain compile un contrôle absolu des finances simulées, de l'infrastructure, des comptes administratifs et de l'audit complet.
              </p>
            </div>
          </div>
          <button
            onClick={() => loadDashboardData()}
            className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-200 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Synchroniser</span>
          </button>
        </div>

        {/* Executive Metrics Panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#0F1117] border border-slate-800 p-6 rounded-3xl flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Inscrits de l'Empire</span>
              <h4 className="text-2xl font-black text-white font-mono mt-0.5">{profiles.length} citoyens</h4>
            </div>
          </div>

          <div className="bg-[#0F1117] border border-slate-800 p-6 rounded-3xl flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
              <TrendingUp className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Croissance mensuelle</span>
              <h4 className="text-2xl font-black text-emerald-400 font-mono mt-0.5">+48%</h4>
            </div>
          </div>

          <div className="bg-[#0F1117] border border-slate-800 p-6 rounded-3xl flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Revenus Souverains</span>
              <h4 className="text-2xl font-black text-amber-400 font-mono mt-0.5">~{simulatedRevenue} €/mois</h4>
            </div>
          </div>

          <div className="bg-[#0F1117] border border-slate-800 p-6 rounded-3xl flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Récits Graved</span>
              <h4 className="text-2xl font-black text-white font-mono mt-0.5">{stories.length} œuvres</h4>
            </div>
          </div>
        </div>

        {/* Dynamic Interactive Revenue Future Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#0F1117] border border-slate-800 rounded-3xl p-6 flex flex-col gap-6">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-widest font-mono flex items-center gap-1.5 border-b border-slate-800 pb-3">
              <TrendingUp className="w-4 h-4" />
              Simulateur d'exploitation financière & Croissance
            </span>

            <div className="flex flex-col gap-4">
              <p className="text-xs text-slate-400 leading-relaxed font-sans font-light">
                Ajustez le prix de l'abonnement mensuel et le ratio estimé de citoyens Stilova Premium pour analyser les perspectives de revenus à l'échelle de l'Afrique et de la diaspora.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                <div className="flex flex-col gap-2 bg-slate-950 p-4 rounded-2xl border border-slate-900">
                  <span className="text-xs text-slate-400 font-bold flex justify-between">
                    <span>Abonnement mensuel :</span>
                    <strong className="text-amber-500 font-mono">{subscriptionPrice} €</strong>
                  </span>
                  <input
                    type="range"
                    min="1.99"
                    max="19.99"
                    step="0.5"
                    value={subscriptionPrice}
                    onChange={(e) => setSubscriptionPrice(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 h-1 rounded-lg bg-slate-800 cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-2 bg-slate-950 p-4 rounded-2xl border border-slate-900">
                  <span className="text-xs text-slate-400 font-bold flex justify-between">
                    <span>Taux d'abonnés Premium :</span>
                    <strong className="text-amber-500 font-mono">{premiumUserRatio} %</strong>
                  </span>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    step="1"
                    value={premiumUserRatio}
                    onChange={(e) => setPremiumUserRatio(parseInt(e.target.value))}
                    className="w-full accent-amber-500 h-1 rounded-lg bg-slate-800 cursor-pointer"
                  />
                </div>
              </div>

              {/* Simulated Multipliers */}
              <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-900">
                <span className="text-xs text-slate-400 font-bold font-mono">Multiplicateur d'audience simulé</span>
                <select
                  value={revenueSliderMultiplier}
                  onChange={(e) => setRevenueSliderMultiplier(parseInt(e.target.value))}
                  className="bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-1 font-mono focus:outline-none"
                >
                  <option value="1">Standard (Audience actuelle : ~1k)</option>
                  <option value="10">Impulsion Médias (x10)</option>
                  <option value="50">Ambition Panafricaine (x50)</option>
                  <option value="200">Expansion Globale (x200)</option>
                </select>
              </div>

              {/* Graphic Plot Custom Sim */}
              <div className="bg-[#050608] border border-slate-900 p-4 rounded-2xl h-44 flex flex-col justify-end gap-2 relative">
                <div className="absolute top-3 left-4 text-[10px] text-slate-500 font-mono">REVENUS ESTIMÉS SELON CROISSANCE (PRÉVISIONS 5 MOIS)</div>
                <svg className="w-full h-28 text-amber-500" viewBox="0 0 400 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d={`M0 90 Q 100 ${90 - (simulatedRevenue / 500)} 200 ${90 - (simulatedRevenue / 200)} T 400 ${Math.max(10, 90 - (simulatedRevenue / 80))}`}
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    className="drop-shadow-[0_2px_10px_rgba(245,158,11,0.2)]"
                  />
                  <circle cx="200" cy={90 - (simulatedRevenue / 200)} r="4" fill="#f59e0b" />
                  <circle cx="400" cy={Math.max(10, 90 - (simulatedRevenue / 80))} r="6" fill="#f59e0b" className="animate-ping" />
                </svg>
                <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>Mois 0</span>
                  <span>Mois +2 (Seuil)</span>
                  <span>Mois +5 (Prévisionnel : {simulatedRevenue * 3} €)</span>
                </div>
              </div>
            </div>
          </div>

          {/* SCRIPTED ACCOUNT FORGERY: Create administrative team */}
          <div className="bg-[#0F1117] border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1 border-b border-slate-800 pb-3">
              <Zap className="w-4 h-4 text-amber-500" />
              Forger un Sceau de Fonction
            </span>
            <p className="text-[11px] text-slate-500 font-light leading-snug">
              En qualité de Fondateur souverain, vous pouvez contourner la hiérarchie standard et créer directement des comptes d'administration d'élites (SUPER_ADMIN, ADMIN, EDITOR, MODERATOR).
            </p>

            <form onSubmit={handleCreateAdminAccount} className="flex flex-col gap-3 mt-1">
              <input
                type="text"
                placeholder="Pseudonyme"
                value={newAdminName}
                required
                onChange={(e) => setNewAdminName(e.target.value)}
                className="w-full bg-[#0a0b0e] border border-slate-800 focus:border-amber-500 text-slate-200 text-xs px-4 py-3 rounded-xl focus:outline-none"
              />
              <input
                type="email"
                placeholder="Adresse e-mail unique"
                value={newAdminEmail}
                required
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="w-full bg-[#0a0b0e] border border-slate-800 focus:border-amber-500 text-slate-200 text-xs px-4 py-3 rounded-xl focus:outline-none"
              />
              <div className="flex flex-col gap-1.5 text-left">
                <span className="text-[10px] text-slate-500 font-mono uppercase pl-1">Fonction attribuée :</span>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as UserRole)}
                  className="bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 w-full"
                >
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Directeur Opérationnel)</option>
                  <option value="ADMIN">ADMIN (Gouvernance Métier)</option>
                  <option value="EDITOR">EDITOR (Qualité Éditoriale)</option>
                  <option value="MODERATOR">MODERATOR (Garde Communautaire)</option>
                </select>
              </div>

              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase cursor-pointer tracking-wider transition mt-1 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Ouvrir les accès de l'Empire</span>
              </button>
            </form>
          </div>
        </div>

        {/* Infrastructure Secrets and Storages details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Storage buckets metrics (Supabase Storage specification) */}
          <div className="bg-[#0F1117] border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
            <span className="text-xs font-bold text-slate-405 uppercase tracking-widest font-mono flex items-center gap-1.5 border-b border-slate-800 pb-3">
              <Database className="w-4 h-4 text-amber-500" />
              Sondes de stockage Supabase Storage
            </span>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs text-slate-300 font-bold">
                  <span>Bucket [avatars]</span>
                  <span className="font-mono text-[11px] text-indigo-400">1.28 MB (92 fichiers)</span>
                </div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: "15%" }} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs text-slate-300 font-bold">
                  <span>Bucket [covers]</span>
                  <span className="font-mono text-[11px] text-indigo-400">5.41 MB (15 fichiers)</span>
                </div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: "42%" }} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs text-slate-300 font-bold">
                  <span>Bucket [illustrations]</span>
                  <span className="font-mono text-[11px] text-indigo-400">12.18 MB (48 fichiers)</span>
                </div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: "71%" }} />
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex justify-between items-center text-[10px] font-mono text-slate-500 mt-2">
                <span>Régularisation CDN</span>
                <span className="text-emerald-500">OPTIMISÉ POUR L'AFRIQUE VIA DNS CLOUDFLARE</span>
              </div>
            </div>
          </div>

          {/* Infrastructure system status secrets and AI models */}
          <div className="lg:col-span-2 bg-[#0F1117] border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-401 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                Variables d'Infrastructure & Secrets Firebase / Supabase
              </span>
              <button
                onClick={() => setRevealSecrets(!revealSecrets)}
                className="text-slate-400 hover:text-white transition"
              >
                {revealSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex flex-col gap-1">
                <span className="text-slate-500">FIREBASE_PROJECT_ID:</span>
                <span className="text-slate-300 select-all">
                  {revealSecrets ? "ai-studio-13866021-5c2f" : "•••••••••••••••••••••••••••••"}
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex flex-col gap-1">
                <span className="text-slate-500">SUPABASE_STORAGE_BUCKET:</span>
                <span className="text-slate-300">
                  {revealSecrets ? "stilova-cdn-storage" : "•••••••••••••••••••••••••••••"}
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex flex-col gap-1">
                <span className="text-slate-500">MOTEUR D'INTELLIGENCE NARRATIVE:</span>
                <span className="text-amber-500">Gemini 2.5 Pro (via @google/genai SDK)</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex flex-col gap-1">
                <span className="text-slate-500">POLICE DE SOUVERAINETÉ (FONDS CULTURES):</span>
                <span className="text-indigo-400">Space Grotesk & JetBrains Mono</span>
              </div>
            </div>

            {/* Realtime Action Feed Sim */}
            <div className="flex flex-col gap-2 mt-2 bg-slate-950 p-4 rounded-2xl border border-slate-900">
              <span className="text-[10px] text-slate-500 font-mono tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Derniers événements de souveraineté enregistrés
              </span>
              <div className="flex flex-col gap-1.5 mt-2 max-h-24 overflow-y-auto">
                {auditLogs.slice(0, 3).map((log) => (
                  <div key={log.id} className="text-[11px] font-mono text-slate-400 flex justify-between gap-4">
                    <span>{log.details}</span>
                    <span className="text-slate-600 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. DASHBOARD SUPER_ADMIN ---
  if (role === "SUPER_ADMIN") {
    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto animate-fade-in text-left">
        <div className="rounded-3xl p-8 border border-slate-800 bg-[#0F1117] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-500/10 border-2 border-teal-500/20 rounded-2xl">
              <ShieldCheck className="w-8 h-8 text-teal-400" />
            </div>
            <div>
              <span className="text-[10px] bg-teal-500/15 border border-teal-500/30 text-teal-400 font-mono font-bold px-3 py-1 rounded-full tracking-wider uppercase">
                ⚙️ DIRECTEUR DE L'EXPLOITATION (SUPER_ADMIN)
              </span>
              <h2 className="text-xl sm:text-2xl font-sans font-black text-white mt-2">
                Pupitre d'Exploitation Stilova
              </h2>
              <p className="text-xs text-slate-400 max-w-xl font-light leading-relaxed mt-0.5">
                Pilotez d'une main d'expert l'écosystème commercial de Stilova. Créez des tournois, nommez ou évaluez des modérateurs, et ordonnez les audits système requis.
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Actions and Management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#0F1117] border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest font-mono border-b border-slate-800 pb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Gouvernance des Rôles & Promotions Citoyennes
            </span>

            <p className="text-xs text-slate-400 leading-relaxed font-light">
              Donnez l'accès aux pupitres de métiers. Identifiez les membres inscrits du catalogue et changez leur rôle système selon l'impératif éditorial.
            </p>

            <div className="max-h-[280px] overflow-y-auto flex flex-col gap-3 mt-1 pr-1">
              {profiles.filter(p => p.role !== "FOUNDER_OWNER").slice(0, 10).map((user) => (
                <div key={user.uid} className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-900 gap-4">
                  <div className="flex items-center gap-3">
                    <img src={user.avatarUrl} className="w-8 h-8 rounded-full border border-slate-800" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{user.displayName}</h4>
                      <span className="text-[10px] text-slate-500">{user.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] px-2 py-0.5 font-bold font-mono border border-slate-800 rounded text-slate-400 bg-slate-900 uppercase">
                      {user.role}
                    </span>
                    <select
                      value={user.role}
                      onChange={(e) => handlePromoteRole(user.uid, e.target.value as UserRole)}
                      className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-2 py-1"
                    >
                      <option value="READER">READER</option>
                      <option value="AUTHOR">AUTHOR</option>
                      <option value="EDITOR">EDITOR</option>
                      <option value="MODERATOR">MODERATOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0F1117] border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono border-b border-slate-800 pb-3 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500 animate-bounce" />
              Tournois Actuels & Concours
            </span>
            <p className="text-[11px] text-slate-500 font-light leading-snug">
              Surveillez la participation de la communauté ou activez un nouveau concours d'écriture de la Plume d'Or.
            </p>

            <div className="flex flex-col gap-3 mt-1">
              {competitions.map((comp) => (
                <div key={comp.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-900 flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-3">
                    <h4 className="text-xs font-bold text-slate-250 truncate">{comp.title}</h4>
                    <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 font-bold rounded uppercase">
                      {comp.isOpen ? "Ouvert" : "Clos"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-light line-clamp-2">{comp.description}</p>
                </div>
              ))}
              <button
                onClick={() => changeRoute("admin")}
                className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase cursor-pointer transition border border-indigo-505"
              >
                Gérer les défis littéraires
              </button>
            </div>
          </div>
        </div>

        {/* Audit Log Overview */}
        <div className="bg-[#0F1117] border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
          <span className="text-xs font-bold text-slate-402 uppercase tracking-widest font-mono border-b border-slate-800 pb-3 flex items-center gap-1">
            <Key className="w-4 h-4" />
            Audit récent de l'Empire
          </span>
          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="bg-slate-950 p-4 rounded-xl border border-slate-900 text-[11px] font-mono flex flex-col sm:flex-row sm:justify-between gap-1">
                <div>
                  <span className="text-indigo-400">[{log.action}]</span> <span className="text-slate-300">{log.details}</span>
                </div>
                <span className="text-slate-500 shrink-0">Par {log.performedByName} • {new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- 3. DASHBOARD ADMIN ---
  if (role === "ADMIN") {
    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto animate-fade-in text-left">
        <div className="rounded-3xl p-8 border border-slate-800 bg-[#0F1117] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 border-2 border-amber-500/20 rounded-2xl">
              <Shield className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <span className="text-[10px] bg-amber-500/15 border border-amber-500/30 text-amber-500 font-mono font-bold px-3 py-1 rounded-full tracking-wider uppercase">
                🛡️ GOUVERNANCE QUOTIDIENNE (ADMIN)
              </span>
              <h2 className="text-xl sm:text-2xl font-sans font-black text-white mt-2">
                Panneau Administratif de Stilova
              </h2>
              <p className="text-xs text-slate-400 max-w-xl font-light font-sans mt-0.5">
                Surveillez les inscriptions, configurez les catégories d'écritures ancestrales, suspendez ou rétablissez les comptes et gérez les grands tournois.
              </p>
            </div>
          </div>
          <button
            onClick={() => changeRoute("admin")}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-3 rounded-2xl text-xs uppercase cursor-pointer"
          >
            Sceaux Admin Général
          </button>
        </div>

        {/* Admin stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0F1117] border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono border-b border-slate-800 pb-3">
              Membres Royaux
            </span>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-slate-450">Citoyens enregistrés :</span>
              <strong className="text-xl font-mono text-white">{profiles.length}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-450">Auteurs actifs :</span>
              <strong className="text-xl font-mono text-amber-500">
                {profiles.filter(p => p.role === "AUTHOR").length || 3}
              </strong>
            </div>
            <button
              onClick={() => changeRoute("admin")}
              className="mt-2 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold uppercase cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <span>Accéder aux dossiers citoyens</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Ban/Suspension quick list */}
          <div className="bg-[#0F1117] border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono border-b border-slate-800 pb-3">
              Statuts & Suspensions Citoyennes
            </span>
            <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-1">
              {profiles.filter(p => p.role !== "FOUNDER_OWNER").slice(0, 5).map((user) => (
                <div key={user.uid} className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-900 gap-3">
                  <div>
                    <h5 className="text-xs font-bold text-slate-300">{user.displayName}</h5>
                    <span className="text-[9px] text-slate-500 select-all">{user.role}</span>
                  </div>

                  <button
                    onClick={() => handleToggleSuspension(user)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                      user.suspended
                        ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                        : "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                    }`}
                  >
                    {user.suspended ? "Rétablir" : "Suspendre"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Featured items */}
          <div className="bg-[#0F1117] border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono border-b border-slate-800 pb-3">
              Mises en avant
            </span>
            <p className="text-[11px] text-slate-500 leading-relaxed font-light">
              Mettez en avant vos histoires en les affichant sur la page d'accueil de la bibliothèque.
            </p>
            <div className="flex flex-col gap-3 pr-1 max-h-44 overflow-y-auto">
              {stories.slice(0, 3).map((st) => (
                <div key={st.id} className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-900 gap-3">
                  <span className="text-xs text-slate-300 truncate font-semibold">{st.title}</span>
                  <span className="text-[9px] font-bold uppercase rounded text-amber-500 border border-amber-500/20 bg-amber-500/5 px-2 py-0.5">
                    En vedette
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 4. DASHBOARD EDITOR ---
  if (role === "EDITOR") {
    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto animate-fade-in text-left">
        <div className="rounded-3xl p-8 border border-slate-801 bg-[#0F1117] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-550/10 border-2 border-amber-505/20 rounded-2xl">
              <BookMarked className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <span className="text-[10px] bg-amber-500/15 border border-amber-500/30 text-amber-500 font-mono font-bold px-3 py-1 rounded-full tracking-wider uppercase">
                📖 DIRECTEUR DE LA CRITIQUE (EDITOR)
              </span>
              <h2 className="text-xl sm:text-2xl font-sans font-black text-white mt-2">
                Pupitre Éditorial Stilova
              </h2>
              <p className="text-xs text-slate-400 max-w-xl font-light font-sans mt-0.5">
                Relisez les œuvres d'art littéraire proposées par les auteurs, déposez vos annotations constructives et faites briller le talent.
              </p>
            </div>
          </div>
          <button
            onClick={() => changeRoute("editorial")}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-3 rounded-2xl text-xs uppercase cursor-pointer"
          >
            Arène de relecture
          </button>
        </div>

        {/* Editor dashboard lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#0F1117] border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-widest font-mono border-b border-slate-800 pb-3 flex items-center gap-2">
              <Star className="w-4 h-4" />
              Œuvres à relire & Annoter
            </span>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-xs text-slate-400 font-mono">Sélectionner une œuvre active :</span>
                <select
                  value={selectedReviewStoryId}
                  onChange={(e) => setSelectedReviewStoryId(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 w-full"
                >
                  <option value="">-- Sélectionner un récit --</option>
                  {stories.map(st => (
                    <option key={st.id} value={st.id}>{st.title} (Par {st.authorName})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs text-slate-400 font-mono font-bold">Rédiger l'annotation de relecture :</span>
                <textarea
                  placeholder="Décrivez les mérites stylistiques ou proposez des corrections de transition de chapitre..."
                  value={annotationValue}
                  onChange={(e) => setAnnotationValue(e.target.value)}
                  rows={3}
                  className="w-full bg-[#0a0b0e] border border-slate-800 focus:border-amber-500 text-slate-200 text-xs p-3 rounded-xl focus:outline-none resize-none"
                />
              </div>

              <button
                onClick={handleAddAnnotation}
                disabled={!selectedReviewStoryId || !annotationValue.trim()}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold py-3 px-4 rounded-xl text-xs uppercase cursor-pointer tracking-wider transition self-start"
              >
                Graver l'annotation
              </button>
            </div>
          </div>

          <div className="bg-[#0F1117] border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
            <span className="text-xs font-bold text-slate-400 tracking-widest font-mono border-b border-slate-800 pb-3 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              Récentes Sélections Édito
            </span>
            <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
              {annotations.map((ann, idx) => (
                <div key={ann.id || idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-900 flex flex-col gap-1 text-left">
                  <h5 className="text-xs font-bold text-amber-500">{ann.storyTitle}</h5>
                  <p className="text-[10px] text-slate-400 leading-snug font-serif italic">« {ann.text} »</p>
                  <span className="text-[9px] text-slate-600 mt-1">Par {ann.editorName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 5. DASHBOARD MODERATOR ---
  if (role === "MODERATOR") {
    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto animate-fade-in text-left">
        <div className="rounded-3xl p-8 border border-slate-800 bg-[#0F1117] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-500/10 border-2 border-rose-500/20 rounded-2xl">
              <Shield className="w-8 h-8 text-rose-500" />
            </div>
            <div>
              <span className="text-[10px] bg-rose-500/15 border border-rose-500/30 text-rose-500 font-mono font-bold px-3 py-1 rounded-full tracking-wider uppercase">
                👮 CHEFT DE LA MILICE (MODERATOR)
              </span>
              <h2 className="text-xl sm:text-2xl font-sans font-black text-white mt-2">
                Sanctuaire de Modération Community
              </h2>
              <p className="text-xs text-slate-400 max-w-xl font-light leading-relaxed mt-0.5 animate-pulse">
                Examinez les signalements, suspendez le contenu offensant et protégez la paix créative de la communauté.
              </p>
            </div>
          </div>
          <button
            onClick={() => changeRoute("mods")}
            className="bg-rose-600 hover:bg-rose-550 text-white font-bold px-5 py-3 rounded-2xl text-xs uppercase cursor-pointer"
          >
            Arène de modération
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#0F1117] border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
            <span className="text-xs font-bold text-rose-500 uppercase tracking-widest font-mono border-b border-rose-800 pb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Contenus Signalés ou Suspects ({reportedStories.length})
            </span>

            {reportedStories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                <Check className="w-10 h-10 text-emerald-500 border border-emerald-500/20 rounded-full p-2" />
                <h4 className="text-xs font-bold text-slate-300">Aucun signalement actif recensé</h4>
                <p className="text-[10px] text-slate-500 max-w-xs">La communauté Stilova respecte pleinement la charte de comportement éthique.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 mt-1">
                {reportedStories.map((story) => (
                  <div key={story.id} className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-900 gap-4">
                    <div className="flex items-center gap-3">
                      <img src={story.coverUrl} className="w-10 h-14 object-cover rounded-xl" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{story.title}</h4>
                        <span className="text-[10px] text-slate-500">Par {story.authorName}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleModerateReport(story, false)}
                        className="bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-550 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition"
                      >
                        Disculper
                      </button>
                      <button
                        onClick={() => handleModerateReport(story, true)}
                        className="bg-rose-500/10 hover:bg-rose-500/25 text-rose-500 border border-rose-500/20 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition"
                      >
                        Masquer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#0F1117] border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono border-b border-slate-800 pb-3 flex items-center gap-1.5">
              <Ban className="w-4 h-4 text-rose-500" />
              Historique des Sanctions
            </span>
            <p className="text-[11px] text-slate-500 font-light leading-snug">
              Examinez la liste des avertissements expédiés aujourd'hui aux citoyens d'écriture.
            </p>
            <div className="flex flex-col gap-2 bg-slate-950 p-4 rounded-2xl border border-slate-900 text-xs font-mono text-slate-550">
              <span>[06:01:42] Avertissement mineur notifié au créateur mansa_griot (mots offensants).</span>
              <span className="border-t border-slate-900 pt-1.5 mt-1.5">[Hier] Retrait sanction accordisé après examen dossier.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 6. DASHBOARD AUTHOR ---
  if (role === "AUTHOR") {
    const myStoriesDraft = stories.filter(s => s.authorId === currentUser.uid && !s.isPublished);
    const myStoriesPublished = stories.filter(s => s.authorId === currentUser.uid && s.isPublished);
    const totalViews = stories.reduce((acc, current) => acc + (current.authorId === currentUser.uid ? current.viewsCount : 0), 0);
    
    // Calculate simulated compensation
    const simulatedRoyalties = Math.round(totalViews * 0.05);

    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto animate-fade-in text-left">
        <div className="rounded-3xl p-8 border border-slate-800 bg-[#0F1117] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 border-2 border-amber-500/20 rounded-2xl">
              <PenTool className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <span className="text-[10px] bg-amber-500/15 border border-amber-500/30 text-amber-500 font-mono font-bold px-3 py-1 rounded-full tracking-wider uppercase">
                ✒️ ARTISTE PLUME (AUTHOR)
              </span>
              <h2 className="text-xl sm:text-2xl font-sans font-black text-white mt-1.5">
                Atelier Littéraire de {currentUser.displayName}
              </h2>
              <p className="text-xs text-slate-400 max-w-xl font-light font-sans mt-0.5 leading-relaxed">
                Suivez l'intérêt de vos lecteurs, peaufinez vos brouillons interactifs à embranchements multiples et réclamez vos parts d'or simulées.
              </p>
            </div>
          </div>
          <button
            onClick={() => changeRoute("atelier")}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-2xl text-xs uppercase cursor-pointer transition shadow"
          >
            Nouveau Chapitre / Récit
          </button>
        </div>

        {/* Dashboard Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0F1117] border border-slate-800 rounded-3xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-mono font-bold">Œuvres gravées</span>
              <h4 className="text-xl font-black text-white font-mono mt-0.5">{myStoriesDraft.length + myStoriesPublished.length} récits</h4>
            </div>
          </div>

          <div className="bg-[#0F1117] border border-slate-800 rounded-3xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-mono font-bold">Lectures cumulées</span>
              <h4 className="text-xl font-black text-white font-mono mt-0.5">{totalViews} vues</h4>
            </div>
          </div>

          <div className="bg-[#0F1117] border border-slate-800 rounded-3xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-mono font-bold">Royalties simulées</span>
              <h4 className="text-xl font-black text-emerald-400 font-mono mt-0.5">{simulatedRoyalties} €</h4>
            </div>
          </div>
        </div>

        {/* Specific content Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#0F1117] border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono border-b border-slate-800 pb-3 flex items-center gap-1.5">
              <FolderHeart className="w-4 h-4 text-indigo-400" />
              Mes Créations Actives (Publiées & Brouillons)
            </span>

            {myStoriesDraft.length + myStoriesPublished.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                <PenTool className="w-10 h-10 text-slate-700 animate-pulse" />
                <h4 className="text-xs font-bold text-slate-400">Aucun manuscrit trouvé</h4>
                <p className="text-[10px] text-slate-505">Amorcez votre plume en rejoignant l'atelier de création interactive.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {[...myStoriesPublished, ...myStoriesDraft].map((story) => (
                  <div key={story.id} className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-900 gap-4">
                    <div className="flex items-center gap-3">
                      <img src={story.coverUrl} className="w-10 h-14 object-cover rounded-xl" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{story.title}</h4>
                        <span className="text-[9px] px-2 py-0.5 bg-slate-900 text-amber-500 border border-slate-800 font-bold font-mono rounded uppercase">
                          {story.genre}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        story.isPublished ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                      }`}>
                        {story.isPublished ? "Publié" : "Brouillon"}
                      </span>
                      <button
                        onClick={() => changeRoute("atelier")}
                        className="bg-slate-900 hover:bg-slate-850 p-2 border border-slate-800 rounded-xl text-slate-300 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#0F1117] border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono border-b border-slate-800 pb-3 flex items-center gap-1">
              <Trophy className="w-4 h-4 text-amber-500" />
              Concours de Recrutement Actifs
            </span>
            <p className="text-[11px] text-slate-500 leading-snug font-light">
              Rejoignez les tournois impériaux en cours pour concourir pour de l'or d'écriture Stilova.
            </p>
            {competitions.slice(0, 2).map((comp) => (
              <div key={comp.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-900 flex flex-col gap-1.5 text-left">
                <h5 className="text-xs font-bold text-slate-350">{comp.title}</h5>
                <span className="text-[9px] text-amber-500 font-mono font-bold">🏆 Prix : {comp.prizeAmount}</span>
                <button
                  onClick={() => changeRoute("contests")}
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-[10px] font-bold py-2 px-3 rounded-lg uppercase tracking-wide transition mt-1"
                >
                  Soumettre un chapitre
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- 7. DASHBOARD READER ---
  // If the user's role is "READER"
  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto animate-fade-in text-left">
      <div className="rounded-3xl p-8 border border-slate-800 bg-[#0F1117] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 border-2 border-indigo-500/20 rounded-2xl">
            <BookOpen className="w-8 h-8 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-mono font-bold px-3 py-1 rounded-full tracking-wider uppercase">
              📓 CITOYEN DE LECTURE (READER)
            </span>
            <h2 className="text-xl sm:text-2xl font-sans font-black text-white mt-1.5">
              Bienvenue dans votre sanctuaire, {currentUser.displayName}
            </h2>
            <p className="text-xs text-slate-400 max-w-xl font-light font-sans mt-0.5 leading-relaxed">
              Explorez le grand catalogue interactif panafricain, votez pour vos histoires favorites et suivez des plumes exceptionnelles.
            </p>
          </div>
        </div>
        <button
          onClick={() => changeRoute("discover")}
          className="bg-indigo-600 hover:bg-indigo-550 text-white font-bold px-6 py-3 rounded-2xl text-xs uppercase cursor-pointer"
        >
          Parcourir les Fictions
        </button>
      </div>

      {/* Reader stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#0F1117] border border-slate-800 rounded-3xl p-5 flex items-center gap-3">
          <BookMarked className="w-8 h-8 text-amber-550" />
          <div>
            <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider font-bold">Ma Bibliothèque</span>
            <h4 className="text-sm font-bold text-white font-mono">{stories.slice(0, 3).length} favoris</h4>
          </div>
        </div>

        <div className="bg-[#0F1117] border border-slate-800 rounded-3xl p-5 flex items-center gap-3">
          <Award className="w-8 h-8 text-indigo-400" />
          <div>
            <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider font-bold">Niveau de lecture</span>
            <h4 className="text-sm font-bold text-white font-mono">Initié (Rang II)</h4>
          </div>
        </div>

        <div className="bg-[#0F1117] border border-slate-800 rounded-3xl p-5 flex items-center gap-3">
          <Users className="w-8 h-8 text-indigo-400" />
          <div>
            <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider font-bold">Plumes suivies</span>
            <h4 className="text-sm font-bold text-white font-mono">{followedAuthors.length} auteurs</h4>
          </div>
        </div>

        <div className="bg-[#0F1117] border border-slate-800 rounded-3xl p-5 flex items-center gap-3">
          <Activity className="w-8 h-8 text-emerald-400 animate-pulse" />
          <div>
            <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider font-bold">Série quotidienne</span>
            <h4 className="text-sm font-bold text-white font-mono">5 jours d'affilée</h4>
          </div>
        </div>
      </div>

      {/* Recommended curated list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#0F1117] border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono border-b border-slate-800 pb-3 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Recommandations à emporter d'urgence
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stories.slice(0, 4).map((story) => (
              <div
                key={story.id}
                onClick={() => handleOpenStoryReader(story.id)}
                className="p-4 bg-slate-950 border border-slate-900 hover:border-indigo-500/45 rounded-2xl flex gap-3 cursor-pointer transition transform hover:-translate-y-1"
              >
                <img src={story.coverUrl} className="w-12 h-18 object-cover rounded-xl" />
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 truncate">{story.title}</h4>
                    <span className="text-[9px] text-slate-450 italic mt-0.5 block">Par {story.authorName}</span>
                  </div>
                  <span className="text-[9px] uppercase font-bold text-amber-500">⭐ {story.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Followed Authors Panel */}
        <div className="bg-[#0F1117] border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono border-b border-slate-800 pb-3 flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-rose-500" />
            Mes Plumes Souveraines (Suivis)
          </span>
          <p className="text-[11px] text-slate-500 font-light leading-snug">
            Suivez vos conteurs favoris pour être notifié immédiatement de la parution de nouvelles branches narratives ou de contes interactifs.
          </p>

          <div className="flex flex-col gap-3 mt-1">
            {["Abdoulaye Diallo", "Kemi Adebayo", "Amara Seye", "Mansa Folki"].map((authorName) => {
              const isFollowing = followedAuthors.includes(authorName);
              return (
                <div key={authorName} className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-900 gap-3">
                  <span className="text-xs text-slate-250 font-bold">{authorName}</span>
                  <button
                    onClick={() => handleToggleFollow(authorName)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase cursor-pointer transition ${
                      isFollowing
                        ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                        : "bg-indigo-600 hover:bg-indigo-550 text-white"
                    }`}
                  >
                    {isFollowing ? "Suivi" : "Suivre"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

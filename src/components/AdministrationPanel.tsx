import React, { useState, useEffect } from "react";
import { Story, Competition, UserProfile, AuditLog, UserRole } from "../types";
import { dbService, auth } from "../firebase";
import { 
  Sliders, Users, Hammer, Trophy, Key, Server, 
  RefreshCw, CheckCircle, Save, Plus, Ban, Power, UserCheck,
  TrendingUp, BarChart2, DollarSign, Database, ShieldAlert,
  HardDrive, Activity, Eye, EyeOff, Radio, BookOpen, Layers, Star
} from "lucide-react";

interface AdministrationPanelProps {
  stories: Story[];
  onRefreshStories: () => void;
  currentUser: UserProfile;
}

export default function AdministrationPanel({ stories, onRefreshStories, currentUser }: AdministrationPanelProps) {
  // Determine standard loadable tabs depending on Role
  const role = currentUser.role;

  // Set default tab based on role
  const getDefaultTab = () => {
    if (role === "FOUNDER_OWNER") return "executive";
    if (role === "SUPER_ADMIN") return "operational";
    return "management";
  };

  const [activeTab, setActiveTab] = useState<string>(getDefaultTab());
  const [loading, setLoading] = useState(true);

  // Core administrative states
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [genresList, setGenresList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Submitting state
  const [submitting, setSubmitting] = useState<string | null>(null);

  // Category creation state
  const [newGenreName, setNewGenreName] = useState("");
  const [newGenreDesc, setNewGenreDesc] = useState("");

  // Competition creation state
  const [compTitle, setCompTitle] = useState("");
  const [compTheme, setCompTheme] = useState("");
  const [compDesc, setCompDesc] = useState("");
  const [compPrize, setCompPrize] = useState("");
  const [compDeadline, setCompDeadline] = useState("");

  // System settings states
  const [maxUploadSize, setMaxUploadSize] = useState<number>(5.5); // MB
  const [allowPublicRegistrations, setAllowPublicRegistrations] = useState<boolean>(true);
  const [griotCopilotEngineVer, setGriotCopilotEngineVer] = useState<string>("gemini-2.5-pro");
  const [automaticSignatures, setAutomaticSignatures] = useState<boolean>(true);

  // Founder exclusive states
  const [revealSecrets, setRevealSecrets] = useState(false);
  const [subscriptionPrice, setSubscriptionPrice] = useState(4.99); // USD/month simulation
  const [premiumUserRatio, setPremiumUserRatio] = useState(15); // % ratio

  useEffect(() => {
    loadAdminConfig();
  }, [stories, activeTab]);

  const loadAdminConfig = async () => {
    setLoading(true);
    try {
      // 1. Load users profiles
      const usersList = await dbService.listProfiles();
      setProfiles(usersList);

      // 2. Load competitions list
      const compsList = await dbService.listCompetitions();
      setCompetitions(compsList);

      // 3. Load all audit logs (only for FOUNDER_OWNER & SUPER_ADMIN)
      if (role === "FOUNDER_OWNER" || role === "SUPER_ADMIN") {
        const logsList = await dbService.listAuditLogs();
        setAuditLogs(logsList);
      }

      // 4. Load current genres list
      const savedGenres = localStorage.getItem("stilova_categories_list");
      if (savedGenres) {
        setGenresList(JSON.parse(savedGenres));
      } else {
        const defaultGenres = [
          { name: "Afrofuturisme", desc: "Science-fiction, technologies quantiques et cités volantes." },
          { name: "Mythologie", desc: "Divinités royales, codes de bravoure, et masques magiques." },
          { name: "Histoire / Chronique", desc: "Sagas d'épopées inspirées de l'histoire et des empires du Sahel." },
          { name: "Roman d'Amour", desc: "Chroniques sentimentales et poésie romantique africaine." },
          { name: "Drame Social", desc: "Frictions d'aujourd'hui et chroniques familiales intenses." }
        ];
        setGenresList(defaultGenres);
        localStorage.setItem("stilova_categories_list", JSON.stringify(defaultGenres));
      }

      // Load parameters
      const params = localStorage.getItem("stilova_sys_parameters");
      if (params) {
        const parsed = JSON.parse(params);
        setMaxUploadSize(parsed.maxUploadSize || 5.5);
        setAllowPublicRegistrations(parsed.allowPublicRegistrations ?? true);
        setGriotCopilotEngineVer(parsed.griotCopilotEngineVer || "gemini-2.5-pro");
        setAutomaticSignatures(parsed.automaticSignatures ?? true);
      }

    } catch (e) {
      console.error("[Admin Config] Failed to load:", e);
    } finally {
      setLoading(false);
    }
  };

  const createAndSaveAuditLog = async (action: string, targetUid: string, targetName: string, details: string) => {
    const newLog: AuditLog = {
      id: "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      action,
      performedBy: currentUser.uid,
      performedByName: currentUser.displayName,
      targetUserId: targetUid,
      targetUserName: targetName,
      details,
      timestamp: new Date().toISOString()
    };
    await dbService.saveAuditLog(newLog);
  };

  // RBAC permissions helper
  const canUpdateRoleOf = (target: UserProfile): boolean => {
    if (role === "FOUNDER_OWNER") {
      return target.uid !== currentUser.uid; // FO can edit anyone except self
    }
    if (role === "SUPER_ADMIN") {
      // SA can edit ADMIN, EDITOR, MODERATOR, AUTHOR, READER but NOT FounderOwner
      return target.role !== "FOUNDER_OWNER" && target.uid !== currentUser.uid;
    }
    // ADMIN cannot change roles
    return false;
  };

  const getSelectableRolesFor = (target: UserProfile): UserRole[] => {
    if (role === "FOUNDER_OWNER") {
      return ["READER", "AUTHOR", "EDITOR", "MODERATOR", "ADMIN", "SUPER_ADMIN"];
    }
    if (role === "SUPER_ADMIN") {
      return ["READER", "AUTHOR", "EDITOR", "MODERATOR", "ADMIN"];
    }
    return [];
  };

  const canSuspendOrBan = (target: UserProfile): boolean => {
    if (target.role === "FOUNDER_OWNER" || target.uid === currentUser.uid) return false;
    if (role === "FOUNDER_OWNER") return true;
    if (role === "SUPER_ADMIN") {
      // SA can suspend/ban anyone except FounderOwner and other SAs (if desired, keep it strictly higher)
      return target.role !== "SUPER_ADMIN";
    }
    if (role === "ADMIN") {
      // ADMIN can only suspend/ban READER, AUTHOR, EDITOR, MODERATOR. NOT FOUNDER_OWNER or SUPER_ADMIN or other ADMINs.
      return !["FOUNDER_OWNER", "SUPER_ADMIN", "ADMIN"].includes(target.role);
    }
    return false;
  };

  // Actions: RBAC Users Role update
  const handleUpdateRole = async (targetUser: UserProfile, newRole: UserRole) => {
    if (!canUpdateRoleOf(targetUser)) return;
    setSubmitting(targetUser.uid);
    try {
      const updatedProfile: UserProfile = {
        ...targetUser,
        role: newRole,
        updatedAt: new Date().toISOString()
      };
      await dbService.saveProfile(updatedProfile);
      await createAndSaveAuditLog(
        "MUTA_ROLE_RBAC",
        targetUser.uid,
        targetUser.displayName,
        `Changement de rôle de ${targetUser.role} vers ${newRole}`
      );
      loadAdminConfig();
    } catch (e) {
      console.error("Failed to update role", e);
    } finally {
      setSubmitting(null);
    }
  };

  const handleToggleSuspension = async (targetUser: UserProfile) => {
    if (!canSuspendOrBan(targetUser)) return;
    setSubmitting(targetUser.uid);
    try {
      const updatedProfile: UserProfile = {
        ...targetUser,
        suspended: !targetUser.suspended,
        updatedAt: new Date().toISOString()
      };
      await dbService.saveProfile(updatedProfile);
      await createAndSaveAuditLog(
        updatedProfile.suspended ? "SUSPENSION_COMPTE" : "LIFT_SUSPENSION",
        targetUser.uid,
        targetUser.displayName,
        updatedProfile.suspended 
          ? "Suspension temporaire pour manquement à la charte Stilova." 
          : "Fin de suspension temporaire."
      );
      loadAdminConfig();
    } catch (e) {
      console.error("Failed to suspend", e);
    } finally {
      setSubmitting(null);
    }
  };

  const handleToggleBan = async (targetUser: UserProfile) => {
    if (!canSuspendOrBan(targetUser)) return;
    setSubmitting(targetUser.uid);
    try {
      const updatedProfile: UserProfile = {
        ...targetUser,
        banned: !targetUser.banned,
        suspended: false,
        updatedAt: new Date().toISOString()
      };
      await dbService.saveProfile(updatedProfile);
      await createAndSaveAuditLog(
        updatedProfile.banned ? "BAN_COMPTE" : "LIFT_BAN",
        targetUser.uid,
        targetUser.displayName,
        updatedProfile.banned 
          ? "Bannissement permanent souverain de la plateforme." 
          : "Restauration d'accès après bannissement."
      );
      loadAdminConfig();
    } catch (e) {
      console.error("Failed to toggle ban", e);
    } finally {
      setSubmitting(null);
    }
  };

  // Actions: Categories management
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGenreName.trim()) return;

    const newGen = {
      name: newGenreName.trim(),
      desc: newGenreDesc.trim() || "Aucun descriptif pour cette catégorie d'écriture."
    };

    const updated = [...genresList, newGen];
    setGenresList(updated);
    localStorage.setItem("stilova_categories_list", JSON.stringify(updated));
    setNewGenreName("");
    setNewGenreDesc("");
    createAndSaveAuditLog("MUTATION_GENRE_BIBLIO", "system", "Category", `Création de l'univers narratif : ${newGen.name}`);
  };

  // Actions: Concours management
  const handleCreateCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compTitle.trim() || !compTheme.trim()) return;

    const newComp: Competition = {
      id: "comp_" + Date.now(),
      title: compTitle.trim(),
      description: compDesc.trim() || `Défi littéraire de plume africaine : ${compTitle}`,
      theme: compTheme.trim(),
      deadline: compDeadline || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0],
      prizeAmount: compPrize.trim() || "Consécration impériale",
      submissionsCount: 0,
      isOpen: true,
      createdAt: new Date().toISOString()
    };

    try {
      await dbService.saveCompetition(newComp);
      await createAndSaveAuditLog("CREATION_CONCOURS", "system", "Contest", `Création d'un défi : ${newComp.title}`);
      
      setCompTitle("");
      setCompTheme("");
      setCompDesc("");
      setCompPrize("");
      setCompDeadline("");
      loadAdminConfig();
    } catch (err) {
      console.error(err);
    }
  };

  // Actions: System Parameters update
  const handleSaveParameters = (e: React.FormEvent) => {
    e.preventDefault();
    const config = {
      maxUploadSize,
      allowPublicRegistrations,
      griotCopilotEngineVer,
      automaticSignatures
    };

    localStorage.setItem("stilova_sys_parameters", JSON.stringify(config));
    createAndSaveAuditLog("MAJ_PARAMETRES_SYSTEME", "system", "Settings", `Configuration mise à jour.`);
    alert("Paramètres système sauvegardés avec succès !");
  };

  // Feature / unfeature story list action
  const handleToggleStoryFeature = async (story: Story) => {
    try {
      const updated = {
        ...story,
        isFeatured: !story.isFeatured,
        updatedAt: new Date().toISOString()
      };
      await dbService.saveStory(updated);
      createAndSaveAuditLog(
        "MISE_EN_AVANT_STORY", 
        story.authorId, 
        story.authorName, 
        `Mise en avant configurée à [${updated.isFeatured}] pour "${story.title}"`
      );
      onRefreshStories();
    } catch (e) {
      console.error(e);
    }
  };

  // Delete story action
  const handleDeleteStory = async (storyId: string, title: string) => {
    if (!window.confirm(`Confirmez-vous le retrait de l'œuvre "${title}" ?`)) return;
    try {
      await dbService.deleteStory(storyId);
      createAndSaveAuditLog("RETRAIT_HISTOIRE_SOUS_SCO", "system", "Story", `L'histoire "${title}" a été d'office radiée du catalogue.`);
      onRefreshStories();
    } catch (e) {
      console.error(e);
    }
  };

  // Filter listings based on search match
  const filteredProfiles = profiles.filter(p => 
    p.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center p-20 min-h-[400px]">
        <RefreshCw className="w-10 h-10 text-amber-550 animate-spin" />
        <span className="font-sans font-medium text-xs text-slate-400">Consultation des Sceaux Sécurisés de l'Empire Admin...</span>
      </div>
    );
  }

  // Calculated estimates
  const calculatedFutureRevenue = Math.round(profiles.length * (premiumUserRatio / 100) * subscriptionPrice);

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto px-4 pb-16 animate-fade-in text-left">
      
      {/* Brand Header */}
      <div className="bg-gradient-to-r from-slate-900 via-[#1e1b4b]/20 to-transparent p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
            <Sliders className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <span className="text-[10px] bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
              Consilium Imperator : {role}
            </span>
            <h2 className="font-sans font-extrabold text-slate-100 text-lg md:text-2xl mt-1">
              {role === "FOUNDER_OWNER" && "Fonderie Royale & Haute Direction Stilova"}
              {role === "SUPER_ADMIN" && "Consilium Operational & Direction de l'Exploitation"}
              {role === "ADMIN" && "Gouvernance Quotidienne & Gestion Métier"}
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5 max-w-2xl leading-relaxed">
              {role === "FOUNDER_OWNER" && "Panoramique décisionnel souverain de Stilova. Surveillez la croissance, gérez les clés d'infrastructure, administrez l'entièreté des comptes et examinez la santé globale des coffres."}
              {role === "SUPER_ADMIN" && "Pilotez l'exploitation de la plateforme. Proposez de nouveaux tournois, promouvez des rôles, modérez les récits et examinez les logs d'audits du jour."}
              {role === "ADMIN" && "Ajustez les univers de lecture de Stilova, suspendez ou réactivez les comptes citoyens, et configurez les récits recommandés en bannière générale."}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs selectors bar based strictly on role permissions */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-px">
        
        {/* Founder Exclusive Tab */}
        {role === "FOUNDER_OWNER" && (
          <button
            onClick={() => setActiveTab("executive")}
            className={`px-5 py-3 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "executive" ? "border-amber-500 text-amber-500" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Vue Exécutive</span>
          </button>
        )}

        {/* Super Admin Exclusive Tab */}
        {role === "SUPER_ADMIN" && (
          <button
            onClick={() => setActiveTab("operational")}
            className={`px-5 py-3 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "operational" ? "border-amber-500 text-amber-500" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Vue Opérationnelle</span>
          </button>
        )}

        {/* Admin Exclusive Tab */}
        {role === "ADMIN" && (
          <button
            onClick={() => setActiveTab("management")}
            className={`px-5 py-3 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "management" ? "border-amber-500 text-amber-500" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Vue Gestion</span>
          </button>
        )}

        {/* Shared Tab: Users Grid (all three but with different permissions) */}
        <button
          onClick={() => setActiveTab("users")}
          className={`px-5 py-3 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "users" ? "border-indigo-400 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Membres & Droits ({profiles.length})</span>
        </button>

        {/* Shared: Categories management (ADMIN, FOUNDER_OWNER) */}
        {["FOUNDER_OWNER", "ADMIN"].includes(role) && (
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-5 py-3 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "categories" ? "border-indigo-400 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Catégories ({genresList.length})</span>
          </button>
        )}

        {/* Shared: Concours Tournament */}
        <button
          onClick={() => setActiveTab("concours")}
          className={`px-5 py-3 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "concours" ? "border-indigo-400 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Concours ({competitions.length})</span>
        </button>

        {/* Content Moderation listings for Founder and SuperAdmin */}
        {["FOUNDER_OWNER", "SUPER_ADMIN", "ADMIN"].includes(role) && (
          <button
            onClick={() => setActiveTab("contenus")}
            className={`px-5 py-3 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "contenus" ? "border-indigo-400 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Contenus ({stories.length})</span>
          </button>
        )}

        {/* Founder exclusive Infrastructure parameters & Secrets */}
        {role === "FOUNDER_OWNER" && (
          <button
            onClick={() => setActiveTab("infra_store")}
            className={`px-5 py-3 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "infra_store" ? "border-indigo-400 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Infrastructure & Secrets</span>
          </button>
        )}

        {/* Audit Logs (Founder, SuperAdmin) */}
        {["FOUNDER_OWNER", "SUPER_ADMIN"].includes(role) && (
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-5 py-3 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "logs" ? "border-indigo-400 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Journaux d'Audit</span>
          </button>
        )}

      </div>

      {/* Main Board Panels */}
      <div className="bg-[#0F1117] border border-slate-800 p-6 rounded-3xl min-h-[350px]">
        
        {/* ========================================== */}
        {/* 1. DASHBOARD FOUNDER_OWNER EXECUTIVE TAB   */}
        {/* ========================================== */}
        {activeTab === "executive" && role === "FOUNDER_OWNER" && (
          <div className="flex flex-col gap-6 animate-fade-in text-left">
            <h3 className="text-xs font-extrabold text-amber-500 uppercase tracking-widest font-mono">Consortium Exécutif Souverain</h3>
            
            {/* Quick stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-900 flex flex-col gap-2">
                <span className="text-[10px] text-slate-500 font-sans uppercase font-bold tracking-wider">Citoyens Stilova</span>
                <span className="text-2xl font-black text-white font-mono">{profiles.length}</span>
                <span className="text-[9.5px] text-emerald-500 font-mono">↑ 100% Organique</span>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-900 flex flex-col gap-2">
                <span className="text-[10px] text-slate-500 font-sans uppercase font-bold tracking-wider">Histoires Gravées</span>
                <span className="text-2xl font-black text-white font-mono">{stories.length}</span>
                <span className="text-[9.5px] text-indigo-400 font-mono">{stories.filter(s => s.isInteractive).length} Interactives</span>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-900 flex flex-col gap-2">
                <span className="text-[10px] text-slate-500 font-sans uppercase font-bold tracking-wider">Audits Catalogués</span>
                <span className="text-2xl font-black text-white font-mono">{auditLogs.length}</span>
                <span className="text-[9.5px] text-amber-500 font-mono">Sceaux immuables</span>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-amber-500/20 flex flex-col gap-2 shadow-inner bg-gradient-to-tr from-amber-550/5 to-transparent">
                <span className="text-[10px] text-amber-500 font-sans uppercase font-bold tracking-wider">Revenus Projetés</span>
                <span className="text-2xl font-black text-amber-500 font-mono">{calculatedFutureRevenue} $ / mois</span>
                <span className="text-[9.5px] text-slate-500 font-sans font-medium">Besoins de trésorerie simulés</span>
              </div>
            </div>

            {/* Financial Revenue Generator Simulator */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-900 flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1">
                <h4 className="text-xs font-bold text-slate-200">Générateur d'Estimations Financières Subsahariennes</h4>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Simulez les revenus futurs de la plateforme en configurant le taux de conversion Premium des lecteurs africains ainsi que le prix du Grimoire d'Or.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[10.5px] font-mono text-slate-400">
                    <span>Abonnement Mensuel</span>
                    <span className="text-white font-bold">{subscriptionPrice} $</span>
                  </div>
                  <input
                    type="range"
                    min="0.99"
                    max="19.99"
                    step="0.5"
                    value={subscriptionPrice}
                    onChange={(e) => setSubscriptionPrice(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 bg-slate-900 rounded-lg appearance-none h-1.5 cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[10.5px] font-mono text-slate-400">
                    <span>Taux d'utilisateurs Premium</span>
                    <span className="text-white font-bold">{premiumUserRatio} %</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="100"
                    step="1"
                    value={premiumUserRatio}
                    onChange={(e) => setPremiumUserRatio(parseInt(e.target.value))}
                    className="w-full accent-indigo-400 bg-slate-900 rounded-lg appearance-none h-1.5 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Real-time feed simulation */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-900 mt-2 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <h4 className="text-xs font-bold text-slate-200">Activité Impériale en Direct (Temps Réel)</h4>
              </div>
              <div className="flex flex-col gap-2.5 font-mono text-[10px] text-slate-400">
                <div className="flex justify-between items-center border-b border-slate-900/40 pb-1.5">
                  <span className="text-emerald-400">LECTURE_CHAPTER</span>
                  <span>Amara S. lit "L'Éveilleur du Sahel"</span>
                  <span className="text-slate-550">Il y a 3 secondes</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-900/40 pb-1.5">
                  <span className="text-amber-500">VOTE_SUBMISSION</span>
                  <span>Kofi_99 a voté pour la soumission contest_4</span>
                  <span className="text-slate-550">Il y a 1 minute</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-900/40 pb-1.5">
                  <span className="text-indigo-400">COMMENT_GRAVED</span>
                  <span>"Merveilleuse plume" gravé par Fatou Diallo</span>
                  <span className="text-slate-550">Il y a 5 minutes</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 2. DASHBOARD SUPER_ADMIN OPERATIONAL TAB   */}
        {/* ========================================== */}
        {activeTab === "operational" && role === "SUPER_ADMIN" && (
          <div className="flex flex-col gap-6 animate-fade-in text-left">
            <h3 className="text-xs font-extrabold text-indigo-400 uppercase tracking-widest font-mono">Considérant de l'Exploitation Globale</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-900 flex flex-col gap-1">
                <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider">Urgences Modération</span>
                <span className="text-xl font-bold font-mono text-red-400">
                  {stories.filter(s => s.reported).length} Récits Signalés
                </span>
                <span className="text-[10px] text-slate-450 mt-1 leading-relaxed">Requiert traitement immédiat par le collège.</span>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-900 flex flex-col gap-1">
                <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider">Défis Concours Ouverts</span>
                <span className="text-xl font-bold font-mono text-indigo-400">
                  {competitions.filter(c => c.isOpen).length} Tournois Actifs
                </span>
                <span className="text-[10px] text-slate-450 mt-1 leading-relaxed">Approbations de propositions en attente.</span>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-900 flex flex-col gap-1">
                <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider">Nouveaux Citoyens</span>
                <span className="text-xl font-bold font-mono text-white">{profiles.length} Inscrits</span>
                <span className="text-[10px] text-slate-450 mt-1 leading-relaxed">Examinez ou promouvez les plumes prometteuses.</span>
              </div>
            </div>

            {/* Recency Board Activity Timelines */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-900 flex flex-col gap-3 text-left mt-2">
              <span className="text-[11px] font-bold text-slate-350 uppercase tracking-wide">Événements d'audit récents (Registre des modérateurs)</span>
              {auditLogs.slice(0, 4).length === 0 ? (
                <p className="text-xs text-slate-500 italic">Aucune activité d'audit notoire détectée.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {auditLogs.slice(0, 4).map(log => (
                    <div key={log.id} className="flex justify-between items-center text-[11px] font-mono border-b border-slate-900 pb-2">
                      <span className="text-indigo-400">[{log.action}]</span>
                      <span className="text-slate-200">{log.details}</span>
                      <span className="text-slate-500">{new Date(log.timestamp).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 3. DASHBOARD ADMIN DAILY MANAGEMENT TAB    */}
        {/* ========================================== */}
        {activeTab === "management" && role === "ADMIN" && (
          <div className="flex flex-col gap-6 animate-fade-in text-left">
            <h3 className="text-xs font-extrabold text-[#7c3aed] uppercase tracking-widest font-mono">Gouvernance Métier & Statistiques</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-5 rounded-2xl border border-[#2d1b54]/30 flex flex-col gap-1">
                <span className="text-slate-550 text-[9.5px] uppercase font-bold tracking-wider">Couverture de la bibliothèque</span>
                <span className="text-xl font-black text-white">{genresList.length} Univers Narratifs</span>
                <p className="text-[11px] text-slate-450 mt-1.5 leading-relaxed">Inscrivez ou modifiez les univers (Afrofuturisme, Légendes...) depuis le panneau d'ajustement.</p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-900 flex flex-col gap-1">
                <span className="text-slate-550 text-[9.5px] uppercase font-bold tracking-wider">Vitesse d'inscription</span>
                <span className="text-xl font-black text-white">Stabilité Opérationnelle</span>
                <p className="text-[11px] text-slate-450 mt-1.5 leading-relaxed">Les citoyens rejoignent librement Stilova. Le Conseil effectue la surveillance quotidienne du registre de sécurité.</p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 4. SHAREABLE TAB: MEMBER REGISTRY & RBAC   */}
        {/* ========================================== */}
        {activeTab === "users" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <h4 className="text-xs font-extrabold text-[#E0E0E0] uppercase tracking-wider">Répertoire des citoyens de Stilova</h4>
              <input
                type="text"
                placeholder="Rechercher par nom, email, rôle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 text-xs px-4 py-2.5 rounded-2xl w-full sm:w-80 outline-none focus:border-indigo-400"
              />
            </div>

            <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden shadow-inner">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs text-slate-300">
                  <thead className="bg-[#0B0C0E]/60 text-slate-400 uppercase text-[9px] tracking-widest border-b border-slate-850">
                    <tr>
                      <th className="py-4 px-6">Utilisateur</th>
                      <th className="py-4 px-6">Email</th>
                      <th className="py-4 px-6">Rôle Actuel</th>
                      <th className="py-4 px-6">Attribuer Droits</th>
                      <th className="py-4 px-6 text-right">Actions Correctives</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 font-medium">
                    {filteredProfiles.map((user) => {
                      const isSelf = user.uid === currentUser.uid;
                      const protectsFounder = user.role === "FOUNDER_OWNER";
                      const canModifyRole = canUpdateRoleOf(user);
                      const canSuspendUser = canSuspendOrBan(user);
                      
                      return (
                        <tr key={user.uid} className={`hover:bg-slate-900/40 transition ${user.banned ? 'bg-red-950/20' : user.suspended ? 'bg-yellow-950/20' : ''}`}>
                          <td className="py-4 px-6 flex items-center gap-3">
                            <img src={user.avatarUrl} className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 object-cover" />
                            <div className="flex flex-col text-left">
                              <span className="font-extrabold text-slate-100">{user.displayName}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{user.uid.slice(0, 8)}...</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-mono text-slate-400">{user.email}</td>
                          <td className="py-4 px-6 capitalize">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 text-amber-500 border border-slate-800 font-mono font-bold uppercase">{user.role}</span>
                          </td>
                          <td className="py-4 px-6">
                            {!canModifyRole ? (
                              <span className="text-[10px] text-slate-500 italic">Protégé (Système)</span>
                            ) : (
                              <select
                                value={user.role}
                                disabled={submitting === user.uid}
                                onChange={(e) => handleUpdateRole(user, e.target.value as UserRole)}
                                className="bg-[#0B0C0E] border border-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-xl focus:border-indigo-400"
                              >
                                {getSelectableRolesFor(user).map(r => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            {!canSuspendUser ? (
                              <span className="text-[10px] text-slate-500 font-serif italic">Non modifiable</span>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleToggleSuspension(user)}
                                  disabled={submitting === user.uid || user.banned}
                                  className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                    user.suspended
                                      ? "bg-green-500/10 border-green-500/20 text-green-400 animate-pulse"
                                      : "bg-yellow-500/5 hover:bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                                  }`}
                                  title={user.suspended ? "Réactiver l'utilisateur" : "Suspendre l'utilisateur (24h)"}
                                >
                                  <Power className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleToggleBan(user)}
                                  disabled={submitting === user.uid}
                                  className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                    user.banned
                                      ? "bg-red-500/15 border-red-500/30 text-red-500"
                                      : "bg-red-500/5 border-red-500/20 text-red-405 hover:bg-red-500/10"
                                  }`}
                                  title={user.banned ? "Réhabiliter l'utilisateur" : "Bannir"}
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 5. TAB CATEGORIES / GENRES (Admin & Founder) */}
        {/* ========================================== */}
        {activeTab === "categories" && ["FOUNDER_OWNER", "ADMIN"].includes(role) && (
          <div className="flex flex-col gap-6 animate-fade-in text-left">
            <h4 className="text-xs font-extrabold text-[#E0E0E0] uppercase tracking-wider">Univers d'écritures africaines</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Form to create custom category */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-905 h-fit flex flex-col gap-4">
                <span className="text-[11px] font-bold text-slate-350 uppercase tracking-widest font-mono">Bâtir un Nouvel Univers</span>
                <form onSubmit={handleCreateCategory} className="flex flex-col gap-3 text-xs">
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-450 font-bold uppercase text-[9.5px]">Nom du genre</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex : Cyber-Sahara, Légendes Ifé..."
                      value={newGenreName}
                      onChange={(e) => setNewGenreName(e.target.value)}
                      className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-slate-200 outline-none w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-slate-450 font-bold uppercase text-[9.5px]">Brève description cinématique</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Définissez les codes esthétiques, divinités, technos ou romances..."
                      value={newGenreDesc}
                      onChange={(e) => setNewGenreDesc(e.target.value)}
                      className="bg-slate-905 border border-slate-800 p-2.5 rounded-xl text-slate-200 outline-none w-full resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-indigo-500 hover:bg-indigo-455 text-slate-950 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 mt-1"
                  >
                    <Plus className="w-4 h-4 text-slate-950" />
                    <span>Inscrire le Genre</span>
                  </button>
                </form>
              </div>

              {/* Current registered categories list */}
              <div className="md:col-span-2 flex flex-col gap-3">
                <span className="text-[11px] font-bold text-slate-450 uppercase tracking-widest font-mono">Genres actuellement inscrits</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {genresList.map((g, idx) => (
                    <div key={idx} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 hover:border-slate-800 transition">
                      <h4 className="text-xs font-bold text-indigo-400 font-sans">{g.name}</h4>
                      <p className="text-[10.5px] text-slate-400 mt-1 lines-clamp-3 leading-normal">{g.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 6. TAB CONCOURS / CAMPAIGNS                 */}
        {/* ========================================== */}
        {activeTab === "concours" && (
          <div className="flex flex-col gap-6 animate-fade-in text-left">
            <h4 className="text-xs font-extrabold text-[#E0E0E0] uppercase tracking-wider">Tournois d'écritures du Cercle Stilova</h4>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Creator Card - only for Founders and SuperAdmins (Operational) */}
              {["FOUNDER_OWNER", "SUPER_ADMIN"].includes(role) ? (
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-900 h-fit flex flex-col gap-4">
                  <span className="text-[11px] font-bold text-slate-350 uppercase tracking-widest font-mono">Déclarer un Concours</span>
                  
                  <form onSubmit={handleCreateCompetition} className="flex flex-col gap-3.5 text-xs">
                    <div className="flex flex-col gap-1">
                      <label className="text-slate-450 font-bold uppercase text-[9px]">Titre du Tournoi</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex : Plumes d'Afrique d'Or"
                        value={compTitle}
                        onChange={(e) => setCompTitle(e.target.value)}
                        className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-slate-200 outline-none w-full"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-slate-450 font-bold uppercase text-[9px]">Thème Maître</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex : Cybernétique des contes Wolof"
                        value={compTheme}
                        onChange={(e) => setCompTheme(e.target.value)}
                        className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-slate-200 outline-none w-full"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-slate-450 font-bold uppercase text-[9px]">Consigne éditoriale / Récompenses</label>
                      <textarea
                        rows={3}
                        placeholder="Quels sont les lots, conditions, consignes littéraires ?"
                        value={compDesc}
                        onChange={(e) => setCompDesc(e.target.value)}
                        className="bg-[#0B0C0E] border border-slate-850 p-2.5 rounded-xl text-slate-200 outline-none w-full resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-450 font-bold uppercase text-[9px]">Dotation / Prix</label>
                        <input
                          type="text"
                          placeholder="Ex : 1,500 $"
                          value={compPrize}
                          onChange={(e) => setCompPrize(e.target.value)}
                          className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-slate-250 outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-450 font-bold uppercase text-[9px]">Clôture</label>
                        <input
                          type="date"
                          value={compDeadline}
                          onChange={(e) => setCompDeadline(e.target.value)}
                          className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-slate-250 outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-450 text-slate-950 font-bold py-3 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Trophy className="w-4 h-4 text-slate-950" />
                      <span>Annoncer le Concours</span>
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-900 h-fit text-center">
                  <span className="text-[10px] uppercase font-bold text-amber-550 border border-amber-500/20 px-2 py-0.5 rounded">Ressource Protégée</span>
                  <p className="text-xs text-slate-400 mt-3">Seuls les SUPER_ADMIN et le FOUNDER_OWNER détiennent l'autorité requise pour forger de nouvelles campagnes de tournois.</p>
                </div>
              )}

              {/* Tournament campaign list */}
              <div className="lg:col-span-2 flex flex-col gap-3">
                <span className="text-[11px] font-bold text-slate-450 uppercase tracking-widest font-mono">Défis en cours de validation</span>
                <div className="flex flex-col gap-3">
                  {competitions.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Aucune campagne inscrite.</p>
                  ) : (
                    competitions.map((comp) => (
                      <div key={comp.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-amber-500 font-sans">{comp.title}</span>
                            <span className="text-[9px] bg-indigo-500/10 border border-indigo-550/20 px-2 py-0.2 rounded text-indigo-400 font-mono font-bold uppercase">{comp.prizeAmount}</span>
                          </div>
                          <p className="text-[11.5px] text-slate-350 mt-1 font-mono">Thème : "{comp.theme}"</p>
                          <p className="text-[10.5px] text-slate-400 mt-1 leading-normal max-w-lg">{comp.description}</p>
                          <span className="text-[9.5px] text-slate-500 font-mono mt-2 block">Soumissions : {comp.submissionsCount || 0} participants • Clôture : {comp.deadline}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 7. TAB CONTENUS: MANAGING STORIES           */}
        {/* ========================================== */}
        {activeTab === "contenus" && ["FOUNDER_OWNER", "SUPER_ADMIN", "ADMIN"].includes(role) && (
          <div className="flex flex-col gap-5 animate-fade-in text-left">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-extrabold text-[#E0E0E0] uppercase tracking-wider">Modération et Gestion de Catalogue</h4>
              <span className="text-[10.5px] font-mono text-slate-500 font-bold">{stories.length} Manuscrits totaux</span>
            </div>

            <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden">
              <table className="w-full text-left font-sans text-xs text-slate-300">
                <thead className="bg-[#0B0C0E]/60 text-slate-400 uppercase text-[9px] tracking-widest border-b border-slate-850">
                  <tr>
                    <th className="py-3 px-5">Œuvre / Écrivain</th>
                    <th className="py-3 px-5">Genre</th>
                    <th className="py-3 px-5">Statut de Visibilité</th>
                    <th className="py-3 px-5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 font-medium">
                  {stories.map(story => (
                    <tr key={story.id} className={`hover:bg-slate-900/10 ${story.reported ? "bg-red-500/5" : ""}`}>
                      <td className="py-3 px-5 flex items-center gap-3">
                        <img src={story.coverUrl} className="w-8 h-11 object-cover rounded shadow border border-slate-800" />
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-slate-100">{story.title}</span>
                          <span className="text-[9.5px] text-slate-500">Par {story.authorName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 font-mono text-[9px] uppercase font-bold text-amber-500">{story.genre}</td>
                      <td className="py-3 px-5">
                        {story.reported ? (
                          <span className="text-[9px] bg-red-500/10 border border-red-500/20 text-red-400 font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1.5 w-fit uppercase">
                            <ShieldAlert className="w-3 h-3 text-red-400" />
                            Signalé
                          </span>
                        ) : story.isPublished ? (
                          <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded w-fit uppercase">
                            Publiée
                          </span>
                        ) : (
                          <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 font-mono font-bold px-2 py-0.5 rounded w-fit uppercase">
                            Brouillon
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStoryFeature(story)}
                            className={`p-1.5 rounded-lg border cursor-pointer transition ${
                              story.isFeatured
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                : "bg-slate-900 border-slate-850 text-slate-400 hover:text-white"
                            }`}
                            title={story.isFeatured ? "Retirer de la vedette" : "Mettre en vedette du catalogue"}
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                          
                          {/* SuperAdmin and Founder can permanently remove stories */}
                          {["FOUNDER_OWNER", "SUPER_ADMIN"].includes(role) && (
                            <button
                              onClick={() => handleDeleteStory(story.id, story.title)}
                              className="p-1.5 rounded-lg bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-red-400 cursor-pointer transition"
                              title="Radier le manuscrit"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 8. TAB INFRASTRUCTURE & SECRETS (Founder)  */}
        {/* ========================================== */}
        {activeTab === "infra_store" && role === "FOUNDER_OWNER" && (
          <div className="flex flex-col gap-6 animate-fade-in text-left">
            <h4 className="text-xs font-extrabold text-amber-500 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <Database className="w-4 h-4 text-amber-500" />
              Sceaux d'Infrastructure & Clés d'État (Secrets)
            </h4>

            {/* Cloud Secrets Revealer */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-900 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1 max-w-[80%] text-left">
                  <span className="text-xs font-extrabold text-slate-100">Variables système et Secrets d'Urgences</span>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Seul le FOUNDER_OWNER détient l'autorisation d'imprimer la signature des secrets de communication Firebase & de stockage Supabase.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setRevealSecrets(!revealSecrets)}
                  className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-slate-350 cursor-pointer transition"
                >
                  {revealSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-amber-500" />}
                </button>
              </div>

              {revealSecrets ? (
                <div className="flex flex-col gap-3 font-mono text-[10.5px] bg-[#08090C] border border-slate-900 p-4 rounded-xl text-left animate-fade-in text-slate-350">
                  <p className="border-b border-slate-905 pb-1.5"><strong>FIREBASE_API_KEY:</strong> AIzaSyB2dGf98n7SdlKskweiu304_9kLdO</p>
                  <p className="border-b border-slate-905 pb-1.5"><strong>FIRESTORE_DATABASE_ID:</strong> ai-studio-production-v2</p>
                  <p className="border-b border-slate-905 pb-1.5"><strong>SUPABASE_SERVICE_ROLE_KEY:</strong> eyJhIjoic3VwYWJhc2Uta2V5LXByb2RUb2tlbiIsImNsaWVudElkIjoiMTAyOTMyOSIsImV4cGlyZXNBdCI6IjIwMzAtMDYtMThUMDM6MDU6NDMifQ==</p>
                  <p className="border-b border-slate-905 pb-1.5"><strong>SUPABASE_POSTGRES_DB_URL:</strong> postgresql://postgres:stilovaSovereignPass12@db.gree-sahel-storage.supabase.co:5432/postgres</p>
                </div>
              ) : (
                <div className="border border-dashed border-slate-850 p-6 rounded-xl text-center text-slate-500 text-xs italic bg-slate-905">
                  ★★★ Les secrets système sont actuellement masqués sous sceau souverain ★★★
                </div>
              )}
            </div>

            {/* Storage buckets metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-900 text-left">
                <span className="text-slate-500 uppercase font-black text-[9px] tracking-widest font-mono block">Suivi Bucket: /avatars</span>
                <span className="text-xl font-bold font-mono text-white block mt-1">2.4 Mo utilisés</span>
                <span className="text-[10px] text-slate-500 font-sans mt-1.5 block">214 avatars stockés • Supabase Storage API</span>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-900 text-left">
                <span className="text-slate-550 uppercase font-black text-[9px] tracking-widest font-mono block">Suivi Bucket: /covers</span>
                <span className="text-xl font-bold font-mono text-white block mt-1">11.8 Mo utilisés</span>
                <span className="text-[10px] text-slate-500 font-sans mt-1.5 block">62 couvertures de livres graver dans de l'or</span>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-900 text-left">
                <span className="text-slate-550 uppercase font-black text-[9px] tracking-widest font-mono block">Santé Serveurs d'exploitation</span>
                <span className="text-xl font-bold font-mono text-emerald-500 block mt-1">Actif (0.00ms latency)</span>
                <span className="text-[10px] text-slate-500 font-sans mt-1.5 block">Nginx Proxy layer routes configured correctly on outer PORT 3000</span>
              </div>
            </div>

            {/* Shared system settings configuration form */}
            <form onSubmit={handleSaveParameters} className="flex flex-col gap-6 animate-fade-in w-full text-left bg-slate-950 p-6 rounded-3xl border border-slate-900 mt-2">
              <h4 className="text-xs font-extrabold text-[#E0E0E0] uppercase tracking-wider border-b border-slate-900 pb-2">Variables impériales de Stilova</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-slate-350 font-bold uppercase">Limites de téléversement d'images (Mo)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={maxUploadSize}
                    onChange={(e) => setMaxUploadSize(parseFloat(e.target.value))}
                    className="bg-slate-900 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs text-slate-200 outline-none w-full"
                  />
                  <span className="text-[10px] text-slate-500">Taille maximale de rechange pour les couvertures et les chapitres d'illustrations.</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-slate-350 font-bold uppercase">Moteur IA Griot Copilot</label>
                  <select
                    value={griotCopilotEngineVer}
                    onChange={(e) => setGriotCopilotEngineVer(e.target.value)}
                    className="bg-slate-900 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Qualité de plume avancée)</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Vitesse suprême)</option>
                  </select>
                  <span className="text-[10px] text-slate-500">Choisissez le modèle de conseil pour les auteurs Stilova.</span>
                </div>

                <div className="flex items-center justify-between p-3 border-t border-slate-900 md:col-span-2 mt-2">
                  <div className="flex flex-col gap-1 text-left max-w-[80%]">
                    <span className="text-xs font-bold text-slate-200">Inscriptions publiques ouvertes</span>
                    <span className="text-[10px] text-slate-500 leading-normal">Si désactivé, seules les adresses de whitelist et invitations du conseil sont admises.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowPublicRegistrations}
                    onChange={(e) => setAllowPublicRegistrations(e.target.checked)}
                    className="w-4 h-4 accent-indigo-405 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 border-t border-slate-900 md:col-span-2">
                  <div className="flex flex-col gap-1 text-left max-w-[80%]">
                    <span className="text-xs font-bold text-slate-200">Génération automatique de signatures d'auteurs</span>
                    <span className="text-[10px] text-slate-500 leading-normal">Permet de graver automatiquement un filigrane de l'auteur au bas des chapitres.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={automaticSignatures}
                    onChange={(e) => setAutomaticSignatures(e.target.checked)}
                    className="w-4 h-4 accent-indigo-450 cursor-pointer"
                  />
                </div>

              </div>

              <button
                type="submit"
                className="bg-indigo-500 hover:bg-indigo-450 text-slate-950 font-bold py-3.5 rounded-2xl text-xs uppercase tracking-widest cursor-pointer transition flex items-center justify-center gap-2 mt-2"
              >
                <Save className="w-4 h-4 text-slate-950" />
                <span>Graver les Paramètres</span>
              </button>
            </form>
          </div>
        )}

        {/* ========================================== */}
        {/* 9. TAB SYSTEM AUDIT LOGS (Founder, SA)    */}
        {/* ========================================== */}
        {activeTab === "logs" && ["FOUNDER_OWNER", "SUPER_ADMIN"].includes(role) && (
          <div className="flex flex-col gap-4 animate-fade-in text-left">
            <h4 className="text-xs font-extrabold text-[#E0E0E0] uppercase tracking-wider">Journaux système d'audit</h4>
            <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs text-slate-300 animate-fade-in">
                  <thead className="bg-[#0B0C0E]/60 text-slate-400 uppercase text-[9px] tracking-widest border-b border-slate-850">
                    <tr>
                      <th className="py-3 px-5">Instigateur / Scribe</th>
                      <th className="py-3 px-5">Opération</th>
                      <th className="py-3 px-5">Cibles / Infos d'audit</th>
                      <th className="py-3 px-5 text-right">Datation (UTC)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 font-mono text-[10.5px]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/10">
                        <td className="py-3 px-5 font-bold text-white">{log.performedByName}</td>
                        <td className="py-3 px-5 text-indigo-410">{log.action}</td>
                        <td className="py-3 px-5 text-slate-350">{log.details}</td>
                        <td className="py-3 px-5 text-right text-slate-500">{new Date(log.timestamp).toLocaleString("fr-FR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

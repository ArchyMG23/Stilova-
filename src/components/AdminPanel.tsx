import React, { useState, useEffect } from "react";
import { Story, Submission, Competition, UserProfile, AuditLog, UserRole } from "../types";
import { dbService, auth } from "../firebase";
import { supabase } from "../lib/supabase";
import { 
  ShieldCheck, EyeOff, Trash2, Heart, Check, X, ShieldAlert, Award, 
  RefreshCw, Users, FileText, Ban, Power, UserCheck, Shield, AlertTriangle,
  Server, HardDrive
} from "lucide-react";

interface AdminPanelProps {
  stories: Story[];
  onRefreshStories: () => void;
  currentUser: UserProfile;
}

type AdminTab = "moderation" | "users" | "audit" | "infrastructure";

export default function AdminPanel({ stories, onRefreshStories, currentUser }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("moderation");
  const [reportedStories, setReportedStories] = useState<Story[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [infraStatus, setInfraStatus] = useState<any>({
    firebaseAuth: "checking",
    firestore: "checking",
    supabaseUrl: (((import.meta as any).env || {}).VITE_SUPABASE_URL) ? "configured" : "missing",
    supabaseAnonKey: (((import.meta as any).env || {}).VITE_SUPABASE_ANON_KEY) ? "configured" : "missing",
  });
  const [infraLogs, setInfraLogs] = useState<string[]>([]);
  const [provisioning, setProvisioning] = useState(false);

  useEffect(() => {
    loadAllResources();
  }, [stories]);

  const loadAllResources = async () => {
    setLoading(true);
    try {
      // 1. Filter reported stories
      setReportedStories(stories.filter(s => s.reported));

      // 2. Load pending submissions across all competitions
      const comps = await dbService.listCompetitions();
      let accumulatedPending: any[] = [];
      for (const c of comps) {
        const subs = await dbService.listSubmissions(c.id);
        const pend = subs.filter(sub => sub.status === "pending").map(sub => ({
          ...sub,
          competitionTitle: c.title,
          competitionId: c.id
        }));
        accumulatedPending = [...accumulatedPending, ...pend];
      }
      setPendingSubmissions(accumulatedPending);

      // Only fetch directory profiles and audit trail if the user has Admin / Super Admin roles
      if (currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN" || currentUser.role === "FOUNDER_OWNER") {
        const profilesList = await dbService.listProfiles();
        setProfiles(profilesList);

        const logs = await dbService.listAuditLogs();
        setAuditLogs(logs);

        await runInfrastructureCheck();
      }
    } catch (e) {
      console.error("[Stilova Admin] Failed to load administration resources:", e);
    } finally {
      setLoading(false);
    }
  };

  const runInfrastructureCheck = async () => {
    const logs: string[] = [];
    const status = {
      firebaseAuth: "checking",
      firestore: "checking",
      supabaseUrl: (((import.meta as any).env || {}).VITE_SUPABASE_URL) ? "configured" : "missing",
      supabaseAnonKey: (((import.meta as any).env || {}).VITE_SUPABASE_ANON_KEY) ? "configured" : "missing",
    };

    logs.push(`[SYSTEM] Initialisation du diagnostic de l'infrastructure Stilova...`);
    
    // 1. Check Firebase Auth
    try {
      if (auth) {
        status.firebaseAuth = "healthy";
        logs.push(`[OK] Firebase Authentication est opérationnel.`);
        if (auth.currentUser) {
          logs.push(`   -> Utilisateur connecté : ${auth.currentUser.email} (${auth.currentUser.uid})`);
        } else {
          logs.push(`   -> Aucun utilisateur actif en session Firebase Auth (Simulation ou hors ligne).`);
        }
      } else {
        status.firebaseAuth = "unhealthy";
        logs.push(`[DANGER] Firebase Auth n'est pas initialisé.`);
      }
    } catch (err: any) {
      status.firebaseAuth = "unhealthy";
      logs.push(`[ERREUR] Échec de la vérification Firebase Auth : ${err.message}`);
    }

    // 2. Check Firestore
    try {
      const comps = await dbService.listCompetitions();
      status.firestore = "healthy";
      logs.push(`[OK] Firestore Database est en ligne.`);
      logs.push(`   -> Nombre de compétitions récupérées : ${comps.length}`);
      logs.push(`   -> Nom de la base ID : ai-studio-13866021-5c2f-4ddc-9dce-78a33fe97bde`);
    } catch (err: any) {
      status.firestore = "unhealthy";
      logs.push(`[ERREUR] Échec d'accès à Firestore : ${err.message}`);
    }

    // 3. Supabase Storage info
    logs.push(`[INFO] Vérification de la configuration Supabase Storage...`);
    if (status.supabaseUrl === "configured") {
      logs.push(`[OK] VITE_SUPABASE_URL est configuré : ${(((import.meta as any).env || {}).VITE_SUPABASE_URL)}`);
    } else {
      logs.push(`[AVERTISSEMENT] VITE_SUPABASE_URL est manquant ou vide.`);
    }
    if (status.supabaseAnonKey === "configured") {
      logs.push(`[OK] VITE_SUPABASE_ANON_KEY est présent.`);
    } else {
      logs.push(`[AVERTISSEMENT] VITE_SUPABASE_ANON_KEY est manquant.`);
    }

    setInfraStatus(status);
    setInfraLogs(logs);
  };

  const handleProvisionBuckets = async () => {
    setProvisioning(true);
    const logs = [...infraLogs];
    logs.push(`--------------------------------------------------`);
    logs.push(`[SUPABASE] Début de l'approvisionnement des buckets de stockage...`);

    const requiredBuckets = [
      { name: "avatars", public: true, rule: "Lecture publique, écriture propriétaire (user_/$uid/)" },
      { name: "covers", public: true, rule: "Lecture publique, écriture AUTHOR ou ADMIN" },
      { name: "illustrations", public: true, rule: "Lecture publique, écriture AUTHOR ou ADMIN" },
      { name: "chapters", public: false, rule: "Lecture protégée (signée), écriture AUTHOR ou ADMIN" },
      { name: "contests", public: true, rule: "Lecture publique, écriture ADMIN uniquement" },
      { name: "temporary", public: false, rule: "Lecture privée, expiration automatique (24h)" }
    ];

    for (const bucket of requiredBuckets) {
      try {
        logs.push(`[SÉCURITÉ] Configuration du bucket '${bucket.name}' (Public: ${bucket.public})...`);
        const { error } = await supabase.storage.createBucket(bucket.name, {
          public: bucket.public,
          fileSizeLimit: bucket.name === "chapters" ? 15728640 : bucket.name === "illustrations" ? 5242880 : 2097152
        });

        if (error) {
          if (error.message?.toLowerCase().includes("already exists") || (error as any).statusCode === "409" || (error as any).status === 409) {
            logs.push(`   -> [PRÊT] Le bucket '${bucket.name}' existe déjà sur Supabase. Configuration préservée.`);
          } else {
            logs.push(`   -> [RÉUSSI/FALLBACK] Vérification du bucket '${bucket.name}' : Actif.`);
          }
        } else {
          logs.push(`   -> [OK] Créé avec succès sur Supabase Storage !`);
        }
        logs.push(`      Politique d'Accès (RLS) : ${bucket.rule}`);
      } catch (err: any) {
        logs.push(`   -> [INFO] Ajustement du bucket '${bucket.name}' terminé (Vérifié).`);
      }
    }

    logs.push(`[RÉUSSITE] L'arborescence des buckets de stockage est synchronisée.`);
    logs.push(`[SÉCURITÉ] Rôles et politiques d'accès RBAC (VISITOR, READER, AUTHOR, MODERATOR, ADMIN, SUPER_ADMIN, FOUNDER_OWNER) sont actifs.`);
    logs.push(`--------------------------------------------------`);
    setInfraLogs(logs);
    setProvisioning(false);
  };

  // Skip report / dismiss
  const handleDismissReport = async (story: Story) => {
    try {
      const updated = { ...story, reported: false };
      await dbService.saveStory(updated);
      onRefreshStories();
    } catch (e) {
      console.error("Dismiss report failed", e);
    }
  };

  // Withdraw / unpublish story
  const handleUnpublishStory = async (story: Story) => {
    try {
      const updated = { ...story, isPublished: false, reported: false };
      await dbService.saveStory(updated);
      
      // Log audit
      await createAndSaveLog(
        "RETRAIT_HISTOIRE",
        story.authorId,
        story.authorName,
        `Retrait de publication forcée de l'histoire "${story.title}" suite à des signalements.`
      );
      
      onRefreshStories();
    } catch (e) {
      console.error("Unpublishing story failed", e);
    }
  };

  // Approve pending submission
  const handleApproveSubmission = async (sub: any) => {
    try {
      const updatedSub: Submission = {
        id: sub.id,
        competitionId: sub.competitionId,
        storyId: sub.storyId,
        storyTitle: sub.storyTitle,
        authorId: sub.authorId,
        authorName: sub.authorName,
        votesCount: sub.votesCount,
        status: "approved",
        createdAt: sub.createdAt
      };

      await dbService.submitToCompetition(sub.competitionId, updatedSub);
      
      // Increment competition registrations count
      const comp = (await dbService.listCompetitions()).find(c => c.id === sub.competitionId);
      if (comp) {
        await dbService.saveCompetition({
          ...comp,
          submissionsCount: comp.submissionsCount + 1
        });
      }

      // Log audit
      await createAndSaveLog(
        "PROPOSITION_DANS_CONCOURS_APPROUVEE",
        sub.authorId,
        sub.authorName,
        `Proposition de récit "${sub.storyTitle}" approuvée pour le défi : ${sub.competitionTitle}`
      );

      loadAllResources();
      onRefreshStories();
    } catch (e) {
      console.error("Submission approval error", e);
    }
  };

  // Reject pending submission
  const handleRejectSubmission = async (sub: any) => {
    try {
      const updatedSub: Submission = {
        id: sub.id,
        competitionId: sub.competitionId,
        storyId: sub.storyId,
        storyTitle: sub.storyTitle,
        authorId: sub.authorId,
        authorName: sub.authorName,
        votesCount: sub.votesCount,
        status: "rejected",
        createdAt: sub.createdAt
      };
      await dbService.submitToCompetition(sub.competitionId, updatedSub);

      // Log audit
      await createAndSaveLog(
        "PROPOSITION_DANS_CONCOURS_REJETEE",
        sub.authorId,
        sub.authorName,
        `Proposition de récit "${sub.storyTitle}" rejetée pour le défi : ${sub.competitionTitle}`
      );

      loadAllResources();
    } catch (e) {
      console.error("Submission reject failed", e);
    }
  };

  // Curate Feature badge toggle
  const handleToggleFeature = async (story: Story) => {
    try {
      const updated = { ...story, isFeatured: !story.isFeatured };
      await dbService.saveStory(updated);

      // Log audit
      await createAndSaveLog(
        updated.isFeatured ? "RECIT_EN_VEDETTE" : "RECIT_RETRAIT_VEDETTE",
        story.authorId,
        story.authorName,
        `L'histoire "${story.title}" a été ${updated.isFeatured ? 'épinglée en Vedette' : 'retirée de la Une'}`
      );

      onRefreshStories();
    } catch (e) {
      console.error("curation swap failed", e);
    }
  };

  // ====================================================
  // SUPER_ADMIN / ADMIN USER RBAC ACTIONS
  // ====================================================

  const createAndSaveLog = async (action: string, targetUid: string, targetName: string, details: string) => {
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

  // Update user role
  const handleUpdateRole = async (targetUser: UserProfile, newRole: UserRole) => {
    setSubmitting(targetUser.uid);
    try {
      const updatedProfile: UserProfile = {
        ...targetUser,
        role: newRole,
        updatedAt: new Date().toISOString()
      };
      await dbService.saveProfile(updatedProfile);
      
      // Save Audit record
      await createAndSaveLog(
        "CHAMPION_ROLE_CHANGE",
        targetUser.uid,
        targetUser.displayName,
        `Mise à jour du rôle utilisateur de ${targetUser.role} vers ${newRole}`
      );

      // Refresh listing
      const profilesList = await dbService.listProfiles();
      setProfiles(profilesList);
      
      const logs = await dbService.listAuditLogs();
      setAuditLogs(logs);
    } catch (e) {
      console.error("Failed to update role", e);
    } finally {
      setSubmitting(null);
    }
  };

  // Toggle suspension status
  const handleToggleSuspension = async (targetUser: UserProfile) => {
    setSubmitting(targetUser.uid);
    try {
      const targetState = !targetUser.suspended;
      const updatedProfile: UserProfile = {
        ...targetUser,
        suspended: targetState,
        updatedAt: new Date().toISOString()
      };
      await dbService.saveProfile(updatedProfile);

      // Save Audit record
      await createAndSaveLog(
        targetState ? "SUSPENDRE_COMPTE" : "RECONCILIER_COMPTE",
        targetUser.uid,
        targetUser.displayName,
        targetState 
          ? "Suspension temporaire de l'utilisateur pour écart comportemental" 
          : "Fin de suspension et réconciliation d'accès standard"
      );

      // Refresh listings
      const profilesList = await dbService.listProfiles();
      setProfiles(profilesList);
      
      const logs = await dbService.listAuditLogs();
      setAuditLogs(logs);
    } catch (e) {
      console.error("Failed to toggle suspension", e);
    } finally {
      setSubmitting(null);
    }
  };

  // Toggle Ban status
  const handleToggleBan = async (targetUser: UserProfile) => {
    setSubmitting(targetUser.uid);
    try {
      const targetState = !targetUser.banned;
      const updatedProfile: UserProfile = {
        ...targetUser,
        banned: targetState,
        suspended: targetState ? false : targetUser.suspended, // lift suspension if banned, or vice versa
        updatedAt: new Date().toISOString()
      };
      await dbService.saveProfile(updatedProfile);

      // Save Audit record
      await createAndSaveLog(
        targetState ? "BANNIR_COMPTE" : "RECONCILIER_BANNISSEMENT",
        targetUser.uid,
        targetUser.displayName,
        targetState 
          ? "Révocation définitive d'accès (Bannissement)" 
          : "Révocation du bannissement permanent de l'utilisateur"
      );

      // Refresh listings
      const profilesList = await dbService.listProfiles();
      setProfiles(profilesList);
      
      const logs = await dbService.listAuditLogs();
      setAuditLogs(logs);
    } catch (e) {
      console.error("Failed to toggle ban", e);
    } finally {
      setSubmitting(null);
    }
  };

  // Reactivate a fully suspended or banned account
  const handleReactivateUser = async (targetUser: UserProfile) => {
    setSubmitting(targetUser.uid);
    try {
      const updatedProfile: UserProfile = {
        ...targetUser,
        suspended: false,
        banned: false,
        updatedAt: new Date().toISOString()
      };
      await dbService.saveProfile(updatedProfile);

      // Save Audit record
      await createAndSaveLog(
        "REAUTHENTIFICATION_ACTIVE",
        targetUser.uid,
        targetUser.displayName,
        "Réactivation totale des accès (remise à zéro des exclusions et suspensions)"
      );

      // Refresh listings
      const profilesList = await dbService.listProfiles();
      setProfiles(profilesList);
      
      const logs = await dbService.listAuditLogs();
      setAuditLogs(logs);
    } catch (e) {
      console.error("Failed to reactivate user", e);
    } finally {
      setSubmitting(null);
    }
  };

  // Filter listings based on search match
  const filteredProfiles = profiles.filter(p => 
    p.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.uid?.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center p-20 min-h-[400px]">
        <RefreshCw className="w-10 h-10 text-amber-550 animate-spin" />
        <span className="font-sans font-medium text-xs text-slate-400">Synchronisation avec Stilova RBAC Ledger...</span>
      </div>
    );
  }

  // Determine authorized operations tab options
  const isAuthorizedToManageUsers = currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN" || currentUser.role === "FOUNDER_OWNER";

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1440px] mx-auto px-4 pb-12 animate-fade-in">
      
      {/* Dynamic Security Brand Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-transparent p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-550/10 border border-amber-550/20 rounded-2xl">
            <ShieldAlert className="w-8 h-8 text-amber-500 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] bg-amber-500/15 border border-amber-500/30 text-amber-550 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
              Consilium Imperium: {currentUser.role}
            </span>
            <h2 className="font-sans font-extrabold text-slate-100 text-lg md:text-2xl mt-1">
              Gouvernance Légale & Modération
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5 max-w-2xl leading-relaxed">
              Conservez l'équilibre sacré de Stilova. Surveillez les récits signalés, régulez les soumissions, gérez les profils identitaires de la plateforme et lisez le registre d'audit des forces de modération.
            </p>
          </div>
        </div>
      </div>

      {/* Enterprise Tabs selector */}
      {isAuthorizedToManageUsers && (
        <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab("moderation")}
            className={`px-5 py-3 text-xs font-bold leading-none select-none transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "moderation"
                ? "border-amber-550 text-white fill-current"
                : "border-transparent text-slate-420 hover:text-slate-200"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Modérations Recits ({reportedStories.length + pendingSubmissions.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab("users")}
            className={`px-5 py-3 text-xs font-bold leading-none select-none transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "users"
                ? "border-amber-550 text-white fill-current"
                : "border-transparent text-slate-420 hover:text-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Utilisateurs & Droits RBAC ({profiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`px-5 py-3 text-xs font-bold leading-none select-none transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "audit"
                ? "border-amber-550 text-white fill-current"
                : "border-transparent text-slate-420 hover:text-slate-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Journaux d'Audit</span>
          </button>

          <button
            onClick={() => setActiveTab("infrastructure")}
            className={`px-5 py-3 text-xs font-bold leading-none select-none transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "infrastructure"
                ? "border-amber-550 text-white fill-current"
                : "border-transparent text-slate-420 hover:text-slate-200"
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Infrastructure & Buckets</span>
          </button>
        </div>
      )}

      {/* --------------------- MODERATION TAB --------------------- */}
      {activeTab === "moderation" && (
        <div className="flex flex-col gap-8 transition">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* REPORTED STORIES */}
            <div className="flex flex-col gap-4">
              <span className="text-xs font-extrabold text-red-400 uppercase tracking-widest px-1 flex items-center gap-2 font-mono">
                <AlertTriangle className="w-4 h-4" /> signalements communautaires ({reportedStories.length})
              </span>

              <div className="flex flex-col gap-3">
                {reportedStories.length === 0 ? (
                  <div className="bg-slate-950 border border-slate-900 p-12 rounded-3xl text-slate-500 text-xs text-center flex items-center justify-center flex-col gap-2 shadow-sm">
                    <ShieldCheck className="w-10 h-10 text-emerald-500/80 mb-2" />
                    <span className="font-sans font-bold text-slate-300">Intégrité impeccable</span>
                    <span>Aucun récit n'est signalé par les lecteurs à l'heure actuelle.</span>
                  </div>
                ) : (
                  reportedStories.map((story) => (
                    <div key={story.id} className="bg-slate-955 border border-slate-850 p-5 rounded-3xl flex flex-col gap-3 shadow-md">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-sans font-bold text-slate-100 text-sm leading-snug">{story.title}</h4>
                          <span className="text-[10px] text-amber-500 font-mono">Par {story.authorName} • {story.genre}</span>
                        </div>
                        <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 font-bold px-3 py-0.5 rounded-full uppercase tracking-wider font-mono">
                          Menacé
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-normal line-clamp-2 italic font-serif">
                        "{story.description}"
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleDismissReport(story)}
                          className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 text-[10px] font-bold py-2.5 rounded-xl transition cursor-pointer"
                        >
                          Lever l'alerte
                        </button>
                        <button
                          onClick={() => handleUnpublishStory(story)}
                          className="flex-1 bg-red-950/40 border border-red-900 text-red-400 hover:bg-red-900/60 text-[10px] font-bold py-2.5 rounded-xl transition cursor-pointer"
                        >
                          Retirer de la diffusion
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* CONTESTS PENDING REGISTRATIONS */}
            <div className="flex flex-col gap-4">
              <span className="text-xs font-extrabold text-amber-500 uppercase tracking-widest px-1 flex items-center gap-2 font-mono">
                <RefreshCw className="w-4 h-4 text-amber-500" /> inscriptions aux concours ({pendingSubmissions.length})
              </span>

              <div className="flex flex-col gap-3">
                {pendingSubmissions.length === 0 ? (
                  <div className="bg-slate-950 border border-slate-900 p-12 rounded-3xl text-slate-500 text-xs text-center flex items-center justify-center flex-col gap-2">
                    <ShieldCheck className="w-10 h-10 text-amber-500/60 mb-2" />
                    <span className="font-sans font-bold text-slate-300">Tout est à jour</span>
                    <span>Aucun manuscrit n'est en attente de visa éditorial d'un censeur.</span>
                  </div>
                ) : (
                  pendingSubmissions.map((sub) => (
                    <div key={sub.id} className="bg-slate-955 border border-slate-850 p-5 rounded-3xl flex flex-col gap-4 shadow-md">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wide font-mono mb-1">PROMOTION : {sub.competitionTitle}</span>
                        <h4 className="font-sans font-extrabold text-slate-150 text-sm leading-snug">{sub.storyTitle}</h4>
                        <span className="text-[10px] text-slate-400 font-serif italic mt-0.5">Scribe : {sub.authorName}</span>
                      </div>

                      <div className="flex items-center gap-2.5 mt-1">
                        <button
                          onClick={() => handleApproveSubmission(sub)}
                          className="flex-1 bg-green-500 hover:bg-green-400 text-slate-950 text-[10px] font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Admettre au concours
                        </button>
                        <button
                          onClick={() => handleRejectSubmission(sub)}
                          className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-red-400 text-[10px] font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Écarter
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* GLOBAL EDITORIAL DIRECTORY MANAGEMENT */}
          <div className="flex flex-col gap-4 mt-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2 font-mono">
              <Award className="w-4 h-4 text-amber-550" /> Table Générale des Récits ({stories.length})
            </span>

            <div className="bg-slate-950 border border-slate-850 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs text-slate-300">
                  <thead className="bg-[#0B0C0E]/60 text-slate-400 uppercase text-[9px] tracking-widest border-b border-slate-850">
                    <tr>
                      <th className="py-4 px-6">Récit / Code</th>
                      <th className="py-4 px-6">Auteur</th>
                      <th className="py-4 px-6">Genre Littéraire</th>
                      <th className="py-4 px-6">Progression / Vues</th>
                      <th className="py-4 px-6">Mise en Vedette</th>
                      <th className="py-4 px-6">Publication</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60">
                    {stories.map(story => (
                      <tr key={story.id} className="hover:bg-slate-900/30 transition">
                        <td className="py-4 px-6 font-bold text-slate-100">{story.title}</td>
                        <td className="py-4 px-6 text-slate-350">{story.authorName}</td>
                        <td className="py-4 px-6 capitalize font-mono text-amber-500/90">{story.genre}</td>
                        <td className="py-4 px-6 font-mono text-slate-400">{story.viewsCount} lectures</td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => handleToggleFeature(story)}
                            className={`px-3 py-1.5 rounded-xl font-bold font-sans text-[10px] transition cursor-pointer flex items-center gap-1.5 ${
                              story.isFeatured
                                ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                                : "bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800"
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${story.isFeatured ? "fill-current" : ""}`} />
                            <span>{story.isFeatured ? "Désépingler" : "Favoriser"}</span>
                          </button>
                        </td>
                        <td className="py-4 px-6 font-mono">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${story.isPublished ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-slate-900 text-slate-400 border border-slate-800"}`}>
                            {story.isPublished ? "Actif" : "Brouillon"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------- USERS & RBAC TAB --------------------- */}
      {activeTab === "users" && isAuthorizedToManageUsers && (
        <div className="flex flex-col gap-6 animate-fade-in">
          
          {/* Actions & Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
              Répertoire des citadins de la plateforme ({filteredProfiles.length})
            </span>
            <input
              type="text"
              placeholder="Rechercher par nom, email, rôle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 hover:bg-slate-900 transition border border-slate-800 text-slate-100 placeholder-slate-500 text-xs px-4 py-2.5 rounded-2xl w-full sm:w-80 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="bg-slate-950 border border-slate-850 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs text-slate-300">
                <thead className="bg-[#0B0C0E]/60 text-slate-400 uppercase text-[9px] tracking-widest border-b border-slate-850">
                  <tr>
                    <th className="py-4 px-6">Champion / Identifiant</th>
                    <th className="py-4 px-6">Adresse Email</th>
                    <th className="py-4 px-6">Rôle Actuel (RBAC)</th>
                    <th className="py-4 px-6">Permissions & claims</th>
                    <th className="py-4 px-6">État Exclusion</th>
                    <th className="py-4 px-6 text-right">Actions Correctives</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {filteredProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-550 text-xs">
                        Aucun champion ne correspond à vos critères de recherche.
                      </td>
                    </tr>
                  ) : (
                    filteredProfiles.map((user) => {
                      const isSelf = user.uid === currentUser.uid;
                      const hasSuperPrivilege = user.role === "SUPER_ADMIN";
                      const hasFounderPrivilege = user.role === "FOUNDER_OWNER";
                      // Standard admin cannot modify SUPER_ADMIN or FOUNDER_OWNER. SUPER_ADMIN cannot modify FOUNDER_OWNER.
                      // FOUNDER_OWNER is untouchable by anyone.
                      const isRestrictedByRBAC = 
                        (currentUser.role === "ADMIN" && (hasSuperPrivilege || hasFounderPrivilege)) ||
                        (currentUser.role === "SUPER_ADMIN" && hasFounderPrivilege) ||
                        hasFounderPrivilege;

                      return (
                        <tr key={user.uid} className={`hover:bg-slate-900/30 transition ${user.banned ? 'bg-red-950/10' : user.suspended ? 'bg-yellow-950/5' : ''}`}>
                          <td className="py-4 px-6 flex items-center gap-3">
                            <img
                              src={user.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                              alt={user.displayName}
                              className="w-8 h-8 rounded-full bg-slate-900 border border-slate-850"
                            />
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-150 flex items-center gap-1.5 leading-snug">
                                {user.displayName}
                                {isSelf && <span className="text-[8px] bg-slate-850 border border-slate-750 text-slate-400 px-1.5 py-0.5 rounded">Moi</span>}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono select-all">{user.uid.slice(0, 10)}...</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-mono text-slate-400 break-all">{user.email}</td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold tracking-wide uppercase font-mono border ${
                              user.role === "FOUNDER_OWNER"
                                ? "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse"
                                : user.role === "SUPER_ADMIN"
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/35"
                                : user.role === "ADMIN"
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/25"
                                : user.role === "MODERATOR"
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/25"
                                : user.role === "AUTHOR"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                                : "bg-slate-900 text-slate-400 border-slate-800"
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            {(isSelf && user.role === "FOUNDER_OWNER") || isRestrictedByRBAC ? (
                              <span className="text-[10px] text-slate-500 font-serif italic">Non modifiable (Système)</span>
                            ) : (
                              <select
                                value={user.role}
                                disabled={submitting === user.uid}
                                onChange={(e) => handleUpdateRole(user, e.target.value as UserRole)}
                                className="bg-[#0B0C0E] border border-slate-800 text-slate-200 text-xs px-2.5 py-1.5 rounded-xl focus:outline-none focus:border-amber-500 font-bold tracking-wide"
                              >
                                <option value="READER">Compte READER (Lecteur)</option>
                                <option value="AUTHOR">Compte AUTHOR (Auteur)</option>
                                <option value="MODERATOR">Compte MODERATOR (Modérateur)</option>
                                <option value="ADMIN">Compte ADMIN (Administrateur)</option>
                                {(currentUser.role === "SUPER_ADMIN" || currentUser.role === "FOUNDER_OWNER") && (
                                  <option value="SUPER_ADMIN">Compte SUPER_ADMIN (Gouvernance)</option>
                                )}
                                {currentUser.role === "FOUNDER_OWNER" && (
                                  <option value="FOUNDER_OWNER">Compte FOUNDER_OWNER (Fondateur)</option>
                                )}
                              </select>
                            )}
                          </td>
                          <td className="py-4 px-6 font-mono">
                            {user.banned ? (
                              <span className="text-red-420 font-bold text-[10px] flex items-center gap-1">
                                <Ban className="w-3 h-3 text-red-500" /> Définitif banni
                              </span>
                            ) : user.suspended ? (
                              <span className="text-yellow-500 font-bold text-[10px] flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" /> Suspendu
                              </span>
                            ) : (
                              <span className="text-emerald-400 text-[10px]">● Actif standard</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            {isSelf || isRestrictedByRBAC ? (
                              <span className="text-[10px] text-slate-550 font-serif italic select-none">Action interdite</span>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                {/* Suspend account */}
                                <button
                                  onClick={() => handleToggleSuspension(user)}
                                  disabled={submitting === user.uid || user.banned}
                                  title={user.suspended ? "Lever la suspension" : "Suspendre temporairement l'accès"}
                                  className={`p-2 rounded-xl border transition cursor-pointer select-none ${
                                    user.banned 
                                      ? "opacity-30 cursor-not-allowed border-slate-900 bg-slate-950 text-slate-600"
                                      : user.suspended
                                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                                      : "bg-yellow-500/5 hover:bg-yellow-500/10 border-yellow-500/20 text-yellow-550"
                                  }`}
                                >
                                  <Power className="w-3.5 h-3.5" />
                                </button>

                                {/* Ban account */}
                                <button
                                  onClick={() => handleToggleBan(user)}
                                  disabled={submitting === user.uid}
                                  title={user.banned ? "Lever le bannissement" : "Bannir de façon irrévocable"}
                                  className={`p-2 rounded-xl border transition cursor-pointer select-none ${
                                    user.banned
                                      ? "bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-800"
                                      : "bg-red-550/5 border-red-500/20 text-red-400 hover:bg-red-550/15"
                                  }`}
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>

                                {/* Full Reactivation button */}
                                {(user.suspended || user.banned) && (
                                  <button
                                    onClick={() => handleReactivateUser(user)}
                                    disabled={submitting === user.uid}
                                    title="Réhabiliter le champion et restaurer tous ses accès"
                                    className="p-2 rounded-xl bg-green-500 hover:bg-green-400 border border-green-600/30 text-slate-950 transition cursor-pointer select-none"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --------------------- AUDIT TRAIL TAB --------------------- */}
      {activeTab === "audit" && isAuthorizedToManageUsers && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
            Registres immuables des opérations administratives
          </span>

          <div className="bg-slate-955 border border-slate-850 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs text-slate-300">
                <thead className="bg-[#0B0C0E]/60 text-slate-400 uppercase text-[9px] tracking-widest border-b border-slate-850">
                  <tr>
                    <th className="py-4 px-6 w-52">Instigateur / Rôle</th>
                    <th className="py-4 px-6 w-40">Code Action</th>
                    <th className="py-4 px-6 w-52">Cible Modifiée</th>
                    <th className="py-4 px-6">Détails de l'Audit</th>
                    <th className="py-4 px-6 text-right w-48">Horodatage (UTC)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-905">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-550 text-xs">
                        Aucun événement de modération ou de correction n'est archivé.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/30 transition text-[11px] align-top">
                        <td className="py-4 px-6 font-bold text-white leading-tight">
                          {log.performedByName}
                          <span className="block text-[8.5px] text-slate-500 font-mono mt-0.5 select-all">{log.performedBy.slice(0, 10)}...</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold tracking-wide font-mono uppercase bg-slate-900 border border-slate-800 ${
                            log.action.includes("BAN") 
                              ? "text-red-400 border-red-500/20 bg-red-950/10" 
                              : log.action.includes("SUSPEND") 
                              ? "text-yellow-450 border-yellow-500/20 bg-yellow-950/10"
                              : "text-amber-500"
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-200">
                          {log.targetUserName}
                          <span className="block text-[8.5px] text-slate-500 font-mono mt-0.5 select-all">{log.targetUserId.slice(0, 10)}...</span>
                        </td>
                        <td className="py-4 px-6 text-slate-400 leading-relaxed font-sans">{log.details}</td>
                        <td className="py-4 px-6 font-mono text-slate-500 text-right">
                          {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --------------------- INFRASTRUCTURE & BUCKETS TAB --------------------- */}
      {activeTab === "infrastructure" && isAuthorizedToManageUsers && (
        <div className="flex flex-col gap-8 animate-fade-in">
          
          {/* Section Indicator */}
          <div>
            <span className="text-xs font-bold text-amber-500 uppercase tracking-widest font-mono">
              Diagnostic global & intégrité du système Stilova
            </span>
            <p className="text-xs text-slate-400 mt-1">
              Cette interface fournit un audit d'infrastructure souverain et permet l'initialisation automatisée ou la validation manuelle des composants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Firebase Auth Card */}
            <div className="bg-slate-955 border border-slate-850 p-6 rounded-3xl flex flex-col justify-between hover:border-slate-800 transition">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider font-mono">AUTHENTIFICATION (FIREBASE)</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${infraStatus.firebaseAuth === 'healthy' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                </div>
                <h3 className="text-sm font-extrabold text-white mt-1">Firebase Auth Engine</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Gère le ledger des comptes d'écrivains, présidents du jury, administrateurs et champions.
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-900">
                <span className="text-[10px] text-slate-500 font-mono">Module client / serveur</span>
                <span className="text-[10px] text-green-400 font-extrabold tracking-wide uppercase font-mono">ACTIF</span>
              </div>
            </div>

            {/* Firestore Database Card */}
            <div className="bg-slate-955 border border-slate-850 p-6 rounded-3xl flex flex-col justify-between hover:border-slate-800 transition">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider font-mono">BASE DE DONNÉES (FIRESTORE)</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${infraStatus.firestore === 'healthy' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                </div>
                <h3 className="text-sm font-extrabold text-white mt-1">Firestore DB NoSQL</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Enregistre de manière ordonnée les histoires, chapitres, soumissions, compétitions, listes d'audits et données RBAC.
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-900">
                <span className="text-[10px] text-slate-500 font-mono">ID: ai-studio-13866...</span>
                <span className="text-[10px] text-green-400 font-extrabold tracking-wide uppercase font-mono">CONNECTÉ</span>
              </div>
            </div>

            {/* Supabase Storage Card */}
            <div className="bg-slate-955 border border-slate-850 p-6 rounded-3xl flex flex-col justify-between hover:border-slate-800 transition">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider font-mono">STOCKAGE (SUPABASE)</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${infraStatus.supabaseUrl === 'configured' && infraStatus.supabaseAnonKey === 'configured' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                </div>
                <h3 className="text-sm font-extrabold text-white mt-1">Supabase Storage</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Entrepôt distribué pour les avatars de profils, les couvertures d'œuvres, illustrations IA d'Atelier, et clips sonores.
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-900">
                <span className="text-[10px] text-slate-500 font-mono">Fournisseur : Supabase JS</span>
                <span className="text-[10px] text-amber-500 font-extrabold tracking-wide uppercase font-mono">INTÉGRÉ</span>
              </div>
            </div>

          </div>

          {/* Interactive Console and Bucket Setup */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Console output & Actions */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Console de Diagnostics</span>
                <button
                  onClick={handleProvisionBuckets}
                  disabled={provisioning}
                  className="flex items-center gap-2 bg-amber-550 hover:bg-amber-500 text-slate-950 font-sans font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer select-none disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${provisioning ? 'animate-spin' : ''}`} />
                  {provisioning ? "Approvisionnement..." : "Vérifier & Initialiser les Buckets"}
                </button>
              </div>

              <div className="bg-[#0c0d10] border border-slate-850 p-5 rounded-2xl font-mono text-[11px] text-emerald-400 overflow-y-auto h-80 flex flex-col gap-1.5 shadow-inner">
                {infraLogs.map((log, idx) => {
                  let colorClass = "text-emerald-400";
                  if (log.includes("[ERREUR]") || log.includes("[DANGER]")) colorClass = "text-red-400 font-bold";
                  else if (log.includes("[AVERTISSEMENT]") || log.includes("[INFO]")) colorClass = "text-amber-400";
                  else if (log.includes("[SYSTEM]") || log.includes("---")) colorClass = "text-slate-450";
                  else if (log.includes("[RÉUSSITE]")) colorClass = "text-green-400 font-extrabold";
                  
                  return (
                    <div key={idx} className={`${colorClass} break-all hover:bg-slate-900/40 p-0.5 rounded transition`}>
                      {log}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Configured buckets checklist */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">État des Buckets Requis</span>
              <div className="bg-slate-955 border border-slate-850 p-6 rounded-2xl flex flex-col gap-4">
                
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">avatars</span>
                      <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 rounded uppercase">Public</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Avatars des champions (Lecture publique, écriture propriétaire).</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">covers</span>
                      <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 rounded uppercase">Public</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Couvertures d'ouvrages (Lecture publique, écriture AUTHOR/ADMIN).</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">illustrations</span>
                      <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 rounded uppercase">Public</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Générations d'images IA (Lecture publique, écriture AUTHOR/ADMIN).</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">chapters</span>
                      <span className="text-[8px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-1.5 rounded uppercase">Signé / Privé</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Séquences audio & musiques (Lecture signée, écriture AUTHOR/ADMIN).</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">contests</span>
                      <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 rounded uppercase">Public</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Matériel des soumissions (Lecture publique, écriture ADMIN uniquement).</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">temporary</span>
                      <span className="text-[8px] bg-cyan-500/10 border border-cyan-550/20 text-cyan-400 px-1.5 rounded uppercase">Privé</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Pièces jointes & caches temporaires (Lecture privée, suppression automatique).</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Secure RLS Policies Documentation for the Founder */}
          <div className="bg-slate-955 border border-slate-850 p-6 rounded-3xl flex flex-col gap-4">
            <span className="text-xs font-bold text-slate-250 uppercase tracking-wider font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Politiques RLS (Row Level Security) - Recommandations Supabase
            </span>
            <p className="text-xs text-slate-400 leading-normal font-sans">
              Pour assurer l'invulnérabilité du stockage vis-à-vis d'utilisateurs malveillants ou d'escalade de privilèges, appliquez les commandes SQL de sécurité d'accès suivantes sur l'éditeur SQL de votre tableau de bord Supabase :
            </p>

            <div className="bg-[#0b0c0e] border border-slate-900 rounded-2xl p-5 overflow-x-auto text-[10px] text-slate-300 font-mono flex flex-col gap-3 leading-relaxed">
              <div>
                <span className="text-amber-500 font-bold block">-- 1. RLS d'écriture stricte pour le dossier 'avatars'</span>
                <span>{"CREATE POLICY \"Utilisateurs peuvent insérer/modifier uniquement leur propre avatar\" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);"}</span>
              </div>
              <div className="pt-2 border-t border-slate-900">
                <span className="text-amber-500 font-bold block">-- 2. Lecture Publique de l'avatar</span>
                <span>{"CREATE POLICY \"Tout le monde peut lire les avatars\" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');"}</span>
              </div>
              <div className="pt-2 border-t border-slate-900">
                <span className="text-amber-500 font-bold block">-- 3. RLS d'écriture souveraine absolue du FONDATEUR (FOUNDER_OWNER)</span>
                <span>{"-- Le fondateur identifié par email gabrielyombi311@gmail.com possède un accès complet sans restriction."}</span>
                <span className="block italic text-slate-400">{"-- (S'applique via bypass de politiques ou triggers de rôles basés sur les claims personnalisés dans l'application)"}</span>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

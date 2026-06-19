import React, { useState, useEffect } from "react";
import { Story, Submission, AuditLog, UserProfile } from "../types";
import { dbService } from "../firebase";
import { 
  ShieldAlert, AlertTriangle, Check, X, RefreshCw, MessageSquare, 
  Trash2, Trophy, Clock, CheckCircle, ShieldCheck
} from "lucide-react";

interface ModerationPanelProps {
  stories: Story[];
  onRefreshStories: () => void;
  currentUser: UserProfile;
}

interface SimulatedComment {
  id: string;
  storyTitle: string;
  authorName: string;
  readerName: string;
  commentText: string;
  reason: string;
  createdAt: string;
}

export default function ModerationPanel({ stories, onRefreshStories, currentUser }: ModerationPanelProps) {
  const [activeTab, setActiveTab] = useState<"signalements" | "en_attente" | "concours" | "commentaires" | "historique">("signalements");
  const [loading, setLoading] = useState(true);
  
  // States of moderation contents
  const [reportedStories, setReportedStories] = useState<Story[]>([]);
  const [unreviewedStories, setUnreviewedStories] = useState<Story[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [reportedComments, setReportedComments] = useState<SimulatedComment[]>([]);
  const [moderationLogs, setModerationLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    loadModerationData();
  }, [stories, activeTab]);

  const loadModerationData = async () => {
    setLoading(true);
    try {
      // 1. Signalements (Reported stories)
      setReportedStories(stories.filter(s => s.reported));

      // 2. Contenus en attente (Mocking an unreviewed status list or unpublished drafts with high views to review)
      const pendingReview = stories.filter(s => !s.isPublished && s.viewsCount > 0);
      setUnreviewedStories(pendingReview.length > 0 ? pendingReview : stories.slice(0, 3));

      // 3. Validation concours
      const comps = await dbService.listCompetitions();
      let accumSubs: any[] = [];
      for (const comp of comps) {
        const subs = await dbService.listSubmissions(comp.id);
        const pending = subs.filter(s => s.status === "pending").map(s => ({
          ...s,
          competitionTitle: comp.title,
          competitionId: comp.id
        }));
        accumSubs = [...accumSubs, ...pending];
      }
      setPendingSubmissions(accumSubs);

      // 4. Modération commentaires (Simulated/persisted inside standard simulated arrays)
      const cachedComments = localStorage.getItem("stilova_reported_comments");
      if (cachedComments) {
        setReportedComments(JSON.parse(cachedComments));
      } else {
        const sampleComments: SimulatedComment[] = [
          {
            id: "c_1",
            storyTitle: "L'Éveilleur du Sahel",
            authorName: "Griot Quantique",
            readerName: "Amara G.",
            commentText: "Ce chapitre contient des insultes envers d'autres clans.",
            reason: "Harcèlement / Discours offensant",
            createdAt: new Date().toISOString()
          },
          {
            id: "c_2",
            storyTitle: "Le Trône de Kokomba",
            authorName: "Reine d'Aného",
            readerName: "Kofi_99",
            commentText: "Lien spam vers des cryptomonnaies : http://gratuits-bitcoins.com !",
            reason: "Spam / Publicité indésirable",
            createdAt: new Date().toISOString()
          }
        ];
        setReportedComments(sampleComments);
        localStorage.setItem("stilova_reported_comments", JSON.stringify(sampleComments));
      }

      // 5. Historique de modération (Filtered from general audit logs or custom mod action items)
      const allLogs = await dbService.listAuditLogs();
      const modsFiltered = allLogs.filter(log => 
        ["RETRAIT_HISTOIRE", "LEVER_SIGNALEMENT", "PROPOSITION_DANS_CONCOURS_APPROUVEE", "PROPOSITION_DANS_CONCOURS_REJETEE", "SUPPRESSION_COMMENTAIRE"].includes(log.action)
      );
      setModerationLogs(modsFiltered);

    } catch (e) {
      console.error("[Moderation] Failed to load data:", e);
    } finally {
      setLoading(false);
    }
  };

  // Log moderation action helper
  const saveModerationAudit = async (action: string, targetUid: string, targetName: string, details: string) => {
    const log: AuditLog = {
      id: "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      action,
      performedBy: currentUser.uid,
      performedByName: currentUser.displayName,
      targetUserId: targetUid,
      targetUserName: targetName,
      details,
      timestamp: new Date().toISOString()
    };
    await dbService.saveAuditLog(log);
  };

  // Actions: Signalements
  const handleDismissReport = async (story: Story) => {
    try {
      const updated = { ...story, reported: false };
      await dbService.saveStory(updated);
      await saveModerationAudit("LEVER_SIGNALEMENT", story.authorId, story.authorName, `Signalement annulé sur l'histoire "${story.title}"`);
      onRefreshStories();
    } catch (err) {
      console.error(err);
    }
  };

  const handleWithdrawStory = async (story: Story) => {
    try {
      const updated = { ...story, isPublished: false, reported: false };
      await dbService.saveStory(updated);
      await saveModerationAudit("RETRAIT_HISTOIRE", story.authorId, story.authorName, `Histoire "${story.title}" dépubliée d'autorité.`);
      onRefreshStories();
    } catch (err) {
      console.error(err);
    }
  };

  // Actions: Validation concours
  const handleApproveSubmission = async (sub: any) => {
    try {
      const updated: Submission = {
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
      await dbService.submitToCompetition(sub.competitionId, updated);
      
      // Update comps count
      const comps = await dbService.listCompetitions();
      const matched = comps.find(c => c.id === sub.competitionId);
      if (matched) {
        await dbService.saveCompetition({
          ...matched,
          submissionsCount: matched.submissionsCount + 1
        });
      }

      await saveModerationAudit("PROPOSITION_DANS_CONCOURS_APPROUVEE", sub.authorId, sub.authorName, `Candidature admise pour la nouvelle "${sub.storyTitle}" dans le défi.`);
      loadModerationData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectSubmission = async (sub: any) => {
    try {
      const updated: Submission = {
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
      await dbService.submitToCompetition(sub.competitionId, updated);
      await saveModerationAudit("PROPOSITION_DANS_CONCOURS_REJETEE", sub.authorId, sub.authorName, `Candidature écartée pour "${sub.storyTitle}"`);
      loadModerationData();
    } catch (err) {
      console.error(err);
    }
  };

  // Actions: Commentaires moderation
  const handleApproveComment = (id: string) => {
    const updated = reportedComments.filter(c => c.id !== id);
    setReportedComments(updated);
    localStorage.setItem("stilova_reported_comments", JSON.stringify(updated));
    saveModerationAudit("APPROBATION_COMMENTAIRE", "reader", "anonymous", `Signalement rejeté pour un commentaire signalé.`);
  };

  const handleRemoveComment = (id: string, c: SimulatedComment) => {
    const updated = reportedComments.filter(c => c.id !== id);
    setReportedComments(updated);
    localStorage.setItem("stilova_reported_comments", JSON.stringify(updated));
    saveModerationAudit("SUPPRESSION_COMMENTAIRE", "reader", c.readerName, `Commentaire de "${c.readerName}" supprimé : "${c.commentText}"`);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center p-20 min-h-[400px]">
        <RefreshCw className="w-10 h-10 text-amber-550 animate-spin" />
        <span className="font-sans font-medium text-xs text-slate-400">Accès au Tribunal Silencieux des Modérateurs Stilova...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1440px] mx-auto px-4 pb-16 animate-fade-in">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/15 to-transparent p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <ShieldAlert className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <span className="text-[10px] bg-red-500/15 border border-red-500/30 text-red-400 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
              Scribe de Vigilance : {currentUser.role}
            </span>
            <h2 className="font-sans font-extrabold text-slate-100 text-lg md:text-2xl mt-1">
              Tribunal & Modération Stilova
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5 max-w-2xl leading-relaxed">
              Maintenez la pureté de la cour d'écriture. Auditez les manuscrits controversés, filtrez les commentaires inappropriés et régulez les submissions au concours.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs list menu */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab("signalements")}
          className={`px-5 py-3 text-xs font-bold leading-none select-none transition border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "signalements"
              ? "border-red-500 text-red-400 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Signalements ({reportedStories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("en_attente")}
          className={`px-5 py-3 text-xs font-bold leading-none select-none transition border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "en_attente"
              ? "border-red-500 text-red-400 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Contenus en attente ({unreviewedStories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("concours")}
          className={`px-5 py-3 text-xs font-bold leading-none select-none transition border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "concours"
              ? "border-red-500 text-red-400 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Validation concours ({pendingSubmissions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("commentaires")}
          className={`px-5 py-3 text-xs font-bold leading-none select-none transition border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "commentaires"
              ? "border-red-500 text-red-400 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Modération commentaires ({reportedComments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("historique")}
          className={`px-5 py-3 text-xs font-bold leading-none select-none transition border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "historique"
              ? "border-red-500 text-red-400 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Historique de modération ({moderationLogs.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-[#0F1117] border border-slate-800 p-6 rounded-3xl min-h-[350px]">
        
        {/* PANEL 1: SIGNALEMENTS */}
        {activeTab === "signalements" && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <h4 className="text-xs font-extrabold text-[#E0E0E0] uppercase tracking-wider">Histoires signalées par la communauté</h4>
            {reportedStories.length === 0 ? (
              <div className="bg-slate-950 p-12 rounded-3xl text-slate-500 text-xs text-center flex items-center justify-center flex-col gap-2 border border-slate-900 shadow-inner">
                <ShieldCheck className="w-10 h-10 text-emerald-500/80 mb-1" />
                <span className="font-sans font-bold text-slate-300">Aucun signalement</span>
                <span>Toutes les récits diffusés respectent les règles impériales actuellement.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reportedStories.map((story) => (
                  <div key={story.id} className="bg-slate-950 border border-slate-850 p-5 rounded-3xl flex flex-col justify-between gap-4">
                    <div className="flex flex-col">
                      <div className="flex justify-between items-start">
                        <h4 className="font-sans font-bold text-slate-100 text-sm">{story.title}</h4>
                        <span className="text-[9px] bg-red-500/20 border border-red-500/30 text-red-400 font-bold uppercase tracking-wider px-2 py-0.5 rounded">Signalé</span>
                      </div>
                      <span className="text-[10px] text-amber-500 font-mono mt-0.5">Par {story.authorName} • {story.genre}</span>
                      <p className="text-[11px] text-slate-400 mt-2 italic font-serif leading-relaxed">"{story.description}"</p>
                    </div>

                    <div className="flex items-center gap-3 mt-1 border-t border-slate-900 pt-3">
                      <button
                        onClick={() => handleDismissReport(story)}
                        className="flex-1 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 text-[10px] font-bold py-2 rounded-xl transition cursor-pointer"
                      >
                        Lever l'alerte
                      </button>
                      <button
                        onClick={() => handleWithdrawStory(story)}
                        className="flex-1 bg-red-950/20 hover:bg-red-900/40 text-red-400 border border-red-900 text-[10px] font-bold py-2 rounded-xl transition cursor-pointer"
                      >
                        Retirer de la diffusion
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PANEL 2: CONTENUS EN ATTENTE */}
        {activeTab === "en_attente" && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <h4 className="text-xs font-extrabold text-[#E0E0E0] uppercase tracking-wider">Œuvres prêtes pour visa d'édition prioritaire</h4>
            <div className="grid grid-cols-1 gap-4">
              {unreviewedStories.map((story) => (
                <div key={story.id} className="bg-slate-950 border border-slate-850 p-4 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex gap-4">
                    <img src={story.coverUrl} className="w-12 h-16 object-cover rounded border border-slate-800" />
                    <div className="flex flex-col">
                      <h4 className="font-sans font-bold text-slate-100 text-sm">{story.title}</h4>
                      <span className="text-[10px] text-slate-450 italic mt-0.5">Scribe : {story.authorName} • Genre : {story.genre}</span>
                      <p className="text-[11px] text-slate-450 line-clamp-1 mt-1 leading-relaxed">{story.description}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={async () => {
                        const updated = { ...story, isPublished: true };
                        await dbService.saveStory(updated);
                        await saveModerationAudit("PUBLIER_OEUVRE", story.authorId, story.authorName, `Œuvre approuvée par visa : "${story.title}"`);
                        onRefreshStories();
                      }}
                      className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-[10px] px-3 py-2 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Mettre en ligne
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PANEL 3: VALIDATION CONCOURS */}
        {activeTab === "concours" && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <h4 className="text-xs font-extrabold text-[#E0E0E0] uppercase tracking-wider">Inscriptions aux défis littéraires en attente d'approbation</h4>
            {pendingSubmissions.length === 0 ? (
              <div className="bg-slate-950 p-12 rounded-3xl text-slate-500 text-xs text-center flex items-center justify-center flex-col gap-2 border border-slate-900 shadow-inner">
                <ShieldCheck className="w-10 h-10 text-amber-500/70 mb-1" />
                <span className="font-sans font-bold text-slate-300">Aucun manuscrit en attente</span>
                <span>Toutes les candidatures aux défis actifs sont régulées.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingSubmissions.map((sub) => (
                  <div key={sub.id} className="bg-slate-955 border border-slate-850 p-5 rounded-3xl flex flex-col justify-between gap-4">
                    <div>
                      <span className="text-[9px] text-amber-400 font-bold uppercase font-mono tracking-wide">DÉFI : {sub.competitionTitle}</span>
                      <h4 className="font-sans font-extrabold text-slate-200 text-sm mt-1">{sub.storyTitle}</h4>
                      <p className="text-[10px] text-slate-400 font-serif italic mt-0.5">Candidat : {sub.authorName}</p>
                    </div>

                    <div className="flex items-center gap-2 border-t border-slate-900 pt-3">
                      <button
                        onClick={() => handleRejectSubmission(sub)}
                        className="flex-1 bg-slate-900 hover:bg-slate-850 text-slate-350 hover:text-red-400 text-[10px] font-bold py-2 rounded-xl transition cursor-pointer"
                      >
                        Écarter
                      </button>
                      <button
                        onClick={() => handleApproveSubmission(sub)}
                        className="flex-1 bg-amber-500 hover:bg-amber-450 text-slate-950 text-[10px] font-bold py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Admettre au concours
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PANEL 4: MODERATION COMMENTAIRES */}
        {activeTab === "commentaires" && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <h4 className="text-xs font-extrabold text-[#E0E0E0] uppercase tracking-wider">Commentaires de lecteurs signalés par modération</h4>
            {reportedComments.length === 0 ? (
              <div className="bg-slate-950 p-12 rounded-3xl text-slate-500 text-xs text-center flex items-center justify-center flex-col gap-2 border border-slate-900 shadow-inner">
                <ShieldCheck className="w-10 h-10 text-emerald-500/80 mb-1" />
                <span className="font-sans font-bold text-slate-300">Rapports vierges</span>
                <span>Aucun commentaire inapproprié à examiner.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {reportedComments.map((c) => (
                  <div key={c.id} className="bg-slate-950 border border-slate-850 p-4 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1 text-left">
                      <span className="text-[9.5px] bg-[#991B1B]/20 text-red-400 border border-[#991B1B]/30 px-2 py-0.5 rounded-full font-mono font-semibold w-max">
                        {c.reason}
                      </span>
                      <p className="text-xs text-slate-200 mt-1 font-sans font-medium">"{c.commentText}"</p>
                      <span className="text-[10px] text-slate-450 mt-1">
                        Sur l'œuvre : <strong className="text-slate-350">{c.storyTitle}</strong> par <strong className="text-slate-350">{c.authorName}</strong> | Lecteur : <strong className="text-amber-500">{c.readerName}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        onClick={() => handleRemoveComment(c.id, c)}
                        className="bg-slate-900 hover:bg-red-950 text-slate-300 hover:text-red-400 border border-slate-850 text-[10.5px] font-bold px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Supprimer
                      </button>
                      <button
                        onClick={() => handleApproveComment(c.id)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10.5px] font-bold px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Approuver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PANEL 5: HISTORIQUE MODERATION */}
        {activeTab === "historique" && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <h4 className="text-xs font-extrabold text-[#E0E0E0] uppercase tracking-wider">Registre de modération</h4>
            <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs text-slate-300">
                  <thead className="bg-[#0B0C0E]/60 text-slate-400 uppercase text-[9px] tracking-widest border-b border-slate-850">
                    <tr>
                      <th className="py-3 px-5">Modérateur / Scribe</th>
                      <th className="py-3 px-5">Action de censure</th>
                      <th className="py-3 px-5">Cibles / Infos</th>
                      <th className="py-3 px-5 text-right">Datation (UTC)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 font-mono text-[10.5px]">
                    {moderationLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/10">
                        <td className="py-3 px-5 font-bold text-white">{log.performedByName}</td>
                        <td className="py-3 px-5 text-red-400">{log.action}</td>
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

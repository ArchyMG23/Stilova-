import React, { useState, useEffect } from "react";
import { Story, Submission, Competition } from "../types";
import { dbService } from "../firebase";
import { ShieldCheck, EyeOff, Trash2, Heart, Check, X, ShieldAlert, Award, RefreshCw } from "lucide-react";

interface AdminPanelProps {
  stories: Story[];
  onRefreshStories: () => void;
}

export default function AdminPanel({ stories, onRefreshStories }: AdminPanelProps) {
  const [reportedStories, setReportedStories] = useState<Story[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModeratorResources();
  }, [stories]);

  const loadModeratorResources = async () => {
    setLoading(true);
    try {
      // 1. Reported
      setReportedStories(stories.filter(s => s.reported));

      // 2. Pending submissions across all competitions
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
    } catch (e) {
      console.error("Moderation load failed", e);
    } finally {
      setLoading(false);
    }
  };

  // Skip report / dismiss
  const handleDismissReport = async (story: Story) => {
    try {
      const updated = { ...story, reported: false };
      await dbService.saveStory(updated);
      onRefreshStories();
    } catch (e) {
      console.error("Dismis report failed", e);
    }
  };

  // Withdraw / unpublish story
  const handleUnpublishStory = async (story: Story) => {
    try {
      const updated = { ...story, isPublished: false, reported: false };
      await dbService.saveStory(updated);
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

      loadModeratorResources();
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
      loadModeratorResources();
    } catch (e) {
      console.error("Submission reject failed", e);
    }
  };

  // Curate Feature badge toggle
  const handleToggleFeature = async (story: Story) => {
    try {
      const updated = { ...story, isFeatured: !story.isFeatured };
      await dbService.saveStory(updated);
      onRefreshStories();
    } catch (e) {
      console.error("curation swap failed", e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center p-20 min-h-[400px]">
        <RefreshCw className="w-10 h-10 text-amber-550 animate-spin" />
        <span className="font-sans font-medium text-xs text-slate-400">Ouverture du tableau de censure et de modération...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto px-4">
      
      {/* Title banner */}
      <div className="bg-gradient-to-r from-red-950/20 via-slate-900 to-transparent p-6 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-red-500 animate-pulse" />
          <div>
            <h2 className="font-sans font-bold text-slate-100 text-lg md:text-2xl">Cercle de Modération — Stilova</h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5 leading-relaxed">
              Conservez l'héritage d'or et d'argent de Stilova. Surveillez les récits signalés par la communauté, examinez les propositions d'inscription aux concours et attribuez des badges de mise en valeur aux meilleures plumes d'Afrique.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* REPORTED CONTENT PANEL */}
        <div className="flex flex-col gap-4">
          <span className="text-xs font-bold text-red-400 uppercase tracking-widest px-1 flex items-center gap-1.5 matches">
            <Trash2 className="w-4 h-4" /> Récits signalés ({reportedStories.length})
          </span>

          <div className="flex flex-col gap-3">
            {reportedStories.length === 0 ? (
              <div className="bg-slate-900/10 border border-slate-850 p-10 rounded-3xl text-slate-500 text-xs text-center flex items-center justify-center flex-col gap-2">
                <ShieldCheck className="w-10 h-10 text-slate-600" />
                <span>Aucune plainte enregistrée. La communauté est saine !</span>
              </div>
            ) : (
              reportedStories.map((story) => (
                <div key={story.id} className="bg-slate-950 border border-slate-850 p-4 rounded-3xl flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-sans font-bold text-slate-100 text-xs leading-snug">{story.title}</h4>
                      <span className="text-[10px] text-slate-400 font-serif italic">Par {story.authorName} • {story.genre}</span>
                    </div>
                    <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 font-bold px-2.5 py-0.5 rounded-full uppercase">
                      Signalé
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-normal line-clamp-2">
                    {story.description}
                  </p>

                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => handleDismissReport(story)}
                      className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 text-[10px] font-bold py-2 rounded-xl transition cursor-pointer"
                    >
                      Ignorer le signalement
                    </button>
                    <button
                      onClick={() => handleUnpublishStory(story)}
                      className="flex-1 bg-red-950/40 border border-red-900 text-red-400 hover:bg-red-900/20 text-[10px] font-bold py-2 rounded-xl transition cursor-pointer"
                    >
                      Désactiver la publication
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PENDING SUBMISSIONS PANELS */}
        <div className="flex flex-col gap-4">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest px-1 flex items-center gap-1.5 matches">
            <RefreshCw className="w-4 h-4 text-amber-500" /> Propositions d'inscription ({pendingSubmissions.length})
          </span>

          <div className="flex flex-col gap-3">
            {pendingSubmissions.length === 0 ? (
              <div className="bg-slate-900/10 border border-slate-850 p-10 rounded-3xl text-slate-500 text-xs text-center">
                Aucune inscription en attente d'approbation d'un modérateur.
              </div>
            ) : (
              pendingSubmissions.map((sub) => (
                <div key={sub.id} className="bg-slate-950 border border-slate-850 p-4 rounded-3xl flex flex-col gap-3">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-amber-400 font-bold uppercase mb-1">DÉFI : {sub.competitionTitle}</span>
                    <h4 className="font-sans font-bold text-slate-100 text-xs leading-snug">{sub.storyTitle}</h4>
                    <span className="text-[10px] text-slate-400 font-serif italic mt-0.5">Auteur : {sub.authorName}</span>
                  </div>

                  <div className="flex items-center gap-2.5 mt-1">
                    <button
                      onClick={() => handleApproveSubmission(sub)}
                      className="flex-1 bg-green-500 hover:bg-green-400 text-slate-950 text-[10px] font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Approuver et inscrire
                    </button>
                    <button
                      onClick={() => handleRejectSubmission(sub)}
                      className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-red-400 text-[10px] font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Rejeter
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* CURATOR ALL-STORIES MANAGEMENT BOARD */}
      <div className="flex flex-col gap-4 mt-8">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" /> Gestion éditoriale ({stories.length})
        </span>

        <div className="bg-slate-950 border border-slate-850 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wide border-b border-slate-850">
                <tr>
                  <th className="py-4 px-6">Récit / Titre</th>
                  <th className="py-4 px-6">Auteur</th>
                  <th className="py-4 px-6">Genre</th>
                  <th className="py-4 px-6">Lectures</th>
                  <th className="py-4 px-6">Mise en avant (Une)</th>
                  <th className="py-4 px-6">Statut de diffusion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {stories.map(story => (
                  <tr key={story.id} className="hover:bg-slate-900/40">
                    <td className="py-4 px-6 font-bold text-slate-100">{story.title}</td>
                    <td className="py-4 px-6">{story.authorName}</td>
                    <td className="py-4 px-6 capitalize">{story.genre}</td>
                    <td className="py-4 px-6 font-mono">{story.viewsCount} lectures</td>
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
                        <span>{story.isFeatured ? "En Vedette" : "Favoriser"}</span>
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${story.isPublished ? "bg-green-500/10 text-green-400 border border-green-505/20" : "bg-slate-900 text-slate-400 border border-slate-800"}`}>
                        {story.isPublished ? "Diffusé" : "Brouillon"}
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
  );
}

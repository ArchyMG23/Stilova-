import React, { useState, useEffect } from "react";
import { Competition, Submission, Story } from "../types";
import { dbService } from "../firebase";
import { Trophy, Calendar, Coins, User, ThumbsUp, Send, CheckCircle, HelpCircle, RefreshCw } from "lucide-react";

interface ContestsViewProps {
  currentUserUid?: string;
  currentUserRole?: string;
  myStories: Story[];
  onSelectStory: (storyId: string) => void;
  isVisitor?: boolean;
}

export default function ContestsView({ currentUserUid, currentUserRole, myStories, onSelectStory, isVisitor }: ContestsViewProps) {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedComp, setSelectedComp] = useState<Competition | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  // States for participating in the contest
  const [submittingStoryId, setSubmittingStoryId] = useState("");
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Vote tracing
  const [votedMap, setVotedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchContests() {
      setLoading(true);
      try {
        const list = await dbService.listCompetitions();
        setCompetitions(list);
        if (list.length > 0) {
          setSelectedComp(list[0]);
          loadSubmissions(list[0].id);
        }
      } catch (err) {
        console.error("Failed to load battles", err);
      } finally {
        setLoading(false);
      }
    }
    fetchContests();
  }, []);

  const loadSubmissions = async (compId: string) => {
    try {
      const subs = await dbService.listSubmissions(compId);
      // Filter only approved submissions or user's own submissions
      const filtered = subs.filter(s => s.status === "approved" || s.authorId === currentUserUid);
      setSubmissions(filtered.sort((a, b) => b.votesCount - a.votesCount));
    } catch (e) {
      console.error("Submissions load error", e);
    }
  };

  const handleSelectComp = (comp: Competition) => {
    setSelectedComp(comp);
    loadSubmissions(comp.id);
    setSubmitMessage(null);
    setSubmitError(null);
  };

  // Submit story to the battle
  const handleSubmitStoryToCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComp || !submittingStoryId || !currentUserUid) return;

    const sourceStory = myStories.find(s => s.id === submittingStoryId);
    if (!sourceStory) return;

    setSubmitMessage(null);
    setSubmitError(null);

    // Make sure we don't submit if already entered
    const isAlreadySubmitted = submissions.some(s => s.storyId === submittingStoryId);
    if (isAlreadySubmitted) {
      setSubmitError("Ce récit est déjà inscrit à ce concours littéraire !");
      return;
    }

    try {
      const newSubmission: Submission = {
        id: `sub_${Date.now()}_${submittingStoryId}`,
        competitionId: selectedComp.id,
        storyId: submittingStoryId,
        storyTitle: sourceStory.title,
        authorId: currentUserUid,
        authorName: sourceStory.authorName,
        votesCount: 0,
        status: currentUserRole === "admin" || currentUserRole === "moderator" ? "approved" : "pending", // Pending curation approval unless admin
        createdAt: new Date().toISOString()
      };

      await dbService.submitToCompetition(selectedComp.id, newSubmission);

      // Locally add to submissions
      if (newSubmission.status === "approved") {
        setSubmissions(prev => [...prev, newSubmission]);
        // Increment submissions count on competition
        const updatedComp = { ...selectedComp, submissionsCount: selectedComp.submissionsCount + 1 };
        await dbService.saveCompetition(updatedComp);
        setCompetitions(prev => prev.map(c => c.id === selectedComp.id ? updatedComp : c));
        setSelectedComp(updatedComp);
      }

      setSubmitMessage(
        newSubmission.status === "approved" 
          ? "Félicitations ! Votre chef-d'œuvre a été publié en direct dans la liste du concours." 
          : "Votre candidature littéraire a été enregistrée avec succès. Elle est en cours d'approbation par les modérateurs de Stilova."
      );
      setSubmittingStoryId("");
    } catch (err) {
      setSubmitError("Une erreur est survenue lors de l'envoi de votre plume.");
    }
  };

  // Cast high-fidelity vote
  const handleVote = async (sub: Submission) => {
    if (isVisitor) {
      alert("En tant que visiteur, vous ne pouvez pas participer aux votes. Veuillez créer un compte gratuit pour inscrire votre plume !");
      return;
    }

    if (!currentUserUid) {
      alert("Veuillez vous inscrire ou vous connecter pour participer au vote du concours.");
      return;
    }

    if (votedMap[sub.id]) {
      alert("Vous avez déjà gravé votre vote pour cette plume !");
      return;
    }

    if (!selectedComp) return;

    try {
      const allowed = await dbService.castVote(selectedComp.id, sub.id, currentUserUid);
      if (allowed) {
        setVotedMap(prev => ({ ...prev, [sub.id]: true }));
        // Update local count
        setSubmissions(prev => 
          prev.map(s => s.id === sub.id ? { ...s, votesCount: s.votesCount + 1 } : s)
          .sort((a, b) => b.votesCount - a.votesCount)
        );
      } else {
        alert("Vous avez déjà enregistré votre vote pour cette plume (limite d'un seul vote atteint).");
      }
    } catch (e) {
      console.error("Voting failed", e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center p-20 min-h-[400px]">
        <RefreshCw className="w-10 h-10 text-amber-550 animate-spin" />
        <span className="font-sans font-medium text-xs text-slate-400">Arrivée à l'arène des plumes (Concours)...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1440px] mx-auto px-4">
      
      {/* Page Title banner */}
      <div className="bg-gradient-to-r from-amber-550/15 via-indigo-950/20 to-transparent p-6 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-amber-550 animate-bounce" />
          <div>
            <h2 className="font-sans font-bold text-slate-100 text-lg md:text-2xl">Concours Littéraires — Stilova</h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5 leading-relaxed">
              Démontrez votre talent de conteur. Participez aux défis thématiques panafricains, votez pour vos histoires favorites et gravez les légendes de la nouvelle génération.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Competitions selection sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Défis en cours</span>
          <div className="flex flex-col gap-2">
            {competitions.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-900/30 text-xs text-slate-500 text-center border border-slate-850">
                Aucun concours ouvert pour le moment.
              </div>
            ) : (
              competitions.map((comp) => (
                <div
                  key={comp.id}
                  onClick={() => handleSelectComp(comp)}
                  className={`border p-4 rounded-3xl cursor-pointer transition flex flex-col gap-2 ${
                    selectedComp?.id === comp.id
                      ? "bg-amber-500 border-amber-400 text-slate-950 scale-102 shadow-lg"
                      : "bg-slate-900/50 hover:bg-slate-900 border-slate-800 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Trophy className={`w-4 h-4 ${selectedComp?.id === comp.id ? "text-slate-950" : "text-amber-500"}`} />
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${selectedComp?.id === comp.id ? "bg-slate-950 text-amber-400" : "bg-amber-500/20 text-amber-400"}`}>
                      {comp.isOpen ? "Ouvert" : "Clos"}
                    </span>
                  </div>

                  <h4 className="font-sans font-bold text-xs leading-snug line-clamp-2">
                    {comp.title}
                  </h4>

                  <span className={`text-[10px] font-mono flex items-center gap-1 ${selectedComp?.id === comp.id ? "text-slate-800" : "text-slate-400"}`}>
                    <Coins className="w-3.5 h-3.5" /> Prix: {comp.prizeAmount}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected competition content */}
        {selectedComp ? (
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* Challenge description card */}
            <div className="bg-slate-950 border border-slate-850 p-6 rounded-3xl flex flex-col gap-4 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 transform translate-x-8 -translate-y-8 bg-amber-500/5 rounded-full pointer-events-none" />

              <h3 className="font-sans font-bold text-slate-100 text-base md:text-xl">
                {selectedComp.title}
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-y border-slate-900 py-3 mt-1 text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-500 text-[10px]">Thématique de Plume</span>
                  <span className="text-slate-300 font-semibold">{selectedComp.theme}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-500 text-[10px]">Date limite de dépôt</span>
                  <span className="text-slate-300 font-semibold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    {new Date(selectedComp.deadline).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 col-span-2 sm:col-span-1">
                  <span className="text-slate-500 text-[10px]">Meilleure Récompense</span>
                  <span className="text-slate-300 font-bold text-amber-400">{selectedComp.prizeAmount}</span>
                </div>
              </div>

              <p className="text-slate-300 text-xs leading-relaxed font-sans mt-2">
                {selectedComp.description}
              </p>

              {/* Creator submission Form if applicable */}
              {currentUserRole === "writer" && selectedComp.isOpen && !isVisitor && (
                <div className="border-t border-slate-900 pt-5 mt-3 flex flex-col gap-3">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 matches">
                    <Send className="w-4 h-4 text-amber-500" /> Graver votre candidature au défi
                  </span>

                  {myStories.length === 0 ? (
                    <div className="p-3 bg-amber-500/5 border border-dashed border-amber-500/20 rounded-2xl text-[11px] text-amber-400">
                      Vous n'avez écrit aucune histoire pour le moment. Allez de ce pas créer une œuvre littéraire pour pouvoir l'inscrire au concours !
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitStoryToCompetition} className="flex flex-col sm:flex-row gap-3 items-end">
                      <div className="flex-1 flex flex-col gap-1.5 w-full">
                        <label className="text-[10px] text-slate-400">Sélectionner votre œuvre à soumettre :</label>
                        <select
                          value={submittingStoryId}
                          onChange={(e) => setSubmittingStoryId(e.target.value)}
                          required
                          className="bg-slate-900 border border-slate-800 rounded-2xl py-3 px-4 text-xs text-slate-200 outline-none w-full font-sans cursor-pointer focus:ring-1 focus:ring-amber-500"
                        >
                          <option value="">-- Choisir parmi vos récits --</option>
                          {myStories.map(s => (
                            <option key={s.id} value={s.id}>{s.title} ({s.genre})</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={!submittingStoryId}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 px-6 rounded-2xl text-xs flex items-center gap-2 cursor-pointer transition w-full sm:w-auto justify-center disabled:opacity-50"
                      >
                        Soumettre la plume
                      </button>
                    </form>
                  )}

                  {submitMessage && (
                    <div className="bg-green-950/40 border border-green-900 text-green-300 p-3.5 rounded-2xl text-xs flex items-start gap-2 animate-fade-in mt-1">
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      <div>{submitMessage}</div>
                    </div>
                  )}

                  {submitError && (
                    <div className="bg-red-950/40 border border-red-900 text-red-300 p-3.5 rounded-2xl text-xs flex items-center gap-2 animate-fade-in mt-1">
                      <HelpCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <div>{submitError}</div>
                    </div>
                  )}
                </div>
              )}

              {isVisitor && (
                <div id="voter-visitor-lock" className="border-t border-slate-900 pt-5 mt-3 flex flex-col gap-3">
                  <div className="p-4 bg-slate-950 border border-amber-550/20 rounded-3xl flex flex-col items-center text-center gap-2">
                    <Trophy className="w-6 h-6 text-amber-550 shrink-0" />
                    <span className="text-xs font-semibold text-amber-400">🏆 Participez ou votez pour vos favoris</span>
                    <p className="text-[11px] text-slate-400 max-w-md leading-relaxed">
                      En tant que simple visiteur, le vote et l'inscription de récits sont sécurisés pour les comptes d'auteurs et lecteurs enregistrés. Créez un compte gratuit pour immortaliser vos propres manuscrits !
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Submissions leaderboard active list */}
            <div className="flex flex-col gap-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                Œuvres candidates ({submissions.length})
              </span>

              {submissions.length === 0 ? (
                <div className="bg-slate-900/20 border border-dashed border-slate-800 p-12 rounded-3xl text-center text-slate-500 text-xs">
                  Aucune plume n'a encore franchi le rideau d'acier de cette arène. Votez pour vos coups de cœur dès qu'un conteur s'élancera.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {submissions.map((sub, idx) => (
                    <div
                      key={sub.id}
                      className="bg-slate-950 border border-slate-850 p-4 rounded-3xl flex items-center justify-between gap-4 hover:border-slate-800"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Rank Circle */}
                        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center font-mono font-bold text-xs text-amber-500 shrink-0">
                          #{idx + 1}
                        </div>

                        <div className="min-w-0">
                          <h4 
                            onClick={() => onSelectStory(sub.storyId)}
                            className="font-sans font-bold text-slate-100 text-xs leading-snug hover:text-amber-400 transition cursor-pointer truncate"
                          >
                            {sub.storyTitle}
                          </h4>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3 text-slate-500" /> Par {sub.authorName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Vote trigger button */}
                        <button
                          onClick={() => handleVote(sub)}
                          className={`px-3 py-2 rounded-2xl flex items-center gap-1.5 transition text-[10px] font-bold cursor-pointer ${
                            votedMap[sub.id]
                              ? "bg-green-500/10 text-green-400 border border-green-500/20"
                              : "bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200"
                          }`}
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 ${votedMap[sub.id] ? "text-green-400 fill-current" : ""}`} />
                          <span>{sub.votesCount} votes</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="lg:col-span-3 text-center p-12 bg-slate-900/30 rounded-3xl border border-slate-800 text-slate-400 text-xs">
            Sélectionnez un concours dans l'arène latérale pour découvrir ses candidats.
          </div>
        )}
      </div>

    </div>
  );
}

import React, { useState, useRef, useEffect } from "react";
import { UserProfile, UserRole, Story, AfricanGenre } from "../types";
import { StorageService } from "../lib/storage";
import { dbService, auth } from "../firebase";
import { updateEmail, updatePassword, deleteUser } from "firebase/auth";
import { 
  User, Mail, Key, Shield, ShieldCheck, Trash2, Camera, Sparkles, Bell, 
  Check, Eye, EyeOff, Save, LogOut, BookOpen, Clock, Activity, Settings, 
  UserX, Star, Zap, Sliders, RefreshCw, AlertCircle, ShieldAlert
} from "lucide-react";

interface UserProfileViewProps {
  currentUser: UserProfile;
  stories: Story[];
  onProfileUpdate: (updated: UserProfile) => void;
  onLogout: () => void;
  onSelectStory: (storyId: string) => void;
}

const AVATAR_CATEGORIES = {
  ecrivains: {
    label: "Écrivains",
    avatars: [
      { name: "La Plume noire", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=plume_noire" },
      { name: "Le Scribe", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=scribe" },
      { name: "Sembène", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=sembene" },
      { name: "Mariama", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=mariama" }
    ]
  },
  plumes: {
    label: "Plumes",
    avatars: [
      { name: "Plume d'Or", url: "https://api.dicebear.com/7.x/bottts/svg?seed=gold" },
      { name: "Plume Céleste", url: "https://api.dicebear.com/7.x/bottts/svg?seed=celeste" },
      { name: "Plume d'Ébène", url: "https://api.dicebear.com/7.x/bottts/svg?seed=ebene" },
      { name: "Plume Ardente", url: "https://api.dicebear.com/7.x/bottts/svg?seed=fire" }
    ]
  },
  personnages: {
    label: "Personnages",
    avatars: [
      { name: "Le Combattant", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=avatar_fighter" },
      { name: "La Hackeuse", url: "https://api.dicebear.com/7.x/bottts/svg?seed=goree" },
      { name: "Le Gardien", url: "https://api.dicebear.com/7.x/bottts/svg?seed=ife" },
      { name: "La Princesse", url: "https://api.dicebear.com/7.x/bottts/svg?seed=astral" }
    ]
  },
  animaux: {
    label: "Animaux",
    avatars: [
      { name: "Lion du Sahel", url: "https://api.dicebear.com/7.x/identicon/svg?seed=lion" },
      { name: "Aigle Royal", url: "https://api.dicebear.com/7.x/identicon/svg?seed=eagle" },
      { name: "Guépard Agile", url: "https://api.dicebear.com/7.x/identicon/svg?seed=cheetah" },
      { name: "Gorille Protecteur", url: "https://api.dicebear.com/7.x/identicon/svg?seed=gorilla" }
    ]
  },
  fantasy: {
    label: "Fantasy",
    avatars: [
      { name: "Griot Quantique", url: "https://api.dicebear.com/7.x/bottts/svg?seed=quantum" },
      { name: "Sorcier de Sel", url: "https://api.dicebear.com/7.x/bottts/svg?seed=saltsorcerer" },
      { name: "Chaman Royal", url: "https://api.dicebear.com/7.x/bottts/svg?seed=royalshaman" },
      { name: "Esprit Lumineux", url: "https://api.dicebear.com/7.x/bottts/svg?seed=lightspirit" }
    ]
  },
  minimalistes: {
    label: "Minimalistes",
    avatars: [
      { name: "Nébuleuse", url: "https://api.dicebear.com/7.x/initials/svg?seed=Neb" },
      { name: "Sable chaud", url: "https://api.dicebear.com/7.x/initials/svg?seed=Sah" },
      { name: "Émeraude", url: "https://api.dicebear.com/7.x/initials/svg?seed=Eme" },
      { name: "Océan", url: "https://api.dicebear.com/7.x/initials/svg?seed=Oce" }
    ]
  }
};

export default function UserProfileView({ 
  currentUser, 
  stories, 
  onProfileUpdate, 
  onLogout,
  onSelectStory 
}: UserProfileViewProps) {
  // Tabs: "profile_main" | "profile_edit" | "profile_library" | "profile_history" | "profile_notifications" | "profile_security" | "profile_preferences"
  const [activeTab, setActiveTab] = useState<string>("profile_main");

  // Basic editing attributes
  const [displayName, setDisplayName] = useState(currentUser.displayName || "");
  const [bio, setBio] = useState(currentUser.bio || "");
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(currentUser.avatarUrl || "");
  const [activeAvatarCategory, setActiveAvatarCategory] = useState<keyof typeof AVATAR_CATEGORIES>("ecrivains");
  
  // Custom states
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Crop / File upload states
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [cropPanX, setCropPanX] = useState<number>(0);
  const [cropPanY, setCropPanY] = useState<number>(0);
  const cropCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Security Credentials states
  const [newEmail, setNewEmail] = useState(currentUser.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [isSecuritySaving, setIsSecuritySaving] = useState(false);

  // Account suppression
  const [deleteInputText, setDeleteInputText] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Notifications toggles
  const [prefNotificationEmails, setPrefNotificationEmails] = useState(true);
  const [prefWeeklyGriot, setPrefWeeklyGriot] = useState(true);
  const [prefStoryUpdates, setPrefStoryUpdates] = useState(true);

  // Privacy toggles
  const [prefProfilePrivate, setPrefProfilePrivate] = useState(false);
  const [prefGenderList, setPrefGenderList] = useState<string[]>(currentUser.favoriteGenres || []);

  const clearStatus = () => {
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // 1. Get saved Offline stories
  const [offlineSavedStories, setOfflineSavedStories] = useState<Story[]>([]);
  useEffect(() => {
    try {
      const offlineIds: string[] = JSON.parse(localStorage.getItem("stilova_offline_story_ids") || "[]");
      const matched = stories.filter(s => offlineIds.includes(s.id));
      setOfflineSavedStories(matched);
    } catch (e) {
      console.warn("Could not retrieve offline stories:", e);
    }
  }, [stories, activeTab]);

  // Handle uploaded local avatar file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImageSrc(reader.result as string);
        setCropZoom(1);
        setCropPanX(0);
        setCropPanY(0);
      };
      reader.readAsDataURL(file);
    }
  };

  // Perform canvas-based circular crop & conversion to active representation
  const performCropAndApply = async () => {
    if (!cropCanvasRef.current || !uploadedImageSrc) return;
    const canvas = cropCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = uploadedImageSrc;
    img.onload = async () => {
      // Hard set canvas resolution
      canvas.width = 250;
      canvas.height = 250;

      ctx.clearRect(0, 0, 250, 250);
      
      // Draw circular mask background
      ctx.save();
      ctx.beginPath();
      ctx.arc(125, 125, 120, 0, Math.PI * 2);
      ctx.clip();

      // Custom rendering math matching zoom & pan sliders
      const baseDim = Math.min(img.width, img.height);
      const cropSize = baseDim / cropZoom;
      const sX = (img.width - cropSize) / 2 - cropPanX;
      const sY = (img.height - cropSize) / 2 - cropPanY;

      ctx.drawImage(img, sX, sY, cropSize, cropSize, 0, 0, 250, 250);
      ctx.restore();

      // Draw shiny cybernetic frame highlight
      ctx.strokeStyle = "#F59E0B";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(125, 125, 121, 0, Math.PI * 2);
      ctx.stroke();

      const dataUrl = canvas.toDataURL("image/png");
      
      // Attempt uploading to supabase storage if firebase user is active and online
      setIsSaving(true);
      try {
        if (auth.currentUser) {
          // Convert dataURL to actual file
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          const fileToUpload = new File([blob], `cropped_avatar_${Date.now()}.png`, { type: "image/png" });
          
          const cloudUrl = await StorageService.uploadAvatar(fileToUpload, currentUser.uid, currentUser.role);
          setSelectedAvatarUrl(cloudUrl);
          setStatusMessage({ text: "Superbe ! Votre avatar personnalisé a été synchronisé sur Supabase Storage.", type: "success" });
        } else {
          // Fallback to offline avatar representation
          setSelectedAvatarUrl(dataUrl);
          setStatusMessage({ text: "Avatar sauvegardé localement en cache.", type: "success" });
        }
      } catch (err: any) {
        console.warn("Could not save to Supabase bucket, using local cache: ", err);
        setSelectedAvatarUrl(dataUrl);
        setStatusMessage({ text: "Avatar appliqué en local ! (Supabase hors ligne/simulation)", type: "success" });
      } finally {
        setIsSaving(false);
        setUploadedImageSrc(null);
        clearStatus();
      }
    };
  };

  // Save General Profile attributes
  const handleSaveProfileInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    const updatedProfile: UserProfile = {
      ...currentUser,
      displayName: displayName.trim() || currentUser.displayName,
      bio: bio.trim(),
      avatarUrl: selectedAvatarUrl,
      favoriteGenres: prefGenderList,
      updatedAt: new Date().toISOString()
    };

    try {
      await dbService.saveProfile(updatedProfile);
      onProfileUpdate(updatedProfile);
      setStatusMessage({ text: "Votre sceau de profil a été mis à jour avec brio !", type: "success" });
    } catch (err: any) {
      setStatusMessage({ text: `Erreur d'écriture : ${err.message}`, type: "error" });
    } finally {
      setIsSaving(false);
      clearStatus();
    }
  };

  // Update core authentication variables
  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSecuritySaving(true);
    setStatusMessage(null);

    try {
      const fUser = auth.currentUser;
      if (!fUser) {
        throw new Error("Authentification requise pour effectuer cette opération.");
      }

      // Update Email
      if (newEmail.trim() && newEmail.trim() !== currentUser.email) {
        await updateEmail(fUser, newEmail.trim());
        const updatedWithEmail: UserProfile = {
          ...currentUser,
          email: newEmail.trim(),
          updatedAt: new Date().toISOString()
        };
        await dbService.saveProfile(updatedWithEmail);
        onProfileUpdate(updatedWithEmail);
      }

      // Update Password
      if (newPassword.trim()) {
        if (newPassword !== confirmPassword) {
          throw new Error("Les deux mots de passe saisis ne correspondent pas.");
        }
        await updatePassword(fUser, newPassword.trim());
      }

      setStatusMessage({ text: "Sceau de sécurité et identifiants changés !", type: "success" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setStatusMessage({ text: `Ajustement réjeté : ${err.message}`, type: "error" });
    } finally {
      setIsSecuritySaving(false);
      clearStatus();
    }
  };

  // Perform full irreversible deletion
  const handleDeleteMyAccount = async () => {
    if (currentUser.role === "FOUNDER_OWNER") {
      setStatusMessage({ text: "Le compte souverain du FOUNDER_OWNER ne peut être supprimé.", type: "error" });
      clearStatus();
      return;
    }

    if (deleteInputText !== "SUPPRIMER") {
      setStatusMessage({ text: "Veuillez saisir exactement 'SUPPRIMER' pour valider l'action.", type: "error" });
      clearStatus();
      return;
    }

    setIsSaving(true);
    try {
      const fUser = auth.currentUser;
      
      // Delete cloud details profile representation
      // Make a dummy user list modification to save locally offline
      const profiles = await dbService.listProfiles();
      const updatedList = profiles.filter(p => p.uid !== currentUser.uid);
      localStorage.setItem("stilova_cache_users_profiles", JSON.stringify(updatedList));

      // Attempt Cloud Firebase user delete if signed in
      if (fUser) {
        await deleteUser(fUser);
      }

      onLogout();
    } catch (err: any) {
      setStatusMessage({ text: `Compte indisponible ou re-connexion exigée : ${err.message}`, type: "error" });
    } finally {
      setIsSaving(false);
      setShowConfirmDelete(false);
    }
  };

  const handleGenreToggle = (gKey: string) => {
    if (prefGenderList.includes(gKey)) {
      setPrefGenderList(prefGenderList.filter(g => g !== gKey));
    } else {
      setPrefGenderList([...prefGenderList, gKey]);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 animate-fade-in mb-16">
      
      {/* SIDE PROFILE NAVIGATION CONTROLS */}
      <div className="w-full lg:w-72 shrink-0 flex flex-col gap-6">
        
        {/* Short card user info outline */}
        <div className="bg-[#0F1117] border border-slate-800 p-6 rounded-3xl text-center flex flex-col items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600" />
          
          <div className="relative group mt-3">
            <img 
              src={currentUser.avatarUrl || selectedAvatarUrl} 
              alt={currentUser.displayName}
              className="w-20 h-20 rounded-full border-2 border-amber-500 bg-slate-950 object-cover"
            />
            <button 
              onClick={() => setActiveTab("profile_edit")}
              className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-1.5 rounded-full hover:scale-110 active:scale-95 transition shadow"
              title="Changer l'avatar"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col">
            <h4 className="font-sans font-bold text-slate-100 text-base">{currentUser.displayName}</h4>
            <span className="text-[10px] text-[#A3A3A3] font-mono mt-0.5 truncate max-w-[220px]">{currentUser.email}</span>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <span className="text-[9px] bg-amber-500/10 text-amber-500 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/20 font-mono tracking-wider">
                👑 {currentUser.role}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-sans italic leading-relaxed line-clamp-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-900 w-full">
            {currentUser.bio || "Pas encore de biographie gravée dans la cour royale."}
          </p>
        </div>

        {/* Vertical Profil Menu Links */}
        <div className="bg-[#0F1117] border border-slate-800 rounded-3xl p-3 flex flex-col gap-1">
          
          <button
            onClick={() => setActiveTab("profile_main")}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-3 transition ${
              activeTab === "profile_main"
                ? "bg-amber-500 text-black font-extrabold"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Mon profil</span>
          </button>

          <button
            onClick={() => setActiveTab("profile_edit")}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-3 transition ${
              activeTab === "profile_edit"
                ? "bg-amber-500 text-black font-extrabold"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Modifier le profil</span>
          </button>

          <button
            onClick={() => setActiveTab("profile_library")}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-3 transition ${
              activeTab === "profile_library"
                ? "bg-amber-500 text-black font-extrabold"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Bibliothèque locale</span>
          </button>

          <button
            onClick={() => setActiveTab("profile_history")}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-3 transition ${
              activeTab === "profile_history"
                ? "bg-amber-500 text-black font-extrabold"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Historique & Activité</span>
          </button>

          <button
            onClick={() => setActiveTab("profile_notifications")}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-3 transition ${
              activeTab === "profile_notifications"
                ? "bg-amber-500 text-black font-extrabold"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </button>

          <button
            onClick={() => setActiveTab("profile_preferences")}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-3 transition ${
              activeTab === "profile_preferences"
                ? "bg-amber-500 text-black font-extrabold"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Préférences de genres</span>
          </button>

          <button
            onClick={() => setActiveTab("profile_security")}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-3 transition ${
              activeTab === "profile_security"
                ? "bg-amber-500 text-black font-extrabold"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Sécurité & Compte</span>
          </button>

          <div className="border-t border-slate-800 my-2 pt-2">
            <button
              onClick={onLogout}
              className="w-full text-left px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-3 text-red-400 hover:bg-red-950/20 transition"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>

      </div>

      {/* CORE PROFILE CONTENT FORM AREA */}
      <div className="flex-1 bg-[#0F1117] border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl relative min-h-[550px]">
        
        {statusMessage && (
          <div className={`p-4 rounded-2xl text-xs mb-6 flex items-start gap-2.5 animate-fade-in ${
            statusMessage.type === "success" 
              ? "bg-emerald-950/30 border border-emerald-900/60 text-emerald-400"
              : "bg-red-950/30 border border-red-900/60 text-red-400"
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 1: VIEW PROFILE OVERVIEW                         */}
        {/* ==================================================== */}
        {activeTab === "profile_main" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="border-b border-slate-805 pb-3">
              <h3 className="text-base md:text-lg font-bold text-slate-100 font-sans">Mon Profil Stilova</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Voici votre sceau officiel scellé sur la plateforme.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/40 p-6 rounded-3xl border border-slate-900">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Nom d'écriture (Nom d'affichage)</span>
                <span className="text-sm font-sans font-extrabold text-[#E0E0E0]">{currentUser.displayName}</span>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Adresse e-mail de correspondance</span>
                <span className="text-sm font-sans font-extrabold text-slate-350">{currentUser.email}</span>
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Votre biographie royale</span>
                <p className="text-xs text-slate-300 font-serif italic leading-relaxed">
                  {currentUser.bio || "Aucun fait marquant n'a encore été rapporté dans vos annales."}
                </p>
              </div>
            </div>

            {/* Grid of stats */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Statistiques & Réputation</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl flex items-center gap-3.5">
                  <BookOpen className="w-8 h-8 text-amber-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Histoires téléchargées</span>
                    <span className="text-lg font-black text-slate-100 font-mono">{offlineSavedStories.length}</span>
                  </div>
                </div>

                <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl flex items-center gap-3.5">
                  <Star className="w-8 h-8 text-amber-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Favoris</span>
                    <span className="text-lg font-black text-slate-100 font-mono">
                      {stories.filter(s => s.rating >= 4.8).length || 2}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl flex items-center gap-3.5">
                  <Activity className="w-8 h-8 text-amber-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Points du conteur</span>
                    <span className="text-lg font-black text-slate-100 font-mono">140 XP</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Badge container info */}
            <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex items-start gap-3 mt-2">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-200">Statut de Légitimité</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Votre compte de rôle <strong className="text-slate-200">{currentUser.role}</strong> dispose de tous les accès et signatures nécessaires à la publication sur la blockchain d'or et d'encres Stilova.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: EDIT PROFILE AND CHOOSE/UPLOAD AVATAR         */}
        {/* ==================================================== */}
        {activeTab === "profile_edit" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="border-b border-slate-805 pb-3">
              <h3 className="text-base md:text-lg font-bold text-slate-100 font-sans">Ajuster mon identité</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Modifiez votre pseudo, rédigez votre biographie et concevez l'avatar idéal.</p>
            </div>

            {/* 1. Predefined Avatar and custom crop selection */}
            <div className="flex flex-col gap-4 bg-slate-950/30 border border-slate-850 p-5 rounded-2xl">
              <span className="text-xs font-bold text-slate-300 uppercase">Changer mon portrait d'auteur</span>
              
              {/* Presets Grid with Categories */}
              <div className="flex flex-col gap-3 mt-1">
                <span className="text-[10px] text-slate-400 font-sans font-bold uppercase tracking-wider">Avatars officiels Stilova</span>
                
                {/* Categories Tabs */}
                <div className="flex flex-wrap gap-1 border-b border-slate-900 pb-2">
                  {Object.entries(AVATAR_CATEGORIES).map(([key, cat]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveAvatarCategory(key as keyof typeof AVATAR_CATEGORIES)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        activeAvatarCategory === key
                          ? "bg-amber-500 text-slate-950"
                          : "text-slate-400 hover:text-white hover:bg-slate-900"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Selected Category Avatar Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-900/50">
                  {AVATAR_CATEGORIES[activeAvatarCategory].avatars.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setSelectedAvatarUrl(p.url)}
                      className={`relative rounded-xl overflow-hidden border p-2 cursor-pointer transition flex flex-col items-center gap-1.5 ${
                        selectedAvatarUrl === p.url 
                          ? "border-amber-500 bg-amber-500/10 scale-102" 
                          : "border-slate-850 bg-slate-900/40 hover:border-slate-750 hover:bg-slate-900/80"
                      }`}
                      title={p.name}
                    >
                      <img src={p.url} alt={p.name} className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800" />
                      <span className="text-[9px] text-slate-350 font-medium block truncate text-center w-full font-sans">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload dynamic cropper */}
              <div className="flex flex-col gap-2 mt-3 pt-4 border-t border-slate-900">
                <span className="text-[10px] text-slate-500">Ou bien téléversez une image personnalisée :</span>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-750 px-4 py-2.5 rounded-2xl text-xs text-slate-300 cursor-pointer transition flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4 text-amber-500" />
                    Choisir un fichier...
                  </button>

                  <span className="text-[10px] text-slate-500">JPG, JPEG, PNG ou WEBP. Max 5 Mo.</span>
                </div>

                {/* Cropping interactive console wrapper */}
                {uploadedImageSrc && (
                  <div className="bg-slate-950/80 p-5 rounded-2xl border border-amber-500/20 flex flex-col items-center gap-4 mt-3 max-w-lg mx-auto animate-fade-in w-full">
                    <span className="text-[10px] text-amber-500 tracking-wider font-bold uppercase">Consigne de recadrage</span>
                    
                    {/* Frame emulation wrapper */}
                    <div className="relative w-48 h-48 rounded-full overflow-hidden border-2 border-amber-500/80 bg-slate-900 flex items-center justify-center">
                      <img
                        src={uploadedImageSrc}
                        alt="Preview text"
                        style={{
                          transform: `scale(${cropZoom}) translate(${cropPanX}px, ${cropPanY}px)`,
                          transition: "transform 0.1s ease-out"
                        }}
                        className="max-w-none w-full h-full object-cover rounded-full"
                      />
                    </div>

                    {/* Crop adjustment inputs */}
                    <div className="w-full flex flex-col gap-2">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Zoom</span>
                        <span>{cropZoom.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="4"
                        step="0.1"
                        value={cropZoom}
                        onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                        className="w-full accent-amber-500 bg-slate-900 h-1.5 rounded-lg"
                      />
                    </div>

                    {/* Pan control pads */}
                    <div className="grid grid-cols-3 gap-1.5 w-max">
                      <div />
                      <button 
                        type="button" 
                        onClick={() => setCropPanY(cropPanY + 10)}
                        className="bg-slate-900 hover:bg-slate-800 p-2 text-xs text-slate-300 rounded border border-slate-800"
                      >
                        ▲
                      </button>
                      <div />

                      <button 
                        type="button" 
                        onClick={() => setCropPanX(cropPanX + 10)}
                        className="bg-slate-900 hover:bg-slate-800 p-2 text-xs text-slate-300 rounded border border-slate-800"
                      >
                        ◀
                      </button>
                      <div className="w-8 h-8 rounded border border-dashed border-slate-800 bg-slate-950" />
                      <button 
                        type="button" 
                        onClick={() => setCropPanX(cropPanX - 10)}
                        className="bg-slate-900 hover:bg-slate-800 p-2 text-xs text-slate-300 rounded border border-slate-800"
                      >
                        ▶
                      </button>

                      <div />
                      <button 
                        type="button" 
                        onClick={() => setCropPanY(cropPanY - 10)}
                        className="bg-slate-900 hover:bg-slate-800 p-2 text-xs text-slate-300 rounded border border-slate-800"
                      >
                        ▼
                      </button>
                      <div />
                    </div>

                    <div className="flex items-center gap-3 w-full mt-2">
                      <button
                        type="button"
                        onClick={() => setUploadedImageSrc(null)}
                        className="flex-1 bg-slate-900 hover:bg-slate-850 py-2.5 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition border border-slate-800"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={performCropAndApply}
                        className="flex-1 bg-amber-500 hover:bg-amber-400 py-2.5 rounded-xl text-xs text-slate-950 font-bold transition flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>Recadrer & Appliquer</span>
                      </button>
                    </div>

                    {/* Hidden canvas to write file on */}
                    <canvas ref={cropCanvasRef} className="hidden" />
                  </div>
                )}
              </div>
            </div>

            {/* 2. Text Input form */}
            <form onSubmit={handleSaveProfileInfo} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mon Pseudo d'Écrivain</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex: Reine d'Aného, Griot du Séné..."
                  className="bg-slate-950 border border-slate-800 px-4 py-3 rounded-2xl text-xs text-[#E0E0E0] outline-none focus:ring-1 focus:ring-amber-500 w-full"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ma Biographie</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Décrivez votre voyage littéraire, vos centres d'intérêt, etc..."
                  rows={4}
                  className="bg-slate-950 border border-slate-800 px-4 py-3 rounded-2xl text-xs text-[#E0E0E0] outline-none focus:ring-1 focus:ring-amber-500 w-full resize-none font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="bg-amber-550 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-2xl text-xs uppercase tracking-widest cursor-pointer transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <Save className="w-4 h-4 text-slate-950" />
                )}
                <span>Graver mes modifications</span>
              </button>
            </form>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: LOCAL LIBRARY PROGRESS LIST                    */}
        {/* ==================================================== */}
        {activeTab === "profile_library" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="border-b border-slate-805 pb-3">
              <h3 className="text-base md:text-lg font-bold text-slate-100 font-sans">Ma Bibliothèque Locale</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Retrouvez les manuscrits sauvegardés hors-ligne sur cet appareil.</p>
            </div>

            {offlineSavedStories.length === 0 ? (
              <div className="bg-slate-950/40 border border-dashed border-slate-850 p-12 rounded-3xl text-center flex flex-col items-center justify-center gap-3">
                <BookOpen className="w-12 h-12 text-slate-650" />
                <h5 className="font-sans font-bold text-slate-300 text-sm">Votre bibliothèque est vide</h5>
                <p className="text-xs text-slate-500 max-w-sm font-sans mx-auto leading-relaxed">
                  Lorsque vous lisez un récit interactif, cliquez sur le bouton "Télécharger pour lire hors-ligne" afin de l'enregistrer ici.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {offlineSavedStories.map((story) => (
                  <div
                    key={story.id}
                    onClick={() => onSelectStory(story.id)}
                    className="p-4 bg-slate-950/60 border border-slate-850 hover:border-amber-500/35 rounded-2xl flex gap-4 cursor-pointer transition transform hover:-translate-y-1"
                  >
                    <img 
                      src={story.coverUrl} 
                      alt={story.title}
                      className="w-14 h-20 object-cover rounded border border-slate-800"
                    />
                    <div className="flex flex-col justify-between flex-1 min-w-0">
                      <div className="flex flex-col">
                        <span className="text-[8px] text-amber-500 bg-slate-900 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold font-mono uppercase w-max">
                          {story.genre}
                        </span>
                        <h4 className="font-sans font-bold text-slate-200 text-xs sm:text-sm truncate mt-1">{story.title}</h4>
                        <span className="text-[10px] text-slate-450 font-serif italic">Par {story.authorName}</span>
                      </div>
                      <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1.5 mt-2">
                        <Check className="w-3 h-3 text-emerald-400" /> Disponible hors-ligne
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: RECENT ACTIVITY AND TIMELINE                 */}
        {/* ==================================================== */}
        {activeTab === "profile_history" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="border-b border-slate-805 pb-3">
              <h3 className="text-base md:text-lg font-bold text-slate-100 font-sans">Mon Historique d'Activité</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Chronologie des derniers événements de votre plume.</p>
            </div>

            <div className="flex flex-col gap-4">
              
              {/* Fake timeline items */}
              <div className="relative pl-6 border-l-2 border-slate-850 space-y-6">
                
                <div className="relative">
                  <span className="absolute -left-[31px] top-1 bg-amber-500 text-slate-950 p-1 rounded-full ring-4 ring-[#0F1117]">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-mono font-bold">AUJOURD'HUI</span>
                    <span className="text-xs font-bold text-slate-200">Enregistrement du pseudo d'écriture</span>
                    <p className="text-[11px] text-slate-450">Modification de votre nom d'affichage au sein du conseil d'administration.</p>
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute -left-[31px] top-1 bg-amber-500 text-slate-950 p-1 rounded-full ring-4 ring-[#0F1117]">
                    <Zap className="w-2.5 h-2.5" />
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-mono font-bold">HIER</span>
                    <span className="text-xs font-bold text-slate-200">Intronisation dans le cercle Stilova</span>
                    <p className="text-[11px] text-slate-450">Signature électronique du pacte des écrivains et première connexion.</p>
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute -left-[31px] top-1 bg-slate-800 text-slate-400 p-1 rounded-full ring-4 ring-[#0F1117]">
                    <BookOpen className="w-2.5 h-2.5" />
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-550 font-mono font-bold">IL Y A 2 JOURS</span>
                    <span className="text-xs font-bold text-slate-350">Ouverture de la bibliothèque</span>
                    <p className="text-[11px] text-slate-500 font-light">Explorations de la charte sacrée de publication.</p>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 5: PREFERENCES MANAGEMENT                         */}
        {/* ==================================================== */}
        {activeTab === "profile_preferences" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="border-b border-slate-805 pb-3">
              <h3 className="text-base md:text-lg font-bold text-slate-100 font-sans">Préférences de lecture</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Déterminez vos univers et styles de récits africains préférés.</p>
            </div>

            <div className="flex flex-col gap-4">
              <span className="text-xs font-bold text-slate-300 uppercase">Mes univers favoris</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: "afrofuturism", label: "🚀 Afrofuturisme", desc: "Science-fiction, technologies quantiques et cités volantes." },
                  { key: "mythology", label: "🔱 Mythologie", desc: "Divinités royales, pactes anciens et masques Yoruba." },
                  { key: "historical", label: "📜 Chronique d'Histoire", desc: "Épopées antiques des empires oubliés du Sahel." },
                  { key: "romance", label: "💖 Roman d'Amour", desc: "Sentiments profonds et poésie moderne panafricaine." },
                  { key: "drama", label: "🎭 Drame Social", desc: "Réalisme intense et turbulences sociétales d'aujourd'hui." }
                ].map((genre) => {
                  const isActive = prefGenderList.includes(genre.key);
                  return (
                    <button
                      key={genre.key}
                      onClick={() => handleGenreToggle(genre.key)}
                      className={`text-left p-4 rounded-2xl border transition ${
                        isActive 
                          ? "bg-amber-500/10 border-amber-500/60 text-slate-200"
                          : "bg-slate-950/40 border-slate-850 text-slate-400 hover:border-slate-800"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-200 text-xs">{genre.label}</span>
                        {isActive && <Check className="w-4 h-4 text-amber-500" />}
                      </div>
                      <p className="text-[10px] text-slate-450 mt-1.5 leading-relaxed">{genre.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Save Preferences */}
              <button
                onClick={handleSaveProfileInfo}
                disabled={isSaving}
                className="bg-amber-550 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-2xl text-xs uppercase tracking-widest cursor-pointer transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50 w-full"
              >
                <Save className="w-4 h-4 text-slate-950" />
                <span>Sauvegarder mes préférences</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 6: NOTIFICATIONS PREFERENCES                    */}
        {/* ==================================================== */}
        {activeTab === "profile_notifications" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="border-b border-slate-805 pb-3">
              <h3 className="text-base md:text-lg font-bold text-slate-100 font-sans">Canaux de notification</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Gérez la fréquence et la teneur de vos échanges administratifs.</p>
            </div>

            <div className="flex flex-col gap-4 bg-slate-950/40 p-5 rounded-2xl border border-slate-900">
              
              <div className="flex items-center justify-between p-3 border-b border-slate-900 pb-4">
                <div className="flex flex-col gap-0.5 max-w-[80%]">
                  <span className="text-xs font-bold text-slate-200">Alertes administratives & Défis</span>
                  <span className="text-[10px] text-slate-450 leading-relaxed">Soyez notifié du lancement des compétitions de la Plume d'Or en cours d'édition.</span>
                </div>
                <input
                  type="checkbox"
                  checked={prefNotificationEmails}
                  onChange={(e) => setPrefNotificationEmails(e.target.checked)}
                  className="w-4 h-4 accent-amber-550 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 border-b border-slate-900 pb-4">
                <div className="flex flex-col gap-0.5 max-w-[80%]">
                  <span className="text-xs font-bold text-slate-200">Synthèses littéraires du Griot Copilot</span>
                  <span className="text-[10px] text-slate-450 leading-relaxed">Rapports IA personnalisés de conseils et statistiques d'écriture, tous les lundis.</span>
                </div>
                <input
                  type="checkbox"
                  checked={prefWeeklyGriot}
                  onChange={(e) => setPrefWeeklyGriot(e.target.checked)}
                  className="w-4 h-4 accent-amber-550 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3">
                <div className="flex flex-col gap-0.5 max-w-[80%]">
                  <span className="text-xs font-bold text-slate-200">Suivi des manuscrits lus</span>
                  <span className="text-[10px] text-slate-450 leading-relaxed">Notification immédiate lorsqu'un auteur publie un nouveau chapitre en lecture direct.</span>
                </div>
                <input
                  type="checkbox"
                  checked={prefStoryUpdates}
                  onChange={(e) => setPrefStoryUpdates(e.target.checked)}
                  className="w-4 h-4 accent-amber-550 cursor-pointer"
                />
              </div>

            </div>

            <button
              onClick={() => {
                setStatusMessage({ text: "Préférences de notifications scellées avec succès !", type: "success" });
                clearStatus();
              }}
              className="bg-amber-550 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-2xl text-xs uppercase tracking-widest cursor-pointer transition flex items-center justify-center gap-2 mt-2 w-full"
            >
              <Save className="w-4 h-4 text-slate-950" />
              <span>Enregistrer mes canaux</span>
            </button>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 7: SECURITY AND FULL DELETION (DANGER ZONE)      */}
        {/* ==================================================== */}
        {activeTab === "profile_security" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="border-b border-slate-805 pb-3">
              <h3 className="text-base md:text-lg font-bold text-slate-100 font-sans">Sécurité & Identifiant</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Modifiez vos mots de passe ou engagez des actions de vie privée.</p>
            </div>

            {/* Change credentials form */}
            <form onSubmit={handleUpdateSecurity} className="flex flex-col gap-4 bg-slate-950/30 border border-slate-850 p-5 rounded-2xl">
              <span className="text-xs font-bold text-slate-300 uppercase">Modifier les informations de session</span>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Adresse e-mail active</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="bg-slate-950 border border-slate-850 pl-10 pr-4 py-3 rounded-2xl text-xs text-slate-205 outline-none focus:ring-1 focus:ring-amber-500 w-full"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 animate-fade-in">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Nouveau mot de passe</label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input
                      type={showPwd ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Laisser vide pour ne pas modifier"
                      className="bg-slate-950 border border-slate-850 pl-10 pr-4 py-3 rounded-2xl text-xs text-slate-205 outline-none focus:ring-1 focus:ring-amber-500 w-full"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 animate-fade-in">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Confirmer le mot de passe</label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input
                      type={showPwd ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Laisser vide"
                      className="bg-slate-950 border border-slate-850 pl-10 pr-4 py-3 rounded-2xl text-xs text-slate-205 outline-none focus:ring-1 focus:ring-amber-500 w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Show password toggle */}
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="text-[10px] text-slate-500 hover:text-slate-350 flex items-center gap-1.5 cursor-pointer w-max ml-1"
              >
                {showPwd ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
                <span>Révéler les caractères secrets</span>
              </button>

              <button
                type="submit"
                disabled={isSecuritySaving}
                className="bg-slate-900 border border-slate-750 hover:bg-slate-800 text-slate-300 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
              >
                {isSecuritySaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                )}
                <span>Mettre à jour mes clés</span>
              </button>
            </form>

            {/* DANGER ZONE : SUPPRESSION COMPTE */}
            <div className="border border-red-900/40 bg-red-950/15 p-5 rounded-2xl flex flex-col gap-4 mt-4">
              <span className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> Zone de danger critique (Confidentialité RGPD)
              </span>

              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                La suppression de compte est immédiate et irrévocable. Elle détruit définitivement votre profil, vos biographies ainsi que l'ensemble de vos manuscrits gravés.
              </p>

              {!showConfirmDelete ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-900/40 py-3 rounded-xl text-xs font-bold transition cursor-pointer text-center"
                >
                  Supprimer définitivement mon compte d'écrivain
                </button>
              ) : (
                <div className="flex flex-col gap-3 p-4 bg-slate-950 rounded-xl border border-red-900/30 animate-fade-in">
                  <span className="text-[10px] text-red-400 font-bold uppercase">
                    Êtes-vous absolument sûr ? Saisissez 'SUPPRIMER' ci-dessous pour confirmer :
                  </span>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={deleteInputText}
                      onChange={(e) => setDeleteInputText(e.target.value)}
                      placeholder="Saisir SUPPRIMER"
                      className="bg-slate-950 border border-red-900/60 px-4 py-2.5 rounded-xl text-xs text-[#E0E0E0] outline-none tracking-wider w-full placeholder-slate-700"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowConfirmDelete(false)}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-400 px-4 py-2.5 rounded-xl text-xs transition cursor-pointer whitespace-nowrap"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteMyAccount}
                        className="bg-red-650 hover:bg-red-550 text-slate-100 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap"
                      >
                        Valider la suppression
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
}

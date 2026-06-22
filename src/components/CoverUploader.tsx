import React, { useState, useRef } from "react";
import { Upload, Trash2, Image, FileImage, Sparkles, RefreshCw, Layers } from "lucide-react";
import { StorageService } from "../lib/storage";
import { UserRole } from "../types";
import { hasRuntimeConfig, supabaseUrl } from "../lib/supabase";

interface CoverUploaderProps {
  currentCoverUrl: string;
  onCoverChanged: (url: string) => void;
  userId: string;
  userRole: UserRole;
  storyId?: string; // Optional during creation
}

// Beautiful pre-selected African artworks for gallery choice
const COVER_GALLERY = [
  {
    name: "Cité Divine du Sahel",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Énergie Vibratoire d'Ifé",
    url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Masque Sacré Dogon",
    url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Reine des Sables d'Abomey",
    url: "https://images.unsplash.com/photo-1501472312651-726afd116ff1?auto=format&fit=crop&q=80&w=600"
  },
  {
    name: "Futurisme Panafricain",
    url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=600"
  }
];

export default function CoverUploader({ currentCoverUrl, onCoverChanged, userId, userRole, storyId }: CoverUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSupabaseActive = hasRuntimeConfig || (
    supabaseUrl && 
    !supabaseUrl.includes("placeholder-project") && 
    !supabaseUrl.includes("your-supabase")
  );

  // Parse configurable max upload size from local storage parameter, or fallback to 10
  const getMaxUploadSizeBytes = () => {
    try {
      const params = localStorage.getItem("stilova_sys_parameters");
      if (params) {
        const parsed = JSON.parse(params);
        if (parsed.maxUploadSize) return parsed.maxUploadSize * 1024 * 1024;
      }
    } catch (_) {}
    return 10 * 1024 * 1024; // Default 10MB
  };

  const handleFile = async (file: File) => {
    setError(null);
    setInfo(null);
    const validExtensions = ["jpg", "jpeg", "png", "webp"];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    
    if (!validExtensions.includes(ext)) {
      setError("Format incorrect. Formats autorisés : JPG, JPEG, PNG, WEBP.");
      return;
    }

    const maxSizeLimit = getMaxUploadSizeBytes();
    if (file.size > maxSizeLimit) {
      const currentMB = (maxSizeLimit / (1024 * 1024)).toFixed(1);
      setError(`Fichier trop lourd. Limite système de modération autorisée : ${currentMB} Mo.`);
      return;
    }

    setUploading(true);
    
    // First, read the file locally as a DataURL to have a guaranteed offline fallback
    const reader = new FileReader();
    reader.onload = async (e) => {
      const localDataUrl = e.target?.result as string;
      if (!localDataUrl) {
        setUploading(false);
        setError("Impossible de décoder localement l'image.");
        return;
      }

      try {
        console.log("[Stilova CoverUploader] Attempting to upload cover to Supabase Storage...");
        const activeStoryId = storyId || "draft_" + Date.now();
        const uploadedUrl = await StorageService.uploadStoryCover(file, activeStoryId, userId, userRole);
        onCoverChanged(uploadedUrl);
        setInfo("Image de couverture sauvegardée avec succès sur Supabase Storage !");
      } catch (err: any) {
        console.error("[Stilova CoverUploader] Supabase upload failed:", err);
        setError(`Échec de télétransmission Supabase : ${err?.message || String(err)}`);
      } finally {
        setUploading(false);
      }
    };

    reader.onerror = () => {
      setUploading(false);
      setError("Erreur lors de la lecture du fichier image local.");
    };

    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeCover = () => {
    onCoverChanged("");
    setError(null);
    setInfo(null);
  };

  return (
    <div className="flex flex-col gap-3.5 w-full text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Couverture de l'œuvre</span>
          {isSupabaseActive ? (
            <span className="inline-flex items-center gap-1.5 text-[8.5px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/15">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Supabase Stockage En-Ligne
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[8.5px] text-amber-500 font-mono font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/15">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Cache Local Uniquement
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowGallery(!showGallery)}
          className="text-[10px] text-amber-500 hover:text-amber-400 flex items-center gap-1 transition select-none"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{showGallery ? "Masquer la galerie" : "Choisir de la galerie"}</span>
        </button>
      </div>

      {showGallery && (
        <div className="bg-[#0B0D13] border border-slate-850 p-4 rounded-2xl grid grid-cols-2 sm:grid-cols-5 gap-3.5 animate-fade-in">
          {COVER_GALLERY.map((item, index) => (
            <div
              key={index}
              onClick={() => {
                onCoverChanged(item.url);
                setShowGallery(false);
              }}
              className="group cursor-pointer flex flex-col gap-1.5 focus:outline-none"
            >
              <div className="relative rounded-xl overflow-hidden aspect-[3/4] border border-slate-800 group-hover:border-amber-500/50 transition">
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-center">
                  <span className="text-[8.5px] text-slate-300 font-bold leading-none truncate block">Sélectionner</span>
                </div>
              </div>
              <span className="text-[9px] text-slate-500 truncate block text-center">{item.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Drag-Drop-Or-Preview Box container */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative border rounded-2xl p-6 flex flex-col items-center justify-center text-center transition min-h-[170px] ${
          isDragOver 
            ? "border-amber-500 bg-amber-500/5" 
            : currentCoverUrl 
              ? "border-slate-800 bg-[#0F1117]/40" 
              : "border-dashed border-slate-800 bg-slate-950/20 hover:border-slate-700 hover:bg-slate-950/30"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-4 animate-pulse">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
            <span className="text-xs text-slate-350 font-bold">Impression de l'image de couverture sur Supabase...</span>
          </div>
        ) : currentCoverUrl ? (
          // Immediate Preview View
          <div className="flex flex-col sm:flex-row items-center gap-5 w-full">
            <div className="relative rounded-xl overflow-hidden border border-slate-800 aspect-[3/4] w-24 shadow-md shrink-0">
              <img
                src={currentCoverUrl}
                alt="Story Cover Preview"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex flex-col text-left justify-between h-full gap-2 w-full">
              <div>
                <span className="text-[9px] text-[#A3A3A3] font-mono flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-500" /> COUVERTURE SÉLECTIONNÉE
                </span>
                <h5 className="font-sans font-extrabold text-slate-200 text-xs mt-1 truncate">Image prête pour la gravure</h5>
                <p className="text-[10px] text-slate-550 leading-relaxed max-w-xs mt-0.5">Le visuel est validé et prêt à être lié aux fiches de lectures de la platefome.</p>
              </div>

              <div className="flex items-center gap-2.5 mt-1">
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-[10.5px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
                >
                  Remplacer
                </button>
                <button
                  type="button"
                  onClick={removeCover}
                  className="bg-red-950/20 hover:bg-red-950/50 text-red-400 border border-red-900/30 text-[10.5px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Supprimer
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Drag-Drop instruction placeholder
          <div className="flex flex-col items-center justify-center gap-2 py-4 cursor-pointer select-none" onClick={triggerFileInput}>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <Upload className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-200">Glissez-déposez le fichier ici</span>
              <span className="text-slate-500 text-[10px] block mt-0.5">Fichiers autorisés : .jpg, .jpeg, .png, .webp (max 10Mo)</span>
              <span className="text-amber-500 text-[10.5px] font-semibold underline block mt-2">Parcourir sur votre ordinateur</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <span className="border border-red-500/20 bg-red-500/5 text-red-400 text-[10.5px] px-3.5 py-2.5 rounded-xl block font-mono">
          ⚠ {error}
        </span>
      )}

      {info && (
        <span className="border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[10.5px] px-3.5 py-2.5 rounded-xl block font-mono">
          ✓ {info}
        </span>
      )}
    </div>
  );
}

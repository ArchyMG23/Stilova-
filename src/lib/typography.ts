export interface FontOption {
  id: string;
  name: string;
  cssValue: string;
}

export interface FontCategory {
  title: string;
  fonts: FontOption[];
}

export const TITLE_FONTS: FontCategory[] = [
  {
    title: "Classiques",
    fonts: [
      { id: "Cormorant Garamond", name: "Cormorant Garamond", cssValue: "'Cormorant Garamond', Georgia, serif" },
      { id: "Playfair Display", name: "Playfair Display", cssValue: "'Playfair Display', Georgia, serif" },
      { id: "Libre Baskerville", name: "Libre Baskerville", cssValue: "'Libre Baskerville', Georgia, serif" },
      { id: "EB Garamond", name: "EB Garamond", cssValue: "'EB Garamond', Georgia, serif" }
    ]
  },
  {
    title: "Modernes",
    fonts: [
      { id: "Montserrat", name: "Montserrat", cssValue: "'Montserrat', sans-serif" },
      { id: "Poppins", name: "Poppins", cssValue: "'Poppins', sans-serif" },
      { id: "Lora", name: "Lora", cssValue: "'Lora', serif" },
      { id: "Merriweather", name: "Merriweather", cssValue: "'Merriweather', serif" }
    ]
  },
  {
    title: "Fantaisie",
    fonts: [
      { id: "Cinzel", name: "Cinzel", cssValue: "'Cinzel', serif" },
      { id: "Marcellus", name: "Marcellus", cssValue: "'Marcellus', serif" },
      { id: "UnifrakturCook", name: "UnifrakturCook", cssValue: "'UnifrakturCook', serif" },
      { id: "Alegreya SC", name: "Alegreya SC", cssValue: "'Alegreya SC', serif" }
    ]
  },
  {
    title: "Manuscrites",
    fonts: [
      { id: "Dancing Script", name: "Dancing Script", cssValue: "'Dancing Script', cursive" },
      { id: "Great Vibes", name: "Great Vibes", cssValue: "'Great Vibes', cursive" },
      { id: "Parisienne", name: "Parisienne", cssValue: "'Parisienne', cursive" },
      { id: "Allura", name: "Allura", cssValue: "'Allura', cursive" }
    ]
  }
];

export const SIGNATURE_FONTS: FontCategory[] = [
  {
    title: "Manuscrites & Fantaisie",
    fonts: [
      { id: "Dancing Script", name: "Dancing Script", cssValue: "'Dancing Script', cursive" },
      { id: "Great Vibes", name: "Great Vibes", cssValue: "'Great Vibes', cursive" },
      { id: "Parisienne", name: "Parisienne", cssValue: "'Parisienne', cursive" },
      { id: "Allura", name: "Allura", cssValue: "'Allura', cursive" },
      { id: "Cinzel", name: "Cinzel", cssValue: "'Cinzel', serif" }
    ]
  },
  {
    title: "Classiques & Nobles",
    fonts: [
      { id: "Cormorant Garamond", name: "Cormorant Garamond", cssValue: "'Cormorant Garamond', serif" },
      { id: "Playfair Display", name: "Playfair Display", cssValue: "'Playfair Display', serif" },
      { id: "EB Garamond", name: "EB Garamond", cssValue: "'EB Garamond', serif" },
      { id: "Lora", name: "Lora", cssValue: "'Lora', serif" }
    ]
  },
  {
    title: "Modernes & Minimalistes",
    fonts: [
      { id: "Montserrat", name: "Montserrat", cssValue: "'Montserrat', sans-serif" },
      { id: "Poppins", name: "Poppins", cssValue: "'Poppins', sans-serif" }
    ]
  }
];

export const STILOVA_COLORS = [
  { id: "amber-500", name: "Ambre impérial", value: "#D97706", class: "text-amber-500", bgClass: "bg-amber-500", borderClass: "border-amber-500" },
  { id: "amber-400", name: "Or solaire", value: "#F59E0B", class: "text-amber-400", bgClass: "bg-amber-400", borderClass: "border-amber-400" },
  { id: "white", name: "Blanc pur", value: "#FFFFFF", class: "text-white", bgClass: "bg-white", borderClass: "border-white" },
  { id: "slate-100", name: "Gris ivoire", value: "#E0E0E0", class: "text-slate-100", bgClass: "bg-slate-100", borderClass: "border-slate-100" },
  { id: "slate-300", name: "Cendre d'argent", value: "#D1D5DB", class: "text-slate-300", bgClass: "bg-slate-300", borderClass: "border-slate-300" },
  { id: "indigo-400", name: "Indigo sauvage", value: "#818CF8", class: "text-indigo-400", bgClass: "bg-indigo-400", borderClass: "border-indigo-400" },
  { id: "rose-400", name: "Rose mystique", value: "#F43F5E", class: "text-rose-400", bgClass: "bg-rose-400", borderClass: "border-rose-400" },
  { id: "emerald-400", name: "Émeraude sacrée", value: "#34D399", class: "text-emerald-400", bgClass: "bg-emerald-400", borderClass: "border-emerald-400" }
];

export const SIGNATURE_ALIGNMENTS = [
  { id: "left", name: "Gauche", class: "text-left justify-start" },
  { id: "center", name: "Centré", class: "text-center justify-center" },
  { id: "right", name: "Droite", class: "text-right justify-end" }
];

export const SIGNATURE_SIZE_OPTIONS = [
  { id: "sm", name: "Petite", class: "text-xs" },
  { id: "md", name: "Moyenne", class: "text-sm sm:text-base" },
  { id: "lg", name: "Grande", class: "text-lg sm:text-xl" }
];

export const SIGNATURE_ICONS = [
  { id: "none", name: "Aucune", value: "" },
  { id: "quill", name: "✒️ Plume", value: "✒️" },
  { id: "star", name: "✨ Étoile", value: "✨" },
  { id: "heart", name: "💖 Coeur", value: "💖" },
  { id: "book", name: "📖 Livre", value: "📖" },
  { id: "crown", name: "👑 Couronne", value: "👑" },
  { id: "sun", name: "☀️ Soleil", value: "☀️" },
  { id: "moon", name: "🌙 Lune", value: "🌙" }
];

export function getFontCssValue(fontId: string | undefined, defaultCss = "inherit"): string {
  if (!fontId) return defaultCss;
  
  // Search in both Title and Signature fonts
  for (const cat of TITLE_FONTS) {
    const found = cat.fonts.find(f => f.id === fontId);
    if (found) return found.cssValue;
  }
  for (const cat of SIGNATURE_FONTS) {
    const found = cat.fonts.find(f => f.id === fontId);
    if (found) return found.cssValue;
  }
  
  return defaultCss;
}

export function getColorHex(colorId: string | undefined): string {
  if (!colorId) return "#D97706"; // Default amber-500
  const color = STILOVA_COLORS.find(c => c.id === colorId);
  return color ? color.value : "#D97706";
}

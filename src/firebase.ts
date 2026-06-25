import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { 
  initializeFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where,
  getDocFromServer,
  updateDoc,
  deleteDoc,
  addDoc
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import { Story, StoryNode, Competition, Submission, UserProfile, UserRole, AuditLog, Notification } from "./types";
import { supabase, runSupabaseAudit } from "./lib/supabase";

// Resolve dynamic config overrides or use default bundle configuration
const metaEnv = (import.meta as any).env || {};
const activeFirebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  firestoreDatabaseId: metaEnv.VITE_FIREBASE_FIRESTORE_DB_ID || firebaseConfig.firestoreDatabaseId || undefined,
};

// Initialize Firebase SDK
const app = initializeApp(activeFirebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, activeFirebaseConfig.firestoreDatabaseId || undefined);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Operational metrics enumeration
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

// Mandatory custom error logger/manager
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  };
  console.error('[Stilova Firestore Warning]: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface HealthCheckResult {
  firebaseConnected: boolean;
  firebaseError: string | null;
  authConnected: boolean;
  authError: string | null;
  firestoreConnected: boolean;
  firestoreError: string | null;
  supabaseConnected: boolean;
  supabaseError: string | null;
  supabaseTestUploadPassed: boolean;
  supabaseTestUploadError: string | null;
  supabaseTestPublicUrl: string | null;
  buckets: {
    avatars: boolean;
    covers: boolean;
    illustrations: boolean;
    chapters: boolean;
    contests: boolean;
    "system-assets": boolean;
  };
  bucketErrors: Record<string, string | null>;
  vars: {
    VITE_SUPABASE_URL: boolean;
    VITE_SUPABASE_ANON_KEY: boolean;
    VITE_FIREBASE_PROJECT_ID: boolean;
    VITE_FIREBASE_API_KEY: boolean;
    VITE_FIREBASE_AUTH_DOMAIN: boolean;
    VITE_FIREBASE_APP_ID: boolean;
  };
}

// Test Connection on startup with extensive health-checks
export async function runInfrastructureHealthCheck(): Promise<HealthCheckResult> {
  const result: HealthCheckResult = {
    firebaseConnected: false,
    firebaseError: null,
    authConnected: false,
    authError: null,
    firestoreConnected: false,
    firestoreError: null,
    supabaseConnected: false,
    supabaseError: null,
    supabaseTestUploadPassed: false,
    supabaseTestUploadError: null,
    supabaseTestPublicUrl: null,
    buckets: {
      avatars: false,
      covers: false,
      illustrations: false,
      chapters: false,
      contests: false,
      "system-assets": false,
    },
    bucketErrors: {},
    vars: {
      VITE_SUPABASE_URL: !!metaEnv.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: !!metaEnv.VITE_SUPABASE_ANON_KEY,
      VITE_FIREBASE_PROJECT_ID: !!metaEnv.VITE_FIREBASE_PROJECT_ID,
      VITE_FIREBASE_API_KEY: !!metaEnv.VITE_FIREBASE_API_KEY,
      VITE_FIREBASE_AUTH_DOMAIN: !!metaEnv.VITE_FIREBASE_AUTH_DOMAIN,
      VITE_FIREBASE_APP_ID: !!metaEnv.VITE_FIREBASE_APP_ID,
    }
  };

  // 1. Firebase Connected Check
  try {
    if (app) {
      result.firebaseConnected = true;
    } else {
      result.firebaseError = "Firebase App instance is missing.";
    }
  } catch (err: any) {
    result.firebaseError = err?.message || String(err);
  }

  // 2. Auth Service Connected Check
  try {
    if (auth) {
      result.authConnected = true;
    } else {
      result.authError = "Auth Service is missing.";
    }
  } catch (err: any) {
    result.authError = err?.message || String(err);
  }

  // 3. Firestore Connection Check (Bypassed - Stilova has successfully migrated to Supabase & Local DB)
  result.firestoreConnected = false;
  result.firestoreError = "Bypassé (Stilova utilise désormais Supabase et le stockage local de secours)";

  // 4. Supabase Connected Check & specific buckets check
  try {
    const auditReport = await runSupabaseAudit();
    
    result.supabaseConnected = auditReport.connectionSuccess;
    result.supabaseError = auditReport.connectionError;
    
    // Copy check statuses for all 6 buckets
    result.buckets = {
      avatars: auditReport.bucketsStatus["avatars"],
      covers: auditReport.bucketsStatus["covers"],
      illustrations: auditReport.bucketsStatus["illustrations"],
      chapters: auditReport.bucketsStatus["chapters"],
      contests: auditReport.bucketsStatus["contests"],
      "system-assets": auditReport.bucketsStatus["system-assets"]
    };

    // If bucket was missing, report remapping status or its warning
    const expected = ["covers", "avatars", "illustrations", "chapters", "contests", "system-assets"];
    expected.forEach(b => {
      if (!auditReport.bucketsStatus[b]) {
        if (auditReport.remappedBuckets[b]) {
          result.bucketErrors[b] = `ABSENT (Mappé sur "${auditReport.remappedBuckets[b]}")`;
        } else {
          result.bucketErrors[b] = "ABSENT (Aucun fallback possible)";
        }
      } else {
        result.bucketErrors[b] = null;
      }
    });

    // Active diagnostic test: Connexion -> Vérification covers -> Upload ficher test -> Génération URL publique
    if (auditReport.connectionSuccess) {
      try {
        const probePayload = "Stilova sovereign infrastructure verification probe run on " + new Date().toISOString();
        const probeBlob = new Blob([probePayload], { type: "text/plain" });
        const probeFile = new File([probeBlob], "integrity_probe_test.txt", { type: "text/plain" });
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("covers")
          .upload("probes/integrity_probe_test.txt", probeFile, {
            cacheControl: "0",
            upsert: true
          });

        if (uploadError) {
          result.supabaseTestUploadPassed = false;
          result.supabaseTestUploadError = uploadError.message;
        } else {
          result.supabaseTestUploadPassed = true;
          const { data: pubData } = supabase.storage
            .from("covers")
            .getPublicUrl("probes/integrity_probe_test.txt");
          result.supabaseTestPublicUrl = pubData?.publicUrl || "Aucune URL générée";
        }
      } catch (testErr: any) {
        result.supabaseTestUploadPassed = false;
        result.supabaseTestUploadError = testErr?.message || String(testErr);
      }
    } else {
      result.supabaseTestUploadPassed = false;
      result.supabaseTestUploadError = "Connexion impossible avec Supabase";
    }
  } catch (auditErr: any) {
    result.supabaseConnected = false;
    result.supabaseError = auditErr?.message || String(auditErr);
  }

  return result;
}

// ----------------------------------------------------
// LOCAL FALLBACK DATA (For Offline/Seeding)
// ----------------------------------------------------
const SEED_STORIES: Story[] = [
  {
    id: "story_afrofuturism_dakar",
    title: "Les Sentinelles de Goree-2099",
    description: "Dans un Dakar flottant propulsé à l'énergie solaire, une jeune hackeuse découvre une relique ancienne codée en alphabet nko, capable de réajuster le flux énergétique de l'océan Atlantique. Une quête palpitante à travers le néo-Sénégal.",
    coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600",
    genre: "afrofuturism",
    authorId: "admin_seed_griot",
    authorName: "Abdoulaye Diallo",
    isPublished: true,
    isInteractive: true,
    rating: 4.9,
    viewsCount: 1420,
    reported: false,
    isFeatured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "story_mythology_orishas",
    title: "Le Stylet Sacré d'Ifé",
    description: "LIVRE INTERACTIF : Incarnez Kemi, un jeune scribe apprenti d'Ifé. Lorsque le masque d'ivoire du Roi s'enflamme d'un feu noir spectral, vous êtes appelé à traverser le royaume des esprits Yoruba pour apaiser Shango.",
    coverUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=600",
    genre: "mythology",
    authorId: "admin_seed_griot",
    authorName: "Kemi Adebayo",
    isPublished: true,
    isInteractive: true,
    rating: 4.8,
    viewsCount: 890,
    reported: false,
    isFeatured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "story_historical_mali",
    title: "L'Or noir de Tombouctou",
    description: "1324. Dans l'entourage faste de l'empereur Mansa Moussa en route vers la Mecque, une espionne mandingue tente d'arrêter une conspiration visant à saboter les manuscrits d'astronomie royaux de la bibliothèque de Tombouctou.",
    coverUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=600",
    genre: "historical",
    authorId: "admin_seed_griot",
    authorName: "Mansa Folki",
    isPublished: true,
    isInteractive: false,
    rating: 4.7,
    viewsCount: 610,
    reported: false,
    isFeatured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const SEED_NODES: Record<string, StoryNode[]> = {
  "story_afrofuturism_dakar": [
    {
      id: "node_dakar_root",
      storyId: "story_afrofuturism_dakar",
      title: "Chapitre 1 : Le Réveil du Réseau",
      content: "La verrière holographique du dôme de Pikine brillait d'un rose néon tamisé. Sous mes pieds, les vagues de l'Atlantique ronronnaient contre les stabilisateurs hydro-électriques de la cité flottante Dakar-2099.\n\nJe m'appelle Aminata. Mes doigts effleurent le stylet plasmatique Stilova de ma grand-mère. C'est alors qu'un signal inhabituel pénètre ma console neurale. Un paquet crypté provenant des fonds abyssaux de l'ancienne île de Gorée.",
      isRoot: true,
      choices: [
        { text: "Décoder immédiatement le signal abyssal", nextNodeId: "node_dakar_decode" },
        { text: "Ignorer et lancer les diagnostics énergétiques de Pikine", nextNodeId: "node_dakar_ignore" }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "node_dakar_decode",
      storyId: "story_afrofuturism_dakar",
      title: "Le Plan Ancestral",
      content: "Le décodeur affiche des lignes de poésie wolof entrelacées de coordonnées quantiques. 'La vraie liberté n'est pas hors de l'eau, mais dans le chant des profondeurs.'\n\nSoudain, l'intelligence artificielle centrale de la marine d'élite s'allume. Des éclaireurs drones convergent vers mon atelier secret de Pikine. Je n'ai que quelques secondes !",
      isRoot: false,
      choices: [
        { text: "S'enfuir par les conduits de décharge d'eau", nextNodeId: "node_dakar_escape" },
        { text: "Faire face aux drones en brandissant la signature d'activation", nextNodeId: "node_dakar_confront" }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "node_dakar_ignore",
      storyId: "story_afrofuturism_dakar",
      title: "La Cité Obscure",
      content: "Je décide d'étouffer le SOS. Le réseau de Pikine flanche. Les lumières s'éteignent les unes après les autres. Le grand blackout d'Afrique de l'Ouest commence. Dans le noir complet, des ombres munies d'implants oculaires rouges escaladent ma fenêtre...",
      isRoot: false,
      choices: [
        { text: "Retourner décoder le signal en urgence", nextNodeId: "node_dakar_decode" }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "node_dakar_escape",
      storyId: "story_afrofuturism_dakar",
      title: "Les Profondeurs d'Indigo",
      content: "Je glisse dans l'eau tiède de l'océan Atlantique. Mon respirateur branchial s'active instantanément. Devant moi, un sous-marin traditionnel sculpté en bois composite m'attend. À son bord, les résistants du Stylet d'Or saluent le courage d'Aminata.\n\nFélicitations, vous avez survécu au premier embranchement d'introduction afrofuturiste !",
      isRoot: false,
      choices: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "node_dakar_confront",
      storyId: "story_afrofuturism_dakar",
      title: "L'Arrestation",
      content: "Les drones pacifient l'atelier. Un homme aux vêtements amples, tissés de micro-capteurs, s'avance. C'est le Ministre de l'Ordre Lumineux. 'Votre plume virtuelle est trop puissante pour être laissée libre, Aminata.'\n\nVous êtes captive. Mais l'histoire ne s'arrête jamais...",
      isRoot: false,
      choices: [
        { text: "Tenter d'utiliser la décharge plasmatique du stylet", nextNodeId: "node_dakar_escape" }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  "story_mythology_orishas": [
    {
      id: "node_orisha_root",
      storyId: "story_mythology_orishas",
      title: "Chapitre 1 : L'Onyx Enflammé",
      content: "L'air d'Ifé était saturé de poussière de latérite et d'encens de karité. Devant la cour d'argile rouge sculptée, la rumeur grandissait : la foudre sacrée avait frappé l'arbre des ancêtres sans un bruit de tonnerre.\n\nJe me tiens debout, retenant mon souffle. Mon chapelet en perles s'agite. Deux chemins s'ouvrent devant moi pour consulter le vieux prêtre d'Ifa.",
      isRoot: true,
      choices: [
        { text: "Offrir le coq en bronze au sanctuaire du Nord", nextNodeId: "node_orisha_north" },
        { text: "Se faufiler directement vers la salle d'initiation interdite", nextNodeId: "node_orisha_secret" }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "node_orisha_north",
      storyId: "story_mythology_orishas",
      title: "La Bénédiction de Shango",
      content: "Le prêtre sourit à la vue du bronze étincelant. Ses yeux se révulsent, révélant la lueur des éclairs bleus. 'Shango t'attend au-delà des dunes brûlantes.' Le voyage spirituel commence sous de superbes auspices.",
      isRoot: false,
      choices: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "node_orisha_secret",
      storyId: "story_mythology_orishas",
      title: "L'Iré des Ancêtres irrités",
      content: "Un pas de trop... Des serpents sculptés sur les pylônes de bois d'iroko semblent s'animer. Une voix gronde dans les airs : 'Qui ose souiller le sol secret ?' Vous devez présenter une défense poétique.",
      isRoot: false,
      choices: [
        { text: "S'excuser humblement et offrir le bronze d'Ifé", nextNodeId: "node_orisha_north" }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  "story_historical_mali": [
    {
      id: "node_mali_root",
      storyId: "story_historical_mali",
      title: "Chapitre Unique d'étude",
      content: "Le cortège de Mansa Moussa s'étire sur des kilomètres sous l'horizon doré du Sahel. Soixantedix mille hommes cheminent en harmonie, transportant des tonnes d'or pur. Dans la tente des archives secrètes, je découvre qu'une fiole de poison a été glissée dans l'encrier de scribe officiel...",
      isRoot: true,
      choices: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
};

const SEED_COMPETITIONS: Competition[] = [
  {
    id: "comp_afrofuturism_2026",
    title: "Plumes du Futur - Afrofuturisme 2026",
    description: "Écrivez une nouvelle interactive captivante situant l'Afrique à l'horizon 2100+. Vos personnages devront manier la plume virtuelle Stilova pour concevoir leur univers. Premier prix : un stylet physique de collection et 5 000 000 FCFA.",
    theme: "Afrofuturisme technologique et légendes du fleuve",
    deadline: "2026-08-15T23:59:00Z",
    prizeAmount: "5,000,000 FCFA ($10,000)",
    submissionsCount: 1,
    isOpen: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "comp_myth_legacy",
    title: "Génie des Masques sacrés",
    description: "Revisitez les mythologies africaines (Kemet, Yoruba, Zulu, Dogon) sous l'angle de la fiction interactive. Le lecteur doit vivre l'initiation d'un gardien de temple ancestral.",
    theme: "Contes mythologiques immersifs",
    deadline: "2026-07-20T23:59:00Z",
    prizeAmount: "2,000,000 FCFA",
    submissionsCount: 0,
    isOpen: true,
    createdAt: new Date().toISOString()
  }
];

// Offline Local Database cache
const getLocal = <T>(key: string, def: T): T => {
  try {
    const v = localStorage.getItem(`stilova_cache_${key}`);
    return v ? JSON.parse(v) : def;
  } catch (e) {
    console.warn(`[Stilova Local Engine] Error parsing local storage key: stilova_cache_${key}`, e);
    return def;
  }
};

const setLocal = <T>(key: string, val: T): T => {
  try {
    localStorage.setItem(`stilova_cache_${key}`, JSON.stringify(val));
  } catch (e) {
    console.warn(`[Stilova Local Engine] Error writing local storage key: stilova_cache_${key}`, e);
  }
  return val;
};

// Initialize seed data inside local storage on boot
export function bootstrapLocalData() {
  try {
    if (!localStorage.getItem("stilova_cache_stories")) {
      setLocal("stories", SEED_STORIES);
    }
    if (!localStorage.getItem("stilova_cache_competitions")) {
      setLocal("competitions", SEED_COMPETITIONS);
    }
    if (!localStorage.getItem("stilova_cache_nodes")) {
      setLocal("nodes", SEED_NODES);
    }
    if (!localStorage.getItem("stilova_cache_submissions")) {
      setLocal("submissions", [
        {
          id: "sub_afro_dakar",
          competitionId: "comp_afrofuturism_2026",
          storyId: "story_afrofuturism_dakar",
          storyTitle: "Les Sentinelles de Goree-2099",
          authorId: "admin_seed_griot",
          authorName: "Abdoulaye Diallo",
          votesCount: 42,
          status: "approved",
          createdAt: new Date().toISOString()
        }
      ]);
    }
    if (!localStorage.getItem("stilova_cache_votes")) {
      setLocal("votes", []);
    }
    console.log("[Stilova Local Engine] Offline-First repositories bootstrapped.");
  } catch (err) {
    console.warn("[Stilova Local Engine] Failure during offline bootstrapping:", err);
  }
}

// ----------------------------------------------------
// DB SEED FOR DEPLOYED FIRESTORE INSTANCE (Bypassed & redirected to Supabase)
// ----------------------------------------------------
export async function seedCloudFirestore() {
  console.log("[Stilova DB Seeder] Bypassing Firestore seeding. Supabase and LocalStorage are the active database engines.");
  try {
    const { data, error } = await supabase.from("stories").select("id").limit(1);
    if (!error && (!data || data.length === 0)) {
      console.log("[Stilova Supabase Seeder] Supabase stories table is empty/unpopulated. Initializing seed records...");
      for (const story of SEED_STORIES) {
        await supabase.from("stories").upsert(story);
        const nodes = SEED_NODES[story.id] || [];
        for (const node of nodes) {
          await supabase.from("story_nodes").upsert(node);
        }
      }
      for (const comp of SEED_COMPETITIONS) {
        await supabase.from("competitions").upsert(comp);
      }
      console.log("[Stilova Supabase Seeder] Supabase seed records successfully synchronized.");
    }
  } catch (err) {
    console.warn("[Stilova Supabase Seeder] Supabase not fully initialized. Defaulting fully to offline local storage fallback.");
  }
}

// ----------------------------------------------------
// AUTOMATIC FIRESTORE COLLECTIONS & SYSTEMS BOOTSTRAPPER (Redirected to Supabase/Local)
// ----------------------------------------------------
export async function bootstrapFirestore() {
  console.log("%c[Stilova DB Transition] Bypassing Firestore and initializing Supabase & Local Database...", "color: #10b981; font-weight: bold;");
  
  const report = {
    firebaseConnected: true,
    permissionsStatus: "Bypassé (Désactivé au profit de Supabase)",
    collectionsChecked: ["Utilisation de Supabase & Stockage Local de secours actif"] as string[],
    systemDocumentsCreated: [] as string[],
    errors: [] as string[],
    timestamp: new Date().toISOString()
  };

  // Ensure local data is bootstrapped
  try {
    bootstrapLocalData();
  } catch (e: any) {
    report.errors.push(`Local storage bootstrap: ${e.message}`);
  }

  // Validate Supabase connection
  try {
    const audit = await runSupabaseAudit();
    if (audit.connectionSuccess) {
      console.log("[Stilova Bootstrap] ✓ Supabase Database is successfully connected and live.");
    } else {
      console.warn("[Stilova Bootstrap] Supabase disconnected or unconfigured. Stilova is operating in stable LocalStorage mode.");
    }
  } catch (e: any) {
    console.warn("[Stilova Bootstrap] Supabase connection check warning:", e);
  }

  return report;
}

// ----------------------------------------------------
// GLOBAL DATA ACCESS API (Saves to Supabase & caches Local)
// ----------------------------------------------------

// In-Memory cache dictionary for high-performance instant access
const memoryCache: {
  stories: Story[] | null;
  profiles: UserProfile[] | null;
  competitions: Competition[] | null;
  auditLogs: AuditLog[] | null;
  nodes: Record<string, StoryNode[]>;
  submissions: Record<string, Submission[]>;
  profileMap: Record<string, UserProfile>;
} = {
  stories: null,
  profiles: null,
  competitions: null,
  auditLogs: null,
  nodes: {},
  submissions: {},
  profileMap: {},
};

// Robust Helper to execute Supabase Queries with fail-safe LocalStorage fallbacks
async function safeSupabaseQuery<T>(
  queryPromise: any,
  localKey: string,
  defaultValue: T,
  filterFn?: (items: T) => T
): Promise<T> {
  try {
    const { data, error } = await queryPromise;
    if (error) {
      console.warn(`[Supabase DB Warning] Query failed, falling back to LocalStorage for "${localKey}":`, error.message);
      const local = getLocal<T>(localKey, defaultValue);
      return filterFn ? filterFn(local) : local;
    }
    if (data !== null) {
      setLocal(localKey, data);
      return filterFn ? filterFn(data) : data;
    }
  } catch (err: any) {
    console.warn(`[Supabase DB Uncaught] Error on "${localKey}", falling back to LocalStorage:`, err?.message || String(err));
  }
  const local = getLocal<T>(localKey, defaultValue);
  return filterFn ? filterFn(local) : local;
}

// Robust Helper to get a Single entity with LocalStorage fallback search
async function safeSupabaseGetOne<T>(
  queryPromise: any,
  localKey: string,
  findFn: (items: any[]) => T | null
): Promise<T | null> {
  try {
    const { data, error } = await queryPromise;
    if (error) {
      console.warn(`[Supabase DB Warning] Single get failed on "${localKey}":`, error.message);
      return findFn(getLocal<any[]>(localKey, []));
    }
    if (data) {
      return data;
    }
  } catch (err: any) {
    console.warn(`[Supabase DB Uncaught] Error getting single from "${localKey}":`, err?.message || String(err));
  }
  return findFn(getLocal<any[]>(localKey, []));
}

// Robust Helper to Upsert an Entity into local cache & try to sync with Supabase (will never crash the app)
async function safeSupabaseUpsert<T extends { id?: string; uid?: string }>(
  tableName: string,
  item: T,
  localKey: string,
  matchKey: keyof T
): Promise<void> {
  // First, instantly commit to local offline-first repository
  const localList = getLocal<T[]>(localKey, []);
  const idx = localList.findIndex(x => x[matchKey] === item[matchKey]);
  if (idx > -1) {
    localList[idx] = item;
  } else {
    localList.push(item);
  }
  setLocal(localKey, localList);

  // Next, try to write/sync to Supabase database silently
  try {
    const { error } = await supabase.from(tableName).upsert(item);
    if (error) {
      console.warn(`[Supabase DB Sync Warning] Could not sync to table "${tableName}":`, error.message);
    } else {
      console.log(`[Supabase DB Sync] Successfully synchronized item to table "${tableName}".`);
    }
  } catch (err: any) {
    console.warn(`[Supabase DB Sync Uncaught] Exception writing to table "${tableName}":`, err?.message || String(err));
  }
}

export const dbService = {
  // Clear the in-memory cache to force-reload on next query
  clearCache(): void {
    memoryCache.stories = null;
    memoryCache.profiles = null;
    memoryCache.competitions = null;
    memoryCache.auditLogs = null;
    memoryCache.nodes = {};
    memoryCache.submissions = {};
    memoryCache.profileMap = {};
    console.log("[Stilova Cache Manager] Cache cleared and invalidated.");
  },

  // --- USERS MANAGEMENT ---
  async getProfile(uid: string): Promise<UserProfile | null> {
    if (memoryCache.profileMap[uid]) {
      return memoryCache.profileMap[uid];
    }
    const profile = await safeSupabaseGetOne<UserProfile>(
      supabase.from("users_profiles").select("*").eq("uid", uid).maybeSingle(),
      "users_profiles",
      (list) => list.find(u => u.uid === uid) || null
    );
    if (profile) {
      memoryCache.profileMap[uid] = profile;
    }
    return profile;
  },

  async saveProfile(profile: UserProfile): Promise<void> {
    memoryCache.profileMap[profile.uid] = profile;
    if (memoryCache.profiles) {
      const idx = memoryCache.profiles.findIndex(u => u.uid === profile.uid);
      if (idx > -1) {
        memoryCache.profiles[idx] = profile;
      } else {
        memoryCache.profiles.push(profile);
      }
    }
    await safeSupabaseUpsert<UserProfile>("users_profiles", profile, "users_profiles", "uid" as any);
  },

  async listProfiles(forceRefresh = false): Promise<UserProfile[]> {
    if (!forceRefresh && memoryCache.profiles) {
      return memoryCache.profiles;
    }
    const list = await safeSupabaseQuery<UserProfile[]>(
      supabase.from("users_profiles").select("*"),
      "users_profiles",
      []
    );
    memoryCache.profiles = list;
    list.forEach(p => {
      memoryCache.profileMap[p.uid] = p;
    });
    return list;
  },

  async listAuditLogs(forceRefresh = false): Promise<AuditLog[]> {
    if (!forceRefresh && memoryCache.auditLogs) {
      return memoryCache.auditLogs;
    }
    const list = await safeSupabaseQuery<AuditLog[]>(
      supabase.from("audit_logs").select("*"),
      "audit_logs",
      []
    );
    list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    memoryCache.auditLogs = list;
    return list;
  },

  async saveAuditLog(log: AuditLog): Promise<void> {
    if (memoryCache.auditLogs) {
      memoryCache.auditLogs = [log, ...memoryCache.auditLogs];
    }
    await safeSupabaseUpsert<AuditLog>("audit_logs", log, "audit_logs", "id");
  },

  // --- STORIES ---
  async listStories(genre?: string, forceRefresh = true): Promise<Story[]> {
    if (!forceRefresh && memoryCache.stories) {
      const list = memoryCache.stories;
      return genre ? list.filter(s => s.genre === genre) : list;
    }
    const list = await safeSupabaseQuery<Story[]>(
      supabase.from("stories").select("*"),
      "stories",
      []
    );
    memoryCache.stories = list;
    return genre ? list.filter(s => s.genre === genre) : list;
  },

  async getStory(storyId: string): Promise<Story | null> {
    if (memoryCache.stories) {
      const found = memoryCache.stories.find(s => s.id === storyId);
      if (found) return found;
    }
    return safeSupabaseGetOne<Story>(
      supabase.from("stories").select("*").eq("id", storyId).maybeSingle(),
      "stories",
      (list) => list.find(s => s.id === storyId) || null
    );
  },

  async saveStory(story: Story): Promise<void> {
    if (memoryCache.stories) {
      const idx = memoryCache.stories.findIndex(s => s.id === story.id);
      if (idx > -1) memoryCache.stories[idx] = story;
      else memoryCache.stories.push(story);
    } else {
      memoryCache.stories = [story];
    }
    await safeSupabaseUpsert<Story>("stories", story, "stories", "id");
  },

  async deleteStory(storyId: string): Promise<void> {
    if (memoryCache.stories) {
      memoryCache.stories = memoryCache.stories.filter(s => s.id !== storyId);
    }
    const arr = getLocal<Story[]>("stories", []);
    setLocal("stories", arr.filter(s => s.id !== storyId));
    try {
      await supabase.from("stories").delete().eq("id", storyId);
    } catch (e: any) {
      console.warn("[Supabase DB Delete Warning] Exception deleting story:", e?.message || String(e));
    }
  },

  // --- STORY NODES (Branches) ---
  async listStoryNodes(storyId: string, forceRefresh = true): Promise<StoryNode[]> {
    if (!forceRefresh && memoryCache.nodes[storyId]) {
      return memoryCache.nodes[storyId];
    }
    const nodes = await safeSupabaseQuery<StoryNode[]>(
      supabase.from("story_nodes").select("*").eq("storyId", storyId),
      "nodes_list_" + storyId,
      []
    );
    
    // If empty, verify if we can pre-populate from the default SEED_NODES / legacy cache
    if (nodes.length === 0) {
      const legacyRecord = getLocal<Record<string, StoryNode[]>>("nodes", {});
      const legacyNodes = legacyRecord[storyId] || [];
      if (legacyNodes.length > 0) {
        setLocal("nodes_list_" + storyId, legacyNodes);
        memoryCache.nodes[storyId] = legacyNodes;
        return legacyNodes;
      }
    }
    memoryCache.nodes[storyId] = nodes;
    return nodes;
  },

  async saveStoryNode(node: StoryNode): Promise<void> {
    if (memoryCache.nodes[node.storyId]) {
      const list = memoryCache.nodes[node.storyId];
      const idx = list.findIndex(n => n.id === node.id);
      if (idx > -1) list[idx] = node;
      else list.push(node);
    } else {
      memoryCache.nodes[node.storyId] = [node];
    }
    
    // Save to node specific local cache
    const localList = getLocal<StoryNode[]>("nodes_list_" + node.storyId, []);
    const idx = localList.findIndex(n => n.id === node.id);
    if (idx > -1) localList[idx] = node;
    else localList.push(node);
    setLocal("nodes_list_" + node.storyId, localList);

    // Save to legacy flat nodes record map for compatibility
    const legacyRecord = getLocal<Record<string, StoryNode[]>>("nodes", {});
    legacyRecord[node.storyId] = localList;
    setLocal("nodes", legacyRecord);

    // Attempt Supabase sync
    try {
      await supabase.from("story_nodes").upsert(node);
    } catch (e: any) {
      console.warn("[Supabase DB Upsert Warning] Could not save node to story_nodes:", e?.message || String(e));
    }
  },

  // --- COMPETITIONS ---
  async listCompetitions(forceRefresh = false): Promise<Competition[]> {
    if (!forceRefresh && memoryCache.competitions) {
      return memoryCache.competitions;
    }
    const list = await safeSupabaseQuery<Competition[]>(
      supabase.from("competitions").select("*"),
      "competitions",
      []
    );
    memoryCache.competitions = list;
    return list;
  },

  async saveCompetition(comp: Competition): Promise<void> {
    if (memoryCache.competitions) {
      const idx = memoryCache.competitions.findIndex(c => c.id === comp.id);
      if (idx > -1) memoryCache.competitions[idx] = comp;
      else memoryCache.competitions.push(comp);
    } else {
      memoryCache.competitions = [comp];
    }
    await safeSupabaseUpsert<Competition>("competitions", comp, "competitions", "id");
  },

  // --- SUBMISSIONS ---
  async listSubmissions(compId: string, forceRefresh = false): Promise<Submission[]> {
    if (!forceRefresh && memoryCache.submissions[compId]) {
      return memoryCache.submissions[compId];
    }
    const list = await safeSupabaseQuery<Submission[]>(
      supabase.from("submissions").select("*").eq("competitionId", compId),
      "submissions_list_" + compId,
      []
    );
    if (list.length === 0) {
      const legacyAll = getLocal<Submission[]>("submissions", []);
      const legacyFiltered = legacyAll.filter(s => s.competitionId === compId);
      if (legacyFiltered.length > 0) {
        setLocal("submissions_list_" + compId, legacyFiltered);
        memoryCache.submissions[compId] = legacyFiltered;
        return legacyFiltered;
      }
    }
    memoryCache.submissions[compId] = list;
    return list;
  },

  async submitToCompetition(compId: string, sub: Submission): Promise<void> {
    if (memoryCache.submissions[compId]) {
      memoryCache.submissions[compId].push(sub);
    } else {
      memoryCache.submissions[compId] = [sub];
    }
    
    const localList = getLocal<Submission[]>("submissions_list_" + compId, []);
    localList.push(sub);
    setLocal("submissions_list_" + compId, localList);

    const legacyAll = getLocal<Submission[]>("submissions", []);
    legacyAll.push(sub);
    setLocal("submissions", legacyAll);

    try {
      await supabase.from("submissions").upsert(sub);
    } catch (e: any) {
      console.warn("[Supabase DB Upsert Warning] Could not save submission to submissions:", e?.message || String(e));
    }
  },

  // --- VOTES ---
  async castVote(compId: string, submissionId: string, userId: string): Promise<boolean> {
    const voteId = `vote_${userId}_${submissionId}`;
    try {
      const votes = getLocal<string[]>("votes", []);
      if (votes.includes(voteId)) {
        return false;
      }
      votes.push(voteId);
      setLocal("votes", votes);

      const list = getLocal<Submission[]>("submissions_list_" + compId, []);
      const idx = list.findIndex(s => s.id === submissionId);
      let updatedCount = 1;
      if (idx > -1) {
        list[idx].votesCount = (list[idx].votesCount || 0) + 1;
        updatedCount = list[idx].votesCount;
        setLocal("submissions_list_" + compId, list);
        if (memoryCache.submissions[compId]) {
          const mIdx = memoryCache.submissions[compId].findIndex(s => s.id === submissionId);
          if (mIdx > -1) memoryCache.submissions[compId][mIdx].votesCount = updatedCount;
        }
      }

      const legacyAll = getLocal<Submission[]>("submissions", []);
      const lIdx = legacyAll.findIndex(s => s.id === submissionId);
      if (lIdx > -1) {
        legacyAll[lIdx].votesCount = updatedCount;
        setLocal("submissions", legacyAll);
      }

      if (idx > -1) {
        await supabase.from("submissions").upsert(list[idx]);
      }
      
      try {
        await supabase.from("votes").upsert({
          id: voteId,
          userId,
          competitionId: compId,
          submissionId,
          createdAt: new Date().toISOString()
        });
      } catch (e) {
        // Safe fail-silent
      }

      return true;
    } catch (e: any) {
      console.error("[Vote Execution Failed]", e);
      return false;
    }
  },

  // --- NOTIFICATIONS ---
  async listNotifications(userId: string): Promise<Notification[]> {
    const list = await safeSupabaseQuery<Notification[]>(
      supabase.from("notifications").select("*").eq("userId", userId),
      "notifications_" + userId,
      []
    );
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return list;
  },

  async saveNotification(notification: Notification): Promise<void> {
    await safeSupabaseUpsert<Notification>("notifications", notification, "notifications_" + notification.userId, "id");
  },

  async markNotificationAsRead(id: string, userId: string): Promise<void> {
    const list = getLocal<Notification[]>("notifications_" + userId, []);
    const idx = list.findIndex(n => n.id === id);
    if (idx > -1) {
      list[idx].read = true;
      setLocal("notifications_" + userId, list);
      try {
        await supabase.from("notifications").update({ read: true }).eq("id", id);
      } catch (e) {
        console.warn("[Notifications] Error updating read status in Supabase:", e);
      }
    }
  },

  // --- SOCIAL (FOLLOWERS & LIKES) ---
  async getFollowers(authorId: string): Promise<string[]> {
    const list = await safeSupabaseQuery<{ followerId: string; followingId: string }[]>(
      supabase.from("follows").select("*").eq("followingId", authorId),
      "followers_" + authorId,
      []
    );
    return list.map(f => f.followerId);
  },

  async toggleFollow(followerId: string, followingId: string): Promise<boolean> {
    const key = `followers_${followingId}`;
    const list = getLocal<{ followerId: string; followingId: string }[]>(key, []);
    const idx = list.findIndex(f => f.followerId === followerId && f.followingId === followingId);
    let isFollowingNow = false;
    if (idx > -1) {
      list.splice(idx, 1);
      setLocal(key, list);
      try {
        await supabase.from("follows").delete().eq("followerId", followerId).eq("followingId", followingId);
      } catch (e) {
        console.warn("[Social] Error deleting follow in Supabase:", e);
      }
    } else {
      const entry = { followerId, followingId };
      list.push(entry);
      setLocal(key, list);
      try {
        await supabase.from("follows").upsert(entry);
      } catch (e) {
        console.warn("[Social] Error inserting follow in Supabase:", e);
      }
      isFollowingNow = true;
      
      try {
        const profile = await this.getProfile(followerId);
        const senderName = profile?.displayName || "Un lecteur";
        const notif: Notification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          userId: followingId,
          senderId: followerId,
          senderName,
          type: "follow",
          message: `${senderName} s'est abonné à votre plume Stilova !`,
          read: false,
          createdAt: new Date().toISOString()
        };
        await this.saveNotification(notif);
      } catch (err) {
        console.warn("Follow notification deferred", err);
      }
    }
    return isFollowingNow;
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const key = `followers_${followingId}`;
    const list = getLocal<{ followerId: string; followingId: string }[]>(key, []);
    return list.some(f => f.followerId === followerId && f.followingId === followingId);
  },

  async getStoryLikes(storyId: string): Promise<string[]> {
    const list = await safeSupabaseQuery<{ storyId: string; userId: string }[]>(
      supabase.from("story_likes").select("*").eq("storyId", storyId),
      "story_likes_" + storyId,
      []
    );
    return list.map(l => l.userId);
  },

  async toggleLikeStory(storyId: string, userId: string, storyTitle: string, authorId: string): Promise<boolean> {
    const key = `story_likes_${storyId}`;
    const list = getLocal<{ storyId: string; userId: string }[]>(key, []);
    const idx = list.findIndex(l => l.storyId === storyId && l.userId === userId);
    let isLikedNow = false;
    if (idx > -1) {
      list.splice(idx, 1);
      setLocal(key, list);
      try {
        await supabase.from("story_likes").delete().eq("storyId", storyId).eq("userId", userId);
      } catch (e) {
        console.warn("[Social] Error deleting like in Supabase:", e);
      }
    } else {
      const entry = { storyId, userId };
      list.push(entry);
      setLocal(key, list);
      try {
        await supabase.from("story_likes").upsert(entry);
      } catch (e) {
        console.warn("[Social] Error inserting like in Supabase:", e);
      }
      isLikedNow = true;

      if (userId !== authorId) {
        try {
          const profile = await this.getProfile(userId);
          const senderName = profile?.displayName || "Un lecteur";
          const notif: Notification = {
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            userId: authorId,
            senderId: userId,
            senderName,
            type: "like",
            storyId,
            storyTitle,
            message: `${senderName} a aimé votre œuvre "${storyTitle}" !`,
            read: false,
            createdAt: new Date().toISOString()
          };
          await this.saveNotification(notif);
        } catch (err) {
          console.warn("Like notification deferred", err);
        }
      }
    }
    return isLikedNow;
  },

  async isStoryLiked(storyId: string, userId: string): Promise<boolean> {
    const key = `story_likes_${storyId}`;
    const list = getLocal<{ storyId: string; userId: string }[]>(key, []);
    return list.some(l => l.storyId === storyId && l.userId === userId);
  }
};

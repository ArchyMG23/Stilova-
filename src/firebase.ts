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
import { Story, StoryNode, Competition, Submission, UserProfile, UserRole } from "./types";

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId || undefined);
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

// Test Connection on startup
export async function testConnection() {
  try {
    // Attempt standard retrieval of a connection signature
    await getDocFromServer(doc(db, 'system_meta', 'connection_ping'));
    console.log("[Stilova System DB] Deep Cloud Sync online.");
  } catch (error) {
    console.log("[Stilova System DB] Local Sandbox Buffer active (disconnected or offline).");
  }
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
  const v = localStorage.getItem(`stilova_cache_${key}`);
  return v ? JSON.parse(v) : def;
};

const setLocal = <T>(key: string, val: T): T => {
  localStorage.setItem(`stilova_cache_${key}`, JSON.stringify(val));
  return val;
};

// Initialize seed data inside local storage on boot
export function bootstrapLocalData() {
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
}

// ----------------------------------------------------
// DB SEED FOR DEPLOYED FIRESTORE INSTANCE
// ----------------------------------------------------
export async function seedCloudFirestore() {
  try {
    const storiesRef = collection(db, "stories");
    const testSnapshot = await getDocs(query(storiesRef, where("reported", "==", false)));
    if (testSnapshot.empty) {
      console.log("[Stilova DB Seeder] Firestore is empty. Initializing seed records...");
      
      // Seed Stories
      for (const story of SEED_STORIES) {
        await setDoc(doc(db, "stories", story.id), story);
        
        // Seed associated Nodes
        const nodes = SEED_NODES[story.id] || [];
        for (const node of nodes) {
          await setDoc(doc(db, `stories/${story.id}/nodes`, node.id), node);
        }
      }

      // Seed Competitions
      for (const comp of SEED_COMPETITIONS) {
        await setDoc(doc(db, "competitions", comp.id), comp);
      }

      // Seed Submissions
      const sub = {
        id: "sub_afro_dakar",
        competitionId: "comp_afrofuturism_2026",
        storyId: "story_afrofuturism_dakar",
        storyTitle: "Les Sentinelles de Goree-2099",
        authorId: "admin_seed_griot",
        authorName: "Abdoulaye Diallo",
        votesCount: 42,
        status: "approved",
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, `competitions/comp_afrofuturism_2026/submissions`, sub.id), sub);

      console.log("[Stilova DB Seeder] Cloud seeding completed successfully.");
    }
  } catch (err) {
    console.warn("[Stilova DB Seeder] Standalone mode warning: Firebase writing bypassed/permissions active.", err);
  }
}

// ----------------------------------------------------
// GLOBAL DATA ACCESS API (Saves to Cloud & caches Local)
// ----------------------------------------------------

export const dbService = {
  // --- USERS MANAGEMENT ---
  async getProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, "users", uid);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as UserProfile;
      }
      return null;
    } catch (e) {
      // Offline fallback
      const usersList = getLocal<UserProfile[]>("users_profiles", []);
      return usersList.find(u => u.uid === uid) || null;
    }
  },

  async saveProfile(profile: UserProfile): Promise<void> {
    const path = `users/${profile.uid}`;
    try {
      await setDoc(doc(db, "users", profile.uid), profile);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    } finally {
      // Sync local
      const usersList = getLocal<UserProfile[]>("users_profiles", []);
      const idx = usersList.findIndex(u => u.uid === profile.uid);
      if (idx > -1) usersList[idx] = profile;
      else usersList.push(profile);
      setLocal("users_profiles", usersList);
    }
  },

  // --- STORIES ---
  async listStories(genre?: string): Promise<Story[]> {
    try {
      const colRef = collection(db, "stories");
      const snap = await getDocs(colRef);
      const list = snap.docs.map(d => d.data() as Story);
      setLocal("stories", list); // Cache it
      return genre ? list.filter(s => s.genre === genre) : list;
    } catch (e) {
      const local = getLocal<Story[]>("stories", []);
      return genre ? local.filter(s => s.genre === genre) : local;
    }
  },

  async getStory(storyId: string): Promise<Story | null> {
    try {
      const sRef = doc(db, "stories", storyId);
      const snap = await getDoc(sRef);
      if (snap.exists()) {
        return snap.data() as Story;
      }
      return null;
    } catch (e) {
      return getLocal<Story[]>("stories", []).find(s => s.id === storyId) || null;
    }
  },

  async saveStory(story: Story): Promise<void> {
    const path = `stories/${story.id}`;
    try {
      await setDoc(doc(db, "stories", story.id), story);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    } finally {
      const arr = getLocal<Story[]>("stories", []);
      const idx = arr.findIndex(s => s.id === story.id);
      if (idx > -1) arr[idx] = story;
      else arr.push(story);
      setLocal("stories", arr);
    }
  },

  async deleteStory(storyId: string): Promise<void> {
    const path = `stories/${storyId}`;
    try {
      await deleteDoc(doc(db, "stories", storyId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    } finally {
      const arr = getLocal<Story[]>("stories", []);
      setLocal("stories", arr.filter(s => s.id !== storyId));
    }
  },

  // --- STORY NODES (Branches) ---
  async listStoryNodes(storyId: string): Promise<StoryNode[]> {
    try {
      const col = collection(db, `stories/${storyId}/nodes`);
      const snap = await getDocs(col);
      const nodes = snap.docs.map(d => d.data() as StoryNode);
      // Cache
      const cachedRecord = getLocal<Record<string, StoryNode[]>>("nodes", {});
      cachedRecord[storyId] = nodes;
      setLocal("nodes", cachedRecord);
      return nodes;
    } catch (e) {
      const cachedRecord = getLocal<Record<string, StoryNode[]>>("nodes", {});
      return cachedRecord[storyId] || [];
    }
  },

  async saveStoryNode(node: StoryNode): Promise<void> {
    const path = `stories/${node.storyId}/nodes/${node.id}`;
    try {
      await setDoc(doc(db, `stories/${node.storyId}/nodes`, node.id), node);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    } finally {
      const cachedRecord = getLocal<Record<string, StoryNode[]>>("nodes", {});
      const list = cachedRecord[node.storyId] || [];
      const idx = list.findIndex(n => n.id === node.id);
      if (idx > -1) list[idx] = node;
      else list.push(node);
      cachedRecord[node.storyId] = list;
      setLocal("nodes", cachedRecord);
    }
  },

  // --- COMPETITIONS ---
  async listCompetitions(): Promise<Competition[]> {
    try {
      const colRef = collection(db, "competitions");
      const snap = await getDocs(colRef);
      const list = snap.docs.map(d => d.data() as Competition);
      setLocal("competitions", list);
      return list;
    } catch (e) {
      return getLocal<Competition[]>("competitions", []);
    }
  },

  async saveCompetition(comp: Competition): Promise<void> {
    const path = `competitions/${comp.id}`;
    try {
      await setDoc(doc(db, "competitions", comp.id), comp);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    } finally {
      const arr = getLocal<Competition[]>("competitions", []);
      const idx = arr.findIndex(c => c.id === comp.id);
      if (idx > -1) arr[idx] = comp;
      else arr.push(comp);
      setLocal("competitions", arr);
    }
  },

  // --- SUBMISSIONS ---
  async listSubmissions(compId: string): Promise<Submission[]> {
    try {
      const colRef = collection(db, `competitions/${compId}/submissions`);
      const snap = await getDocs(colRef);
      const list = snap.docs.map(d => d.data() as Submission);
      setLocal(`submissions_${compId}`, list);
      return list;
    } catch (e) {
      const all = getLocal<Submission[]>("submissions", []);
      return all.filter(s => s.competitionId === compId);
    }
  },

  async submitToCompetition(compId: string, sub: Submission): Promise<void> {
    const path = `competitions/${compId}/submissions/${sub.id}`;
    try {
      await setDoc(doc(db, `competitions/${compId}/submissions`, sub.id), sub);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    } finally {
      const all = getLocal<Submission[]>("submissions", []);
      all.push(sub);
      setLocal("submissions", all);
    }
  },

  // --- VOTES ---
  async castVote(compId: string, submissionId: string, userId: string): Promise<boolean> {
    const voteId = `vote_${userId}_${submissionId}`;
    const votePath = `competitions/${compId}/submissions/${submissionId}/votes/${voteId}`;
    try {
      // 1. Create Vote document
      const voteDoc = {
        id: voteId,
        userId,
        competitionId: compId,
        submissionId,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, `competitions/${compId}/submissions/${submissionId}/votes`, voteId), voteDoc);

      // 2. Increment submission count inside cloud
      const subRef = doc(db, `competitions/${compId}/submissions`, submissionId);
      const subSnap = await getDoc(subRef);
      if (subSnap.exists()) {
        const subData = subSnap.data() as Submission;
        await updateDoc(subRef, { votesCount: (subData.votesCount || 0) + 1 });
      }
      return true;
    } catch (e) {
      // Fallback local vote constraint
      const votes = getLocal<any[]>("votes", []);
      const alreadyVoted = votes.some(v => v.userId === userId && v.submissionId === submissionId);
      if (alreadyVoted) return false;

      votes.push({ userId, submissionId, compId });
      setLocal("votes", votes);

      // Increment local count
      const subs = getLocal<Submission[]>("submissions", []);
      const idx = subs.findIndex(s => s.id === submissionId);
      if (idx > -1) {
        subs[idx].votesCount += 1;
        setLocal("submissions", subs);
      }
      return true;
    }
  }
};

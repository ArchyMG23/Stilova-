export type UserRole = "reader" | "writer" | "moderator" | "admin";

export type AfricanGenre = "afrofuturism" | "mythology" | "romance" | "drama" | "historical";

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  bio: string;
  favoriteGenres: string[];
  avatarUrl: string;
  createdAt: string;
  updatedAt: string;
  isVisitor?: boolean;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  genre: AfricanGenre;
  authorId: string;
  authorName: string;
  isPublished: boolean;
  isInteractive: boolean;
  rating: number;
  viewsCount: number;
  reported: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Custom typography fields for auth personalization
  title_font?: string;
  title_font_weight?: string;
  signature_font?: string;
  signature_color?: string;
  signature_alignment?: string;
  auto_signature_enabled?: boolean;
  default_signature?: string;
}

export interface Choice {
  text: string;
  nextNodeId: string;
}

export interface StoryNode {
  id: string;
  storyId: string;
  title: string;
  content: string;
  isRoot: boolean;
  choices: Choice[];
  createdAt: string;
  updatedAt: string;
  
  // Custom signature and placement settings for individual chapters
  custom_signature?: string;
  custom_signature_font?: string;
  custom_signature_color?: string;
  custom_signature_alignment?: string;
}

export interface Competition {
  id: string;
  title: string;
  description: string;
  theme: string;
  deadline: string;
  prizeAmount: string;
  submissionsCount: number;
  isOpen: boolean;
  createdAt: string;
}

export interface Submission {
  id: string;
  competitionId: string;
  storyId: string;
  storyTitle: string;
  authorId: string;
  authorName: string;
  votesCount: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface Vote {
  id: string;
  userId: string;
  competitionId: string;
  submissionId: string;
  createdAt: string;
}

export interface SoundscapeState {
  mood: string;
  musicPrompt: string;
  colorStyle: string;
  tempo: string;
  soundEffects: string[];
}

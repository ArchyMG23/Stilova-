# ##################################################################
# STILOVA - DOCUMENT DE SPÉCIFICATIONS FONCTIONNELLES ET TECHNIQUES
# ##################################################################
# Statut : Prêt pour Production / Validation Architecture
# Rôles Rédacteurs : Senior Product Manager & Principal Software Architect

---

## TABLE DES MATIÈRES
1. **PARTIE 1 : CADRE ET SPÉCIFICATIONS MÉTIER (PRODUCT MANAGEMENT)**
   - 1.1. Profils & Cas d'Usage Détaillés (Visitor, Reader, Author, Moderator, Admin, Super Admin)
   - 1.2. User Stories Détaillées et Critères d'Acceptation Fonctionnels
   - 1.3. Workflows Métier & Entonnoirs Clés
   - 1.4. Indicateurs Produit & Métriques Alignées (KPIs)
2. **PARTIE 2 : ARCHITECTURE TECHNIQUE PRÊTE POUR LA PRODUCTION**
   - 2.1. Diagramme d'Architecture Globale (Infrastructure & Flux)
   - 2.2. Diagramme des Modules NestJS (DDD & Clean Architecture)
   - 2.3. Diagramme et Architecture Flutter (Riverpod Flux d'État)
   - 2.4. Diagramme de Relation des Entités (ERD) & Modélisation PostgreSQL
   - 2.5. Schéma Prisma de Production Complet (`schema.prisma`)
   - 2.6. Script de Migration SQL de Référence de Production (`migration.sql`)
   - 2.7. Arborescence Détaillée du Backend (NestJS Monorepo Structure)
   - 2.8. Arborescence Détaillée du Frontend (Flutter Feature-First Structure)
   - 2.9. Configuration Redis & BullMQ (Mise en cache, Jobs Emails, IA & Synchro)
   - 2.10. Configuration de Sécurité (Helmet, CORS, Guards JWT, Double Auth, Blacklist)
   - 2.11. Configuration Multi-Container de Production (Docker, Docker-Compose & Build Multi-stages)
   - 2.12. Stratégie de Déploiement Cloud AWS (Architecture Résiliente, ECS Fargate, RDS)
   - 2.13. Stratégie de Couverture de Tests (Backend E2E & Flutter Integration Tests)

---

# PARTIE 1 : CADRE ET SPÉCIFICATIONS MÉTIER (PRODUCT MANAGEMENT)

## 1.1. Profils & Cas d'Usage Détaillés

### VISITOR (Utilisateur Non Connecté)
- **UC-V01 : Découverte Silencieuse.** Parcourir librement le catalogue public, filtrer les histoires par genre littéraire ou tags sans connexion.
- **UC-V02 : Recherche Unifiée.** Rechercher des histoires, auteurs ou univers via la barre de recherche globale.
- **UC-V03 : Évaluation Interactive.** Consulter la fiche technique d'une histoire, lire les résumés et les extraits de chapitres gratuits.
- **UC-V04 : Conversion Premium.** Accéder aux parcours d'enregistrement d'authentification (Google, Apple, Email/Password).

### READER (Lecteur Connecté)
- **UC-R01 : Lecture Immersive & Personnalisation.** Visualiser un chapitre complet, adapter le mode d'affichage (nuit, crème, blanc), ajuster la police, l'interligne et suivre sa progression.
- **UC-R02 : Bibliothèque & Bookmark.** Ajouter des histoires à sa bibliothèque dans différentes sections (En Cours, À Lire, Terminées). Enregistrer des signets de progression et ajouter des notes de lecture privées.
- **UC-R03 : Intégration Sociale & Notation.** Noter les histoires via un système de "1 à 5 Plumes", soumettre des commentaires chronologiques et liker des commentaires tiers.
- **UC-R04 : Collecte & Gamification.** Gagner et afficher ses badges (Lecteur Assidu, Explorateur) et gérer la visibilité de son profil et de ses abonnements.

### AUTHOR (Auteur & Griot Moderne)
- **UC-A01 : Studio d'Écriture Notion-Style.** Créer, formater, déplacer par drag-and-drop des chapitres et enregistrer des brouillons d'histoires à la volée avec auto-sauvegarde toutes les 2 secondes.
- **UC-A02 : Concepteur d'Univers.** Regrouper plusieurs récits sous un univers littéraire structuré avec une chronologie globale.
- **UC-A03 : Moteur Non-Linéaire (Interactive Stories).** Créer des récits à branchements multiples (choix multiples à la fin d'un chapitre dirigeant vers d'autres chapitres), visualiser le graphe d'embranchements et interdire les choix cassés.
- **UC-A04 : Suite Cognitive IA.** Utiliser les assistants de révision (correction orthographique, génération de synopsis de chapitre, suggestions narratives de suite, extraction de fiches de personnages, génération de prompts d'illustrations pour couvertures).
- **UC-A05 : Dashboard Analytics & Subscriptions.** Suivre son audience (nombre de lectures uniques, taux de complétion par chapitre, évolution des abonnements) et participer aux concours actifs de la plateforme.

### MODERATOR (Modérateur Éditorial)
- **UC-M01 : File de Signalements.** Consulter les contenus signalés par les lecteurs (histoires interdites, propos haineux, spams dans les commentaires).
- **UC-M02 : Actions Conservatoires.** Masquer temporairement un contenu, supprimer un commentaire, émettre des avertissements aux utilisateurs cibles d'un signalement valide.

### ADMIN (Administrateur Opérationnel)
- **UC-AD01 : Gestion du Cycle de Vie Utilisateur.** Rechercher, suspendre, bannir ou réactiver des comptes utilisateurs. Modifier les rôles utilisateurs.
- **UC-AD02 : Gestion des Événements & Concours.** Créer, structurer, budgétiser et fermer des concours d'écriture panafricains. Gérer les badges du système.

### SUPER ADMIN (Gouvernance Absolue)
- **UC-SA01 : Administration Système.** Assigner le rôle Admin, modifier les variables de configuration réseau/IA, consulter la console d'Audit global de toutes les actions administratives de la plateforme.

---

## 1.2. User Stories Détaillées et Critères d'Acceptation Fonctionnels

### US-01 : Processus d'Inscription & Onboarding Multi-étapes
- **En tant que** Visiteur,
- **Je veux** suivre un onboarding élégant et guidé,
- **Afin de** configurer immédiatement ma bibliothèque idéale en fonction de mes préférences de lecture et d'écriture.

#### Critères d'acceptation fonctionnels :
1. **Étape 1 (Passerelle Premium) :** L'utilisateur choisit entre s'authentifier par OAuth (Google, Apple) ou via un champ Email/Mot de passe traditionnel.
2. **Étape 2 (Création & Sécurité Check) :** Si processus par mail, validation en temps réel avec indicateur visuel de sécurité du mot de passe (Longueur >= 8 caractères, mix majuscule/chiffre/symbole obligatoire). Double validation du mot de passe.
3. **Étape 3 (Définition d'Intention) :** L'utilisateur doit obligatoirement cliquer sur une puce d'intention unique parmi : `[Lire]`, `[Écrire]` ou `[Les deux]`.
4. **Étape 4 (Arbre d'Intérêt) :** Présentation d'une grille interactive multiselect d'au moins 10 genres littéraires (Romance, Afrofuturisme, Fantastique, Thriller, Chroniques, Poésie, etc.). L'utilisateur doit sélectionner au moins 3 genres pour poursuivre.
5. **Étape 5 (Activation) :** Initialisation du profil avec création automatique des paramètres de confidentialité par défaut (Visibilité privée par défaut pour protéger l'utilisateur). Redirection directe vers un Dashboard d'accueil personnalisé avec des histoires recommandées correspondant à ses genres.

### US-02 : Studio d'Écriture Notion-Style doté de l'IA
- **En tant qu'** Auteur,
- **Je veux** un éditeur WYSIWYG structuré par blocs de contenus avec un assistant IA,
- **Afin de** rédiger confortablement des récits immersifs, les structurer s'il le faut sous forme interactive et générer des actifs éditoriaux sans quitter mon application.

#### Critères d'acceptation fonctionnels :
1. L'éditeur doit enregistrer les données côté serveur de manière asynchrone (autosave).
2. L'écriture s'organise en blocs typés : `Paragraphe Texto`, `Citation`, `Image (Couverture/Contenu)`, `Séparateur`, `Illustration IA`, et `Choix Interactif`.
3. L'auteur peut faire appel au module IA pour :
   - Corriger les fautes d'orthographe et de style sur le bloc sélectionné.
   - Générer un résumé automatique (synopsis) du chapitre basé sur le texte déjà écrit.
   - Obtenir des suggestions narratives de développements de l'intrigue.
   - Analyser et extraire automatiquement la liste des personnages mentionnés dans le chapitre et les enregistrer comme fiches de personnages de l'Univers.
4. Génération d'images : Saisie d'un prompt dans l'application pour générer une illustration unique (via Gemini Imagen 3) qui s'insère directement comme couverture de l'histoire ou bloc visuel de transition.

### US-03 : Moteur de Lecture Immersive & Récit Interactif
- **En tant que** Lecteur,
- **Je veux** pouvoir lire des chapitres d'histoires traditionnelles ou naviguer à travers des choix multiples dans les histoires interactives,
- **Afin de** d'avoir un contrôle total sur mon immersion et sur la trajectoire des personnages que j'accompagne.

#### Critères d'acceptation fonctionnels :
1. L'écran de lecture doit proposer un panneau de contrôles typographiques complet : choix entre 3 polices (Sans serif Inter, Display Georgia, Mono Fira Code), sélecteur de couleurs de fond (Mode Nuit profond, Crème reposant, Blanc de jour), curseur d'interligne (1.2, 1.5, 1.8).
2. Progression : Un indicateur visuel en pourcentage et une estimation dynamique en minutes restantes (basée sur une moyenne de 250 mots par minute) s'affiche à l'écran.
3. Récits interactifs : À la fin d'un chapitre, si l'histoire est marquée sous le type `isInteractive`, l'app doit masquer le bouton classique "Suivant" et afficher à la place un panneau de choix dynamiques reliés à d'autres chapitres (nodes).
4. Mode Hors Ligne : Bouton "Télécharger" sur la fiche de l'histoire permettant de synchroniser localement l'intégralité du texte et de l'iconographie pour une lecture sans internet (Drift database côté client).

---

## 1.3. Workflows Métier & Entonnoirs Clés

### A. Flux de Publication d'une Histoire Interactive sans Choix Cassés
```
[Création d'un Récit] ──> [Ajout Chapitre Initial (Node 1)] 
                                   │
                                   ▼
                       [Rédiger Blocs de Contenu]
                                   │
                      ┌────────────┴────────────┐
                      ▼                         ▼
            [Publication Standard]     [Mode Interactif]
                      │                         │
                      │                         ▼
                      │               [Créer Choix 1 -> Node 2]
                      │               [Créer Choix 2 -> Node 3]
                      │                         │
                      │                         ▼
                      │               [Validateur de Graphe IA]
                      │               - Détecte boucles sans fin
                      │               - Repère les chapitres orphelins
                      │                         │
                      │             ┌───────────┴───────────┐
                      │             ▼ (Erreurs détectées)   ▼ (Validation OK)
                      │       [Alerte Bloquante]      [Lien Valide]
                      │             │                       │
                      ▼             ▼                       ▼
               [Valider Fiche & Soumission pour Indexation Publique]
```

### B. Flux Global de Modération et Transparence (Workflow Trust & Safety)
1. Un membre (Reader) clique sur "Signaler" depuis un commentaire ou un chapitre d'histoire.
2. Formulaire : L'utilisateur sélectionne un motif (Harcèlement, Violation de droits, Contenu haineux, Vulgarité) et ajoute une description optionnelle.
3. Arrivée immédiate du signalement dans la table `reports` avec le statut `PENDING`.
4. Notification automatique sur le canal Socket.io d'un modérateur connecté.
5. Le modérateur examine l'histoire ou le commentaire ciblé sur son tableau de bord :
   - option **[Dismiss]** -> Statut classé `DISMISSED` sans conséquence.
   - option **[Hide Content]** -> Désactivation du flag public sans suppression, statut `ACTION_TAKEN`.
   - option **[Warn User & ShadowBan]** -> Envoi d'un mail d'avertissement automatique, suspension temporaire de l'utilisateur, historique enregistré dans les tables d'Audit.

---

## 1.4. Indicateurs Produit & Métriques Alignées (KPIs)

| Nom de l'Indicateur | Cible Métier | Algorithme de Calcul | Seuil Critique |
| :--- | :--- | :--- | :--- |
| **WAU / MAU Ratio** | Rétention & Engagement | (Utilisateurs uniques sur 7j / Utilisateurs sur 30j) * 100 | < 25% |
| **CTR Chapitre (Taux de Rebond)** | Captation narrative | (Lecteurs ayant fini chap. 1 / Lecteurs ayant ouvert chap. 1) * 100 | < 45% |
| **Indice de Complétion d'Histoire** | Qualité d'écriture | (Lecteurs atteignant la Node Finale / Lecteurs ayant entamé la Node 1) | < 15% |
| **Activity Ratio Humain/IA** | Aide à la création | (Nombre d'appels IA correction oû gen / Total de mots rédigés par l'auteur) | N/A (Tendance) |
| **Taux de Traitement des Signalements** | Sécurité de la communauté | (Signalements traités en < 2 heures / Total signalements) * 100 | < 90% |

---

# PARTIE 2 : ARCHITECTURE TECHNIQUE PRÊTE POUR LA PRODUCTION

## 2.1. Diagramme d'Architecture Globale (Infrastructure & Flux)

```
                            ┌────────────────────────────────────┐
                            │      CLIENTS / END-USER AGENTS     │
                            │  Flutter Web / iOS / Android Apps  │
                            └──────────────────┬─────────────────┘
                                               │ HTTPS / WSS
                                               ▼
                                      [ AWS CloudFront CDN ]
                                               │ (Contenus Statiques & Assets)
                                               ▼
                                   [ Route 53 Network Routing ]
                                               │
                                               ▼
                                   [ Application Load Balancer ]
                                               │ SSL Termination
                                               ▼
                            ┌────────────────────────────────────┐
                            │    VPC (VIRTUAL PRIVATE CLOUD)     │
                            │                                    │
                            │   ┌────────────────────────────┐   │
                            │   │    ECS Fargate cluster     │   │
                            │   │  NestJS Backend Containers │   │
                            │   └─────────────┬──────────────┘   │
                            │                 ├──────────────────┼────────────────┐
                            │                 │ Cluster Internal │                │
                            │                 ▼                  ▼                ▼
                            │          ┌─────────────┐   ┌───────────────┐  ┌───────────┐
                            │          │  RDS Cloud  │   │   ElastiCache │  │ BullMQ on │
                            │          │ PostgreSQL  │   │  Redis (Cache │  │ Redis     │
                            │          │ (Active)    │   │  & Session)   │  │ (Queues)  │
                            │          └──────┬──────┘   └───────────────┘  └─────┬─────┘
                            │                 │ Replication                       │
                            │                 ▼                                   │
                            │          ┌─────────────┐                            ▼
                            │          │  RDS Cloud  │                       [Workers]
                            │          │ PostgreSQL  │                       (Email/IA)
                            │          │  (Standby)  │                            │
                            │          └─────────────┘                            │
                            └─────────────────────────────────────────────────────┼─┘
                                                                                  │
                ┌─────────────────────────────────────────────────────────────────┴─┐
                ▼ (Appels HTTPS Assaisonnés de Headers Sécurisés)                 ▼
       ┌──────────────────┐                                             ┌──────────────────┐
       │   Cloudinary     │ (Upload direct d'avatars & de fanarts)      │    Google        │
       │   S3 Assets      │                                             │    Gemini API    │
       └──────────────────┘                                             └──────────────────┘
```

---

## 2.2. Diagramme des Modules NestJS (Structure DDD Modulaire)

Chaque module NestJS est autonome et se compose d'une structure hexagonale stricte afin d'isoler le domaine métier de la base de données ou de l'exposition externe (HTTP/Sockets).

```
                     [ Client Request ]
                             │
                             ▼
 ┌────────────────────── INTERFACES ──────────────────────┐
 │ - Controllers (REST Endpoints)                         │
 │ - Gateways (WebSockets Events)                         │
 │ - DTOs (Data Transfer Objects conquis par class-validator)│
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────── APPLICATION ─────────────────────┐
 │ - Services (Sarthe de l'orchestration applicative)      │
 │ - Use Cases (Interpreters de commande utilisateur)      │
 │ - Event Listeners (Gestionnaires asynchrones pub/sub)   │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌──────────────────────── DOMAIN ────────────────────────┐
 │ - Entities (Modèles anémiques et comportementaux)       │
 │ - Value Objects (Variables immuables métier)           │
 │ - Aggregates (Frontière de transaction)                │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌───────────────────── INFRASTRUCTURE ───────────────────┐
 │ - Prisma Persistence (Repositories implementations)     │
 │ - External Adapters (Gemini SDK Wrapper, SES/Twilio)    │
 │ - Cache Service (Redis Adapter)                         │
 └────────────────────────────────────────────────────────┘
```

---

## 2.3. Diagramme et Architecture Flutter (Gestion des États avec Riverpod)

Le frontend mobile & web est structuré selon un paradigme **Feature-First** en isolant la gestion d'état réactive (Notifier types) des couches d'exposition d'interfaces de widgets.

```
┌─────────────────────────────────────────────────────────┐
│                    FLUTTER WIDGETS                      │
│ (ConsumerWidget, ConsumerStatefulWidget - Vue Passive)  │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼ [watch / read / listen Events]
┌─────────────────────────────────────────────────────────┐
│               RIVERPOD FAMILY PROVIDERS                 │
│   - AuthStateNotifier                                   │
│   - LibraryRepositoryProvider                           │
│   - ActiveReadingNotifier                               │
│   - StoryCreationNotifier (avec sauvegarde Draft locale) │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼ [Appel Synchrone ou cache Hive/Drift]
┌─────────────────────────────────────────────────────────┐
│                    REPOSITORIES COUCHE                  │
│  - AuthRepository (implém. Dio HttpClient intercepté)   │
│  - LibraryRepository (gère le sync Online/Offline)      │
│  - StoryRepository / AIRepository                       │
└────────────────────────────┬────────────────────────────┘
                             ├────────────────────────────┐
                             ▼ (En ligne)                 ▼ (Hors ligne)
                 ┌───────────────────────┐    ┌───────────────────────┐
                 │       DIO CLIENT      │    │  DRIFT DATABASE (SQL) │
                 │ (External REST APIs)  │    │  (Local Safe Offline) │
                 └───────────────────────┘    └───────────────────────┘
```

---

## 2.4. Diagramme de Relation des Entités (ERD) & Modélisation PostgreSQL

```
   ┌──────────────┐             ┌──────────────┐             ┌──────────────┐
   │     users    │1          1│   profiles   │1          1│privacy_set...│
   │──────────────│─────────────│──────────────│─────────────│──────────────│
   │ id (PK)      │             │ id (PK)      │             │ id (PK)      │
   │ email        │             │ displayName  │             │ isLibPrivate │
   │ pwdHash      │             │ avatarUrl    │             │ isFavPrivate │
   │ role         │             │ bio          │             │ ...          │
   └──────┬───────┘             └──────────────┘             └──────────────┘
          │ 1
          │
          │ N
   ┌──────▼───────┐             ┌──────────────┐             ┌──────────────┐
   │    stories   │N           1│  universes   │1          N│   chapters   │
   │──────────────│─────────────│──────────────│─────────────│──────────────│
   │ id (PK)      │             │ id (PK)      │             │ id (PK)      │
   │ title        │             │ name         │             │ title        │
   │ description  │             │ description  │             │ sequenceNum  │
   │ authorId(FK) │             │ authorId(FK) │             │ storyId(FK)  │
   └──────┬───────┘             └──────────────┘             └──────┬───────┘
          │ 1                                                       │ 1
          │                                                         │
          ├─────────────────────────────┐                           │ N
          │ 1                           │ 1                         ▼
   ┌──────▼───────┐              ┌──────▼───────┐            ┌──────────────┐
   │   comments   │              │ story_ratings│            │chapter_blocks│
   │──────────────│              │──────────────│            │──────────────│
   │ id (PK)      │              │ id (PK)      │            │ id (PK)      │
   │ content      │              │ userId (FK)  │            │ type (enum)  │
   │ authorId(FK) │              │ storyId (FK) │            │ content      │
   │ storyId(FK)  │              │ value [1..5] │            │ chapterId(FK)│
   └──────────────┘              └──────────────┘            └──────┬───────┘
                                                                    │ 1 (Interactive)
                                                                    │
                                                                    ▼ N
                                                             ┌──────────────┐
                                                             │   choices    │
                                                             │──────────────│
                                                             │ id (PK)      │
                                                             │ text         │
                                                             │ srcChapt(FK) │
                                                             │ tgtChapt(FK) │
                                                             └──────────────┘
```

---

## 2.5. Schéma Prisma de Production Complet (`schema.prisma`)

Ce fichier définit de façon exhaustive toutes les structures requises pour supporter l'écosystème Stilova.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum UserStatus {
  ACTIVE
  PENDING_VERIFICATION
  SUSPENDED
  BANNED
  DELETED
}

enum BlockType {
  TEXT
  IMAGE
  CITATION
  DIVIDER
  AI_ILLUSTRATION
  INTERACTIVE_CHOICE
}

enum LibraryStatus {
  READING
  TO_READ
  COMPLETED
  FAVORITE
}

enum TargetType {
  STORY
  COMMENT
  USER
}

enum ReportStatus {
  PENDING
  ACCUSED
  DISMISSED
  ACTION_TAKEN
}

enum AIGenType {
  CORRECTION
  SUMMARY
  SUGGESTION
  CHARACTER_EXTRACTION
  CHRONOLOGY
  ILLUSTRATION_PROMPT
}

enum SubmissionStatus {
  PENDING
  APPROVED
  REJECTED
}

model User {
  id              String           @id @default(uuid())
  email           String           @unique
  passwordHash    String
  status          UserStatus       @default(ACTIVE)
  twoFactorSecret String?
  is2FAEnabled    Boolean          @default(false)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  profile         Profile?
  privacySettings PrivacySettings?
  
  // Relations
  userRoles       UserRole[]
  stories         Story[]
  universes       Universe[]
  comments        Comment[]
  commentLikes    CommentLike[]
  storyLikes      StoryLike[]
  storyRatings    StoryRating[]
  libraries       Library[]
  bookmarks       Bookmark[]
  readingHistory  ReadingHistory[]
  downloads       OfflineDownload[]
  badges          UserBadge[]
  aiGenerations   AIGeneration[]
  submissions     ContestSubmission[]
  adminLogs       AdminLog[]
  reportsFiled    Report[]         @relation("ReporterRelation")

  @@index([email])
}

model Role {
  id              String           @id @default(uuid())
  name            String           @unique // e.g. "VISITOR", "READER", "AUTHOR", "MODERATOR", "ADMIN", "SUPER_ADMIN"
  description     String?
  rolePermissions RolePermission[]
  userRoles       UserRole[]
}

model Permission {
  id              String           @id @default(uuid())
  name            String           @unique // e.g. "stories:create", "comments:delete", "users:ban"
  description     String?
  rolePermissions RolePermission[]
}

model RolePermission {
  roleId       String
  permissionId String
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
}

model UserRole {
  userId String
  roleId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  role   Role   @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([userId, roleId])
}

model Profile {
  userId      String   @id
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  displayName String
  avatarUrl   String?
  bio         String?  @db.Text
  country     String?
  language    String   @default("fr")
  updatedAt   DateTime @updatedAt
}

model PrivacySettings {
  userId                 String  @id
  user                   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  isLibraryPublic        Boolean @default(false)
  isFavoritesPublic      Boolean @default(false)
  isHistoryPublic        Boolean @default(false)
  isBadgesPublic         Boolean @default(true)
  isSubscriptionsPublic  Boolean @default(true)
  isCommentsPublic       Boolean @default(true)
}

model Story {
  id            String             @id @default(uuid())
  title         String
  description   String             @db.Text
  coverUrl      String?
  isPublished   Boolean            @default(false)
  isInteractive Boolean            @default(false)
  isFeatured    Boolean            @default(false)
  rating        Float              @default(0.0)
  viewsCount    Int                @default(0)
  authorId      String
  author        User               @relation(fields: [authorId], references: [id], onDelete: Cascade)
  universeId    String?
  universe      Universe?          @relation(fields: [universeId], references: [id], onDelete: SetNull)
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt

  chapters      Chapter[]
  storyTags     StoryTag[]
  comments      Comment[]
  likes         StoryLike[]
  ratings       StoryRating[]
  libraries     Library[]
  bookmarks     Bookmark[]
  history       ReadingHistory[]
  downloads     OfflineDownload[]
  submissions   ContestSubmission[]

  @@index([authorId])
  @@index([universeId])
  @@index([title])
}

model Universe {
  id          String   @id @default(uuid())
  name        String
  description String   @db.Text
  authorId    String
  author      User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  stories     Story[]

  @@index([authorId])
}

model Tag {
  id        String     @id @default(uuid())
  name      String     @unique
  storyTags StoryTag[]
}

model StoryTag {
  storyId String
  tagId   String
  story   Story  @relation(fields: [storyId], references: [id], onDelete: Cascade)
  tag     Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([storyId, tagId])
}

model Chapter {
  id             String         @id @default(uuid())
  title          String
  sequenceNumber Int
  storyId        String
  story          Story          @relation(fields: [storyId], references: [id], onDelete: Cascade)
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  blocks         ChapterBlock[]
  bookmarks      Bookmark[]

  // References for non-linear choices
  sourceChoices  Choice[]       @relation("SourceChapterRelation")
  targetChoices  Choice[]       @relation("TargetChapterRelation")

  @@index([storyId])
}

model ChapterBlock {
  id             String    @id @default(uuid())
  type           BlockType @default(TEXT)
  content        String    @db.Text // JSON form or simple string
  sequenceNumber Int
  chapterId      String
  chapter        Chapter   @relation(fields: [chapterId], references: [id], onDelete: Cascade)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([chapterId])
}

model Choice {
  id              String   @id @default(uuid())
  text            String
  sourceChapterId String
  targetChapterId String
  sourceChapter   Chapter  @relation("SourceChapterRelation", fields: [sourceChapterId], references: [id], onDelete: Cascade)
  targetChapter   Chapter  @relation("TargetChapterRelation", fields: [targetChapterId], references: [id], onDelete: Cascade)
  createdAt       DateTime @default(now())

  @@index([sourceChapterId])
  @@index([targetChapterId])
}

model Comment {
  id        String   @id @default(uuid())
  content   String   @db.Text
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  storyId   String
  story     Story    @relation(fields: [storyId], references: [id], onDelete: Cascade)
  chapterId String?
  parentId  String?
  parent    Comment? @relation("CommentSelfRelation", fields: [parentId], references: [id], onDelete: Cascade)
  replies   Comment[] @relation("CommentSelfRelation")
  reported  Boolean  @default(false)
  createdAt DateTime @default(now())

  likes     CommentLike[]

  @@index([storyId])
  @@index([authorId])
}

model CommentLike {
  commentId String
  userId    String
  comment   Comment @relation(fields: [commentId], references: [id], onDelete: Cascade)
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([commentId, userId])
}

model StoryLike {
  storyId String
  userId  String
  story   Story @relation(fields: [storyId], references: [id], onDelete: Cascade)
  user    User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([storyId, userId])
}

model StoryRating {
  id        String   @id @default(uuid())
  storyId   String
  userId    String
  value     Int // 1 to 5
  createdAt DateTime @default(now())
  story     Story    @relation(fields: [storyId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([storyId, userId])
}

model Library {
  userId    String
  storyId   String
  status    LibraryStatus @default(READING)
  progress  Float         @default(0.0) // 0 to 100%
  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  story     Story         @relation(fields: [storyId], references: [id], onDelete: Cascade)
  updatedAt DateTime      @updatedAt
  createdAt DateTime      @default(now())

  @@id([userId, storyId])
}

model Bookmark {
  id             String   @id @default(uuid())
  userId         String
  storyId        String
  chapterId      String
  scrollPosition Float    @default(0.0)
  note           String?  @db.Text
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  story          Story    @relation(fields: [storyId], references: [id], onDelete: Cascade)
  chapter        Chapter  @relation(fields: [chapterId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model ReadingHistory {
  userId     String
  storyId    String
  lastReadAt DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  story      Story    @relation(fields: [storyId], references: [id], onDelete: Cascade)

  @@id([userId, storyId])
}

model OfflineDownload {
  id           String   @id @default(uuid())
  userId       String
  storyId      String
  downloadedAt DateTime @default(now())
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  story        Story    @relation(fields: [storyId], references: [id], onDelete: Cascade)

  @@unique([userId, storyId])
}

model Badge {
  id          String      @id @default(uuid())
  name        String      @unique
  description String
  iconUrl     String
  userBadges  UserBadge[]
}

model UserBadge {
  userId   String
  badgeId  String
  earnedAt DateTime @default(now())
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  badge    Badge    @relation(fields: [badgeId], references: [id], onDelete: Cascade)

  @@id([userId, badgeId])
}

model Contest {
  id          String              @id @default(uuid())
  title       String
  description String              @db.Text
  rules       String              @db.Text
  isOpen      Boolean             @default(true)
  startDate   DateTime
  endDate     DateTime
  createdAt   DateTime            @default(now())
  submissions ContestSubmission[]
}

model ContestSubmission {
  id        String           @id @default(uuid())
  contestId String
  storyId   String
  authorId  String
  status    SubmissionStatus @default(PENDING)
  createdAt DateTime         @default(now())
  contest   Contest          @relation(fields: [contestId], references: [id], onDelete: Cascade)
  story     Story            @relation(fields: [storyId], references: [id], onDelete: Cascade)
  author    User             @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@unique([contestId, storyId])
}

model Report {
  id          String       @id @default(uuid())
  reporterId  String
  targetType  TargetType
  targetId    String
  reason      String       @db.Text
  status      ReportStatus @default(PENDING)
  createdAt   DateTime     @default(now())
  reporter    User         @relation("ReporterRelation", fields: [reporterId], references: [id], onDelete: Cascade)

  @@index([targetId])
}

model AIGeneration {
  id        String    @id @default(uuid())
  userId    String
  type      AIGenType
  prompt    String    @db.Text
  result    String    @db.Text
  createdAt DateTime  @default(now())
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model AdminLog {
  id        String   @id @default(uuid())
  adminId   String
  action    String
  targetId  String?
  details   String?  @db.Text
  ipAddress String
  createdAt DateTime @default(now())
  admin     User     @relation(fields: [adminId], references: [id], onDelete: Cascade)
}
```

---

## 2.6. Script de Migration SQL de Référence de Production (`migration.sql`)

Ce script de génération manuelle ou de fallback assure la création des tables PostgreSQL, des index complexes requis pour les performances de lecture ainsi que les déclencheurs automatiques pour le recalcul asynchrone des notes de moyenne d'histoires.

```sql
-- migration.sql
-- Base de Données : PostgreSQL 15+

-- 1. ENUMS CREATION
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED', 'BANNED', 'DELETED');
CREATE TYPE "BlockType" AS ENUM ('TEXT', 'IMAGE', 'CITATION', 'DIVIDER', 'AI_ILLUSTRATION', 'INTERACTIVE_CHOICE');
CREATE TYPE "LibraryStatus" AS ENUM ('READING', 'TO_READ', 'COMPLETED', 'FAVORITE');
CREATE TYPE "TargetType" AS ENUM ('STORY', 'COMMENT', 'USER');
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'ACCUSED', 'DISMISSED', 'ACTION_TAKEN');
CREATE TYPE "AIGenType" AS ENUM ('CORRECTION', 'SUMMARY', 'SUGGESTION', 'CHARACTER_EXTRACTION', 'CHRONOLOGY', 'ILLUSTRATION_PROMPT');
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- 2. USERS & CONFIGURATION TABLES
CREATE TABLE "users" (
    "id" VARCHAR(255) PRIMARY KEY,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "twoFactorSecret" VARCHAR(255),
    "is2FAEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "profiles" (
    "userId" VARCHAR(255) PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
    "displayName" VARCHAR(100) NOT NULL,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "country" VARCHAR(100),
    "language" VARCHAR(10) NOT NULL DEFAULT 'fr',
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "privacy_settings" (
    "userId" VARCHAR(255) PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
    "isLibraryPublic" BOOLEAN NOT NULL DEFAULT FALSE,
    "isFavoritesPublic" BOOLEAN NOT NULL DEFAULT FALSE,
    "isHistoryPublic" BOOLEAN NOT NULL DEFAULT FALSE,
    "isBadgesPublic" BOOLEAN NOT NULL DEFAULT TRUE,
    "isSubscriptionsPublic" BOOLEAN NOT NULL DEFAULT TRUE,
    "isCommentsPublic" BOOLEAN NOT NULL DEFAULT TRUE
);

-- 3. INTERACTIVE CONTENT STRUCTS
CREATE TABLE "universes" (
    "id" VARCHAR(255) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "authorId" VARCHAR(255) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "stories" (
    "id" VARCHAR(255) PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "coverUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT FALSE,
    "isInteractive" BOOLEAN NOT NULL DEFAULT FALSE,
    "isFeatured" BOOLEAN NOT NULL DEFAULT FALSE,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "authorId" VARCHAR(255) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "universeId" VARCHAR(255) REFERENCES "universes"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "chapters" (
    "id" VARCHAR(255) PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "storyId" VARCHAR(255) NOT NULL REFERENCES "stories"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "chapter_blocks" (
    "id" VARCHAR(255) PRIMARY KEY,
    "type" "BlockType" NOT NULL DEFAULT 'TEXT',
    "content" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "chapterId" VARCHAR(255) NOT NULL REFERENCES "chapters"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "choices" (
    "id" VARCHAR(255) PRIMARY KEY,
    "text" TEXT NOT NULL,
    "sourceChapterId" VARCHAR(255) NOT NULL REFERENCES "chapters"("id") ON DELETE CASCADE,
    "targetChapterId" VARCHAR(255) NOT NULL REFERENCES "chapters"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. PERFORMANCES & EXPÉDITION DU CATALOGUE (INDEXATIONS CIBLÉES)
CREATE INDEX "idx_users_email" ON "users"("email");
CREATE INDEX "idx_stories_author" ON "stories"("authorId");
CREATE INDEX "idx_stories_title" ON "stories" USING gin (to_tsvector('french', "title"));
CREATE INDEX "idx_chapters_story_seq" ON "chapters"("storyId", "sequenceNumber");
CREATE INDEX "idx_chapter_blocks_seq" ON "chapter_blocks"("chapterId", "sequenceNumber");

-- 5. TRIGGER POUR LE RECALCUL EN TEMPS RÉEL DES PLUMES (RATING)
CREATE TABLE "story_ratings" (
    "id" VARCHAR(255) PRIMARY KEY,
    "storyId" VARCHAR(255) NOT NULL REFERENCES "stories"("id") ON DELETE CASCADE,
    "userId" VARCHAR(255) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "value" INTEGER CHECK ("value" >= 1 AND "value" <= 5),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("storyId", "userId")
);

CREATE OR REPLACE FUNCTION update_story_average_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE "stories"
    SET "rating" = (
        SELECT ROUND(AVG("value")::numeric, 2)
        FROM "story_ratings"
        WHERE "storyId" = NEW."storyId"
    )
    WHERE "id" = NEW."storyId";
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recalculate_story_rating
AFTER INSERT OR UPDATE ON "story_ratings"
FOR EACH ROW EXECUTE FUNCTION update_story_average_rating();
```

---

## 2.7. Arborescence Détaillée du Backend (NestJS Monorepo Structure)

```text
src/
├── main.ts                          # Point d'entrée de l'application bootstrap
├── app.module.ts                    # Registre racine unifiant tous les sous-modules virtuels
├── domain/                          # Entités partagées & Concepts business anémiques
│   └── value-objects/
├── infrastructure/                  # Adapteurs généraux (Prisma Services, API, AWS configuration)
│   ├── database/
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   └── config/
├── guards/                          # Gardes d'authentification globaux
│   ├── jwt-auth.guard.ts
│   ├── roles.guard.ts
│   └── double-auth.guard.ts
├── decorators/                      # Décorateurs de commodités personnalisées (@CurrentUser, @Roles)
│   ├── current-user.decorator.ts
│   └── roles.decorator.ts
├── interceptors/                    # Formatage des réponses & Logging synchrones
│   └── logging.interceptor.ts
├── filters/                         # Filtrage unifié d'exceptions HTTP/PostgreSQL
│   └── http-exception.filter.ts
├── middleware/                      # Protection brute des requêtes entrantes
│   └── security.middleware.ts
└── modules/                         # Modules modulaires auto-portants
    ├── auth/
    │   ├── auth.module.ts
    │   ├── auth.service.ts
    │   ├── auth.controller.ts
    │   ├── dto/
    │   └── strategies/
    ├── users/
    │   ├── users.module.ts
    │   ├── users.service.ts
    │   └── users.controller.ts
    ├── stories/
    │   ├── stories.module.ts
    │   ├── stories.service.ts
    │   ├── stories.controller.ts
    │   └── dto/
    ├── ai/
    │   ├── ai.module.ts
    │   ├── ai.service.ts              # Proxy des requêtes vers le Gemini API SDK
    │   └── ai.controller.ts
    └── moderation/
        ├── moderation.module.ts
        ├── moderation.service.ts
        └── moderation.controller.ts
```

---

## 2.8. Arborescence Détaillée du Frontend (Flutter Feature-First)

```text
lib/
├── main.dart                        # Initialisation de l'App MaterialApp, Firebase Messaging & Riverpod
├── routes/
│   └── app_router.dart              # Configuration GoRouter pour la gestion des écrans
├── core/                            # Configuration cross-cutting non liée à une fonctionnalité
│   ├── constants/
│   ├── theme/                       # Thèmes, polices (Inter/Fira Code/Georgia)
│   └── network/                     # Paramètres Dio, intercepteurs HTTP pour recharger les Tokens
├── shared/                          # Composants transverses globaux
│   └── ui_components/               # Boutons premium, fiches de chargement squelettes
└── features/                        # Domaines encapsulants (Feature-First)
    ├── auth/
    │   ├── presentation/
    │   │   ├── login_screen.dart
    │   │   └── onboarding_wizard.dart
    │   ├── providers/
    │   │   └── auth_provider.dart
    │   └── models/
    ├── discover/
    │   ├── presentation/
    │   │   ├── explorer_screen.dart
    │   │   └── widgets/
    │   └── providers/
    ├── reader/
    │   ├── presentation/
    │   │   ├── reading_panel.dart
    │   │   └── typography_settings.dart
    │   └── providers/
    │       └── reading_progress_provider.dart
    └── writer/
        ├── presentation/
        │   ├── write_studio.dart
        │   └── block_editor.dart
        └── providers/
            └── story_creation_provider.dart
```

---

## 2.9. Configuration Redis & BullMQ (Système de Files d'Attente Async)

Pour NestJS, nous définissons l'initialisation des files pour gérer l'asynchronisme métier difficile (expédition de newsletters, génération d'illustrations ou traitement d'envois volumineux).

```typescript
// src/infrastructure/config/bull.config.ts
import { BullModuleOptions, SharedBullConfigurationFactory } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BullConfigService implements SharedBullConfigurationFactory {
  createSharedConfigurationOptions(): BullModuleOptions {
    return {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
      },
    };
  }
}

// src/modules/ai/jobs/ai-generation.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { GoogleGenAI } from '@google/genai';

@Processor('ai-generations')
export class AIGenerationProcessor extends WorkerHost {
  private readonly ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  async process(job: Job<{ prompt: string; type: string }>): Promise<any> {
    const { prompt, type } = job.data;
    
    // Appel sécurisé au SDK Gemini 2.5 Flash
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return {
      success: true,
      result: response.text,
      jobId: job.id,
    };
  }
}
```

---

## 2.10. Configuration de Sécurité & Gardes de Production

Pour s'assurer que l'application NestJS résiste à tous les assauts, un filtre de sécurité HTTP complet et des décorateurs d'interdiction de connexion non autorisée sont fournis.

```typescript
// src/middleware/security.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 1. Appel dynamique de Helmet pour la pose forcée des en-têtes HTTP
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https://s3.amazonaws.com'],
          connectSrc: ["'self'", 'https://api.stilova.com', 'wss://api.stilova.com'],
        },
      },
      crossOriginEmbedderPolicy: true,
      referrerPolicy: { policy: 'same-origin' },
    })(req, res, next);
  }
}

// src/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Injecté en amont via le JWT Guard

    if (!user || !user.roles) {
      throw new ForbiddenException('Accès refusé : Rôles insuffisants.');
    }

    const hasPermission = requiredRoles.some((role) => user.roles.includes(role));
    if (!hasPermission) {
      throw new ForbiddenException('Votre rôle actuel ne vous donne pas accès à cette ressource.');
    }
    return true;
  }
}
```

---

## 2.11. Configuration Multi-Container de Production (Docker)

### A. Dockerfile pour l'application unifiée NestJS Production

```dockerfile
# ##################################################################
# Dockerfile Backend NestJS (Production Build)
# ##################################################################
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "dist/main.js"]
```

### B. Configuration orchestrée locale (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: stilova_postgres
    environment:
      POSTGRES_DB: ${DB_NAME:-stilova_db}
      POSTGRES_USER: ${DB_USER:-stilova_admin}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-stilova_secure_pwd}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U stilova_admin -d stilova_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: stilova_redis
    command: redis-server --requirepass ${REDIS_PASSWORD:-redis_sec_pwd}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: stilova_backend
    environment:
      DATABASE_URL: postgresql://${DB_USER:-stilova_admin}:${DB_PASSWORD:-stilova_secure_pwd}@postgres:5432/${DB_NAME:-stilova_db}?schema=public
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD:-redis_sec_pwd}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

volumes:
  postgres_data:
  redis_data:
```

---

## 2.12. Stratégie de Déploiement Cloud AWS (IAC Terraform & Fargate)

Afin d'héberger la plateforme de façon hautement disponible et sécurisée sur AWS, nous articulons la distribution de nos services comme suit :

1. **Réseau (VPC)** : Un VPC configuré sur deux zones de disponibilité (Availability Zones) à l'intérieur d'une région principale (eu-west-3 ou af-south-1). Comporte 2 sous-réseaux publics (pour les équilibreurs de charge Load Balancer) et 2 sous-réseaux privés (pour l'hébergement des services cloud ECS et Redis).
2. **ECS Fargate** : Notre conteneur applicatif NestJS s'exécute sur ECS Fargate sans gestion de serveurs EC2 sous-jacents, permettant d'adopter des règles de mise à l'échelle automatique (Auto-Scaling) basées sur la charge CPU et Mémoire (seul critique défini à **70%**).
3. **RDS PostgreSQL (Multi-AZ)** : Une instance principale active hébergée dans la zone de disponibilité A qui réplique de manière synchrone toutes les transactions à une base de données en veille dans la zone de disponibilité B en cas de panne critique d'infrastructure.
4. **ElastiCache Redis** : Un cluster managé Redis configuré en mode hautement disponible à répliques multiples pour le stockage de BullMQ et la mise en cache rapide d'entités.
5. **Assets & CDN (CloudFront + S3)** : Tous les avatars et illustrations d'oeuvres volumineuses sont servis via des Buckets S3 cryptés par des clés KMS gérées par AWS et acheminés aux utilisateurs via le répartiteur de contenu à faible latence CloudFront CDN.

---

## 2.13. Stratégie de Couverture de Tests

Afin de garantir l'absence de régression lors des phases d'évolution de la plateforme, les tests automatisés doivent suivre un modèle pyramidal ciblé.

### A. Conception des Tests E2E automatisés (NestJS avec Supertest)
```typescript
// test/auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Authentification (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/register (POST) - Succès Inscription', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'griot.moderne@stilova.com',
        password: 'SecurePassword123!',
        displayName: 'Ousmane Sow',
        signupRole: 'AUTHOR',
        favoriteGenres: ['afrofuturism', 'fantasy']
      })
      .expect(21)
      .then((res) => {
        expect(res.body.user).toBeDefined();
        expect(res.body.user.email).toEqual('griot.moderne@stilova.com');
        expect(res.body.tokens.accessToken).toBeDefined();
      });
  });
});
```

### B. Tests d'Intégration et de Widgets Flutter (Widget Tests)
```dart
// test/onboarding_widget_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:stilova/features/auth/presentation/onboarding_wizard.dart';

void main() {
  testWidgets('L onboarding force le choix de genres et intentions', (WidgetTester tester) async {
    // 1. Initialiser le widget dans un Container Riverpod
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: OnboardingWizard(),
        ),
      ),
    );

    // 2. Vérifier la présence des boutons d intention
    expect(find.text('Je suis ici pour :'), findsOneWidget);
    expect(find.text('Lire'), findsOneWidget);
    expect(find.text('Écrire'), findsOneWidget);

    // 3. Simuler le clic sur "Lire"
    await tester.tap(find.text('Lire'));
    await tester.pumpAndSettle();

    // 4. Avancer l étape et valider les genres favoris
    expect(find.text('Choisir ses genres préférés'), findsOneWidget);
  });
}
```

---
# ##################################################################
# DOCUMENTS VALIDÉS ET PRÊTS POUR EXPÉDITION TECHNIQUE
# ##################################################################

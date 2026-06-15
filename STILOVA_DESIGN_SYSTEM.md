# ##################################################################
# STILOVA - DOCUMENTATION DESIGN SYSTEM, NAVIGATION ET MAQUETTES
# ##################################################################
# Version : 1.0.0
# Équipe Rédactrice : 
#   - Senior Product Designer (UI/Visual Identity)
#   - Senior UX Researcher (User Flows & Site Map)
#   - Senior Mobile UX Designer (Responsive & Interaction)
#   - Senior Flutter UI Engineer (Widget Specs & Implementation)
#   - Accessibility Specialist (WCAG 2.1 AA Compliance)
#   - Conversion Specialist (Conversion Funnels & Micro-interactions)

---

## TABLE DES MATIÈRES

1. **SITEMAP GLOBAL & ARCHITECTURE DE L'INFORMATION**
   - 1.1. Cartographie complète des routes par rôle
   - 1.2. États de transition de navigation
2. **USER FLOWS SYSTÉMIQUES DÉTAILLÉS**
   - 2.1. Inscription progressive & Onboarding (US-01 / 5 étapes)
   - 2.2. Lecture Immersive & Récit Interactif (Interactive Storytelling)
   - 2.3. Rédaction d'une histoire non-linéaire avec Studio IA (Notion-Style)
   - 2.4. Traitement & Résolution d'un Signalement (Modération Backoffice)
3. **NAVIGATION DYNAMIQUE ET SÉCURISÉE PAR RÔLE**
   - 3.1. Structure adaptative de la Bottom Navigation
   - 3.2. Règles d'affichage, permissions et transitions
4. **WIREFRAMES BASSE FIDÉLITÉ (ASCII SCHEMATICS & MACRO-LAYOUTS)**
   - 4.1. Splash Screen & Onboarding (Écran 4)
   - 4.2. Authentification Premium (Étape 3 & 4)
   - 4.3. Dashboard Découvrir (Main Feed)
   - 4.4. Lecteur Immersive Reader (Avec Drawer de personnalisation)
   - 4.5. Éditeur de Blocs Notion-Style (Studio & Sidebars)
   - 4.6. Visualiseur de Graphe d'Histoires Interactives
5. **SPÉCIFICATIONS ESTHÉTIQUES ET DIRECTIVES HAUTE FIDÉLITÉ**
   - 5.1. Atmosphère, contrastes de couleurs et hiérarchie visuelle
   - 5.2. Distribution et poids chromatique (Règle 60-30-10)
6. **DESIGN SYSTEM DÉTAILLÉ (TOKENS DE CONFIGURATION & TAILWIND)**
   - 6.1. Palette de couleurs exactes (Hex, Tailwind configs)
   - 6.2. Échelle Typographique (Cormorant Garamond & Open Sans)
   - 6.3. Spacing, Borders & Drop Shadows
7. **BIBLIOTHÈQUE DE COMPOSANTS RÉUTILISABLES (PROPS & ACCESSIBILITÉ)**
   - 7.1. Composants interactifs globaux (Buttons, TextInputs)
   - 7.2. Cartes thématiques et d'information (Cards)
   - 7.3. Barre de navigation adaptative
8. **ÉTATS D'INTERFACE SYSTÉMIQUES (ESTHÉTIQUE DE L'ATTENTE ET DE L'ÉCHEC)**
   - 8.1. Skeletons de Chargement haut de gamme
   - 8.2. Empty States narratives et engageantes
   - 8.3. Gestionnaires d'erreurs humaines
   - 8.4. Notifications de succès & Micro-interactions
9. **ADAPTABILITÉ RESPONSIVE & COMPORTEMENT DE MISE EN PAGE**
   - 9.1. Grilles fluides & Adaptation Mobile / Tablette / Web
10. **DOCUMENTATION DU WORKSPACE ET TRANSFERT VERS FIGMA**
    - 10.1. Importation des variables, Styles locaux, Auto-layouts & Symboles

---

# 1. SITEMAP GLOBAL & ARCHITECTURE DE L'INFORMATION

### 1.1. Cartographie complète des routes par rôle

Afin de garantir une clarté optimale et une étanchéité absolue des permissions au sein de Stilova, l'architecture de navigation est segmentée de manière hiérarchique :

```
[STILOVA ROOT SITE]
 ├── (Visiteur Non Connecté / Public)
 │    ├── /splash-screen (2s, Logo, Slogan, Transition)
 │    ├── /onboarding (Carrousels 1-4, Message, CTA)
 │    ├── /auth (Connexion & Inscription multi-étapes 1-5)
 │    ├── /discover (Hero Banner, Populaires, Nouveautés, Univers, Concours, Auteurs)
 │    ├── /search (Recherche unifiée avec filtres avancés)
 │    └── /story/:id (Fiche d'œuvre publique, résumés, commentaires)
 │
 ├── (Lecteur Connecté - DROITS SYSTEM: READER)
 │    ├── /library (En cours, À lire, Terminées, Favoris, Hors-ligne)
 │    ├── /reader/:storyId/:chapterId (Lecteur immersif plein écran, Note pad, Signets)
 │    ├── /user-profile/:username (Avatar, Bannière, Badges, Œuvres, Activité)
 │    ├── /notifications (Groupées par type: commentaires, abonnés, concours, système)
 │    ├── /settings (Compte, Sécurité, Confidentialité, Préférences Notifications)
 │    ├── /contests (Concours actifs, Règles, Participants, Soumissions)
 │    └── /comments/:storyId/:chapterId (Gestionnaire de réponses, likes, signalements)
 │
 ├── (Auteur Créateur - DROITS SYSTEM: AUTHOR)
 │    ├── /author-dashboard (Vues, Lecteurs, Abonnés, Revenus, Actions Rapides)
 │    ├── /editor/:storyId (Notion-Style vertical block editor, IA sidebar, chapitres, graphe interactif)
 │    └── /editor/:storyId/graph (Graphe d'embranchements non-linéaire, zoom, drag-and-drop)
 │
 ├── (Modérateur Éditorial - DROITS SYSTEM: MODERATOR)
 │    └── /moderation (Queue des signalements, priorités, actions conservatoires)
 │
 └── (Administrateurs - DROITS SYSTEM: ADMIN / SUPER_ADMIN)
      ├── /admin-dashboard (KPIs Stripe, Gestion Utilisateurs, Concours Management)
      └── /system-health (Super Admin: Quotas LLM, monitoring clés API, logs système)
```

### 1.2. États de transition de navigation

La navigation ne doit pas simplement charger des pages ; elle doit respecter la psychologie cognitive de l'utilisateur. Chaque rôle dispose d'un point d'ancrage spécifique au démarrage :
- **Visitor** -> Redirigé vers `/splash-screen` puis `/onboarding` au premier lancement du conteneur client.
- **Reader / Author** -> Redirigé instantanément vers `/discover` ou `/author-dashboard` si le token d'authentification valide est présent dans les cookies sécurisés ou le LocalStorage persistant.
- **Moderator / Admin** -> Redirigés directement vers `/moderation` ou `/admin-dashboard` pour optimiser l'efficacité de leurs workflows d'action.

Le routeur global utilise un **Slide-In horizontal** pour les transitions d'écrans linéaires, et un **Fade-In flouté (blur transition de 200ms)** lors du passage d'un mode de lecture à un mode d'édition.

---

# 2. USER FLOWS SYSTÉMIQUES DÉTAILLÉS

### 2.1. Inscription progressive & Onboarding (US-01 / 5 étapes)

```
[VISITEUR] ──> Onboarding (4 Écrans) ──> Écran 4: [Commence ton aventure]
                                                    │
    ┌───────────────────────────────────────────────┘
    ▼
[AUTHENTIFICATION]
 ├── Choix option : OAuth (Google, Apple) ou Email/Password ──> [Étape 1]
 └── Formulaire Email/Password :
      ├── Saisie Email + Saisie Mot de passe ──────────────────> [Étape 2]
      │    ├── Validation instantanée (Force Indicator Check)
      │    └── Erreurs contextuelles si conditions non remplies
      ▼
   Sélection d'Intention : [Lire], [Écrire], [Les deux] ───────> [Étape 3]
      ▼
   Sélection Genres Littéraires (Multiselect - Min 3) ────────> [Étape 4]
      ▼
   Dashboard personnalisé d'accueil chargé avec succès ───────> [Étape 5]
```

### 2.2. Lecture Immersive & Récit Interactif (Interactive Storytelling)

```
[LECTEUR] ──> Fiche Histoire ──> Clic [Lire le Chapitre 1]
                                       │
    ┌──────────────────────────────────┘
    ▼
[LECTEUR IMMERSIF ACTIF]
 ├── Double-Tap au centre : Masque / Affiche les barres d'outils (Full IMMERSIVE)
 ├── Clic Icône [A_A_Settings] ──> Ouvre Drawer de confort de lecture :
 │    ├── Choix Thème : Crème (#F8F5F0), Sombre (#0F172A), Pur Blanc (#FFFFFF)
 │    └── Réglage : Police (Serif/Sans), Taille (12-24px), Interligne (1.5-2.0)
 ├── Défilement vertical (Scroll-Bound Indicators) ──> Suivi de progression en %
 │
 ├── ACTIONS DE MISE EN RELIEF :
 │    ├── Sélection de texte ──> Popover contextuel: [Surligner] [Prendre Note] [Partager]
 │    └── Bouton [Bookmark] ──> Enregistrement du signet asynchrone sécurisé
 │
 └── SI HISTOIRE INTERACTIVE (Chapitre de fin) :
      ├── Défilement s'arrête sur une section structurée en blocs de choix :
      │    ├── Option A : [Franchir la porte de fer] ──> Charge Chapitre 34
      │    └── Option B : [S'enfuir par les toits]  ──> Charge Chapitre 35
      └── Redirection animée fluide avec loader de transition élégant
```

### 2.3. Rédaction d'une histoire non-linéaire avec Studio IA (Notion-Style)

```
[AUTEUR] ──> Clic [Écrire] ──> Ouvre Studio / Éditeur de Blocs Notion-Style
                                   │
         ┌─────────────────────────┴──────────────────────────────┐
         ▼                                                        ▼
[ZONE DE SYNTHÈSE / ÉCRITURE LITTÉRAIRE]                [BARRE DE COMMANDE IA]
 ├── Création de blocs : Saisie "/"                      ├── Clic [Bulle Assistant IA]
 │    ├── Paragraphe standard                             ├── Actions contextuelles :
 │    ├── Titre d'histoire / Chapitre                     │    ├── [Corriger orthographe/style]
 │    ├── Citation / Dialogue stylisé                     │    ├── [Générer Synopsis]
 │    ├── Illustration IA                                 │    ├── [Générer fiches personnages]
 │    └── Choix interactif pour embranchement            │    └── [Générer Illustration]
 ├── Drag and Drop des blocs (Réordonnancement)           │         └── Saisie prompt ──> Gemini
 └── Auto-save asynchrone toutes les 2 secondes           └── Résulat injecté instantanément
```

### 2.4. Traitement & Résolution d'un Signalement (Modération Backoffice)

```
[MODÉRATEUR / ADMIN] ──> Ouvre l'espace de Modération ──> Charge la file asynchrone
                                                               │
     ┌─────────────────────────────────────────────────────────┘
     ▼
[FILTRE PAR PRIORITÉ ET COMPORTEMENT] Sévérité : [Élevée], [Moyenne], [Basse]
 ├── Sélection d'un signalement d'histoire de plagiat
 ├── Visualisation comparative de l'extrait incriminé vs. la plainte
 ├── Actions réglementaires de modération à un clic :
 │    ├── [Avertir l'Auteur] ──> Auto-génère un modèle d'avertissement structuré
 │    ├── [Masquer temporairement] ──> Flag l'histoire `is_hidden = true`
 │    └── [Supprimer l'Œuvre] ──> Soft delete du chapitre `is_deleted = true`
 └── Log instantané de l'action dans le Journal d'Audit Système
```

---

# 3. NAVIGATION DYNAMIQUE ET SÉCURISÉE PAR RÔLE

### 3.1. Structure adaptative de la Bottom Navigation

La navigation basse de la version mobile / tablette n'est jamais figée. Elle interroge dynamiquement le rôle actif de l'utilisateur au store d'authentification pour n'afficher que les modules autorisés pour lesquels l'utilisateur possède des habilitations valides, évitant ainsi la surcharge visuelle.

| Rôle Utilisateur | Onglet 1 | Onglet 2 | Onglet 3 | Onglet 4 | Onglet 5 | Onglet Supplémentaire |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **VISITOR** | Découvrir | Concours | Connexion | - | - | - |
| **READER** | Découvrir | Bibliothèque | Notifications | Profil | - | - |
| **AUTHOR** | Découvrir | Bibliothèque | Écrire | Notifications | Profil | - |
| **MODERATOR** | Découvrir | Bibliothèque | Écrire | Modération | Notifications | Profil |
| **ADMIN** | Découvrir | Écrire | Modération | Administration | Profil | - |
| **SUPER_ADMIN** | Administration | Système | Profil | - | - | - |

### 3.2. Règles d'affichage, permissions et transitions

- **Changement de Rôle à la Volée :** Si un `READER` bascule en mode `AUTHOR` par la création de son premier brouillon, la navigation basse se recharge en 150ms avec un effet de fondu et de mise à l'échelle (Scale) pour insérer l'icône de l'éditeur : **"Écrire" (icône une Plume / Feather)**.
- **Sécurisation par Guards :** Tenter de naviguer par URL vers `/admin-dashboard` ou `/moderation` en tant que `READER` déclenche un écran de d'erreur cognitive polie (403 Accès Refusé) avec une illustration exclusive, suivie d'une redirection automatique vers `/discover` au bout de 3 secondes.
- **État Actif Indolore :** L'icône de l'onglet actif est vêtue d'une couleur d'accentuation exclusive (**Or Ancien #D4A017**), entourée d'un micro-halo lumineux progressif en fondu, tandis que les autres icônes conservent leur teinte unie neutre (**#94A3B8**).

---

# 4. WIREFRAMES BASSE FIDÉLITÉ (ASCII SCHEMATICS & MACRO-LAYOUTS)

Afin de visualiser précisément l'agencement sans distraction esthétique, voici les blueprints complets structurés à l'aide d'ASCII Art précis.

### 4.1. Splash Screen & Onboarding (Écran 4)

Conçu pour maximiser la rétention utilisateur immédiate sur mobile (viewport vertical 9:16).

```
+───────────────────────────────────────────────────────+
| [STILOVA LOGO - Elegant Monogram SVG]                  |
|                                                       |
|                                                       |
|                     * * * * *                         |
|                   *           *                       |
|                 *   ILLUSTRATION   *                  |
|                *   IMMERSIVE NOIR   *                 |
|                 *   ET OR PREMIUM   *                 |
|                   *  (Griot d'Or) *                   |
|                     * * * * *                         |
|                                                       |
|                                                       |
|               COMMENCE TON AVENTURE                   |
|  Rejoins le cercle mondial des griots modernes et     |
|   découvre des histoires interactives inoubliables.   |
|                                                       |
|         [ ○     ○     ○     ● (Écran 4/4) ]           |
|                                                       |
|  +─────────────────────────────────────────────────+  |
|  |           COMMENCER L'AVENTURE (CTA)            |  |
|  +─────────────────────────────────────────────────+  |
|                                                       |
|  Déjà inscrit ?  Se connecter                          |
+───────────────────────────────────────────────────────+
```

### 4.2. Authentification Premium (Étape 3 & 4)

L'expérience d'inscription premium scindée en étapes pour éviter la surcharge mentale.

```
+───────────────────────────────────────────────────────+
| STILOVA                  [ Étape 3 de 5  ■■■□□ ]      |
|                                                       |
|             DE QUOI AVEZ-VOUS ENVIE SOUDAIN ?         |
|         Choisissez votre vocation sur la plateforme   |
|                                                       |
|  +─────────────────────────────────────────────────+  |
|  | [Icon: BookOpen]  LIRE UNIQUEMENT               |  |
|  | Récits immersifs, chroniques, afrofuturisme...  |  |
|  +─────────────────────────────────────────────────+  |
|                                                       |
|  +─────────────────────────────────────────────────+  |
|  | [Icon: PenTool]   ÉCRIRE UNIQUEMENT              |  |
|  | Studio d'écriture de pointe, IA, concours...    |  |
|  +─────────────────────────────────────────────────+  |
|                                                       |
|  +─────────────────────────────────────────────────+  |
|  | [Icon: HighLight] LES DEUX                       |  |
|  | Expérience hybride complète Stilova Premium...    |  |
|  +─────────────────────────────────────────────────+  |
|                                                       |
|  [ ÉTAPE SUIVANTE ]                                  |
+───────────────────────────────────────────────────────+
```

```
+───────────────────────────────────────────────────────+
| STILOVA                  [ Étape 4 de 5  ■■■■□ ]      |
|                                                       |
|              VOS UNIVERS ET GENRES PRÉFÉRÉS           |
|            Sélectionnez au moins 3 genres             |
|                                                       |
|   [x] Afrofuturisme (Or)      [ ] Romance             |
|   [x] Fantasy Mythique (Or)   [x] Thriller Noir (Or)  |
|   [ ] Chroniques Urbaines     [ ] Poésie Moderne      |
|   [ ] Non-Fiction / Essais    [ ] Récit Historique    |
|   [x] Science-Fiction (Or)    [ ] Jeunesse / Contes   |
|                                                       |
|  +─────────────────────────────────────────────────+  |
|  |     [ Icon: Star ] CRÉER MON PROFIL (CTA)       |  |
|  +─────────────────────────────────────────────────+  |
|                                                       |
|  [ Étape Précédente : Modifier l'intention ]          |
+───────────────────────────────────────────────────────+
```

### 4.3. Dashboard Découvrir (Main Feed)

La vitrine principale de lecture de Stilova.

```
+───────────────────────────────────────────────────────+
| [STILOVA Monogram]          [Recherche]   [Notification]
+───────────────────────────────────────────────────────+
|                                                       |
|  +─────────────────────────────────────────────────+  |
|  |             * HERO BANNER ACTIF *               |  |
|  |            "LES OMBRES DE KOUROUMAN"            |  |
|  |  [ Genre: Afrofuturisme ] [ Signet: Chapitre 3 ] |  |
|  |                                                 |  |
|  |  +─────────────────+    +────────────────────+  |  |
|  |  | LIRE LE RÉCIT   |    | AJOUT BIBLIOTHÈQUE |  |  |
|  |  +─────────────────+    +────────────────────+  |  |
|  +─────────────────────────────────────────────────+  |
|                                                       |
|  CONTINUER LA LECTURE (Progress Track)                 |
|  [████████░░░░░░ 60%] "La Sororité du Sphinx" Chap.4  |
|                                                       |
|  HISTOIRES POPULAIRES (Carousel Horizontal)            |
|  +───────────+ +───────────+ +───────────+ +────────+ |
|  | Kounandi  | | Les Rois  | | La Cité   | | Choro  | |
|  | Plumes: 5 | | Plumes: 4 | | Plumes: 5 | | Plu: 4 | |
|  +───────────+ +───────────+ +───────────+ +────────+ |
|                                                       |
|  CONCOURS ACTIF : LE TROPHÉE DES GRIOTS 2026           |
|  [ Récompense : 5,000,000 FCFA | Clôture: 12 Jours ]| |
|                                                       |
+───────────────────────────────────────────────────────+
|  [Découvrir]   [Bibliothèque]   [Écrire]    [Profil]  |
+───────────────────────────────────────────────────────+
```

### 4.4. Lecteur Immersive Reader (Avec Drawer de personnalisation)

L'écran le plus important au cœur de toute l'expérience de fidélisation de l'utilisateur.

```
+───────────────────────────────────────────────────────+
| [<- Back]    "L'Envol du Phoenix" Chap. 24    [Bookmark]|
+───────────────────────────────────────────────────────+
|                                                       |
|  "C'était à la tombée de la nuit que les tambours de   |
|  Kourouman se sont tus. Une lourde brume de saphir    |
|  s'est alors répandue à travers la vallée..."         |
|                                                       |
|  "Kofi s'approcha lentement du précipice, sentant l'or|
|  sacré s'échauffer dans sa propre paume droite. Il    |
|  savait que la décision de ce soir changerait..."     |
|                                                       |
|  "Allait-il accomplir le rituel interdit ou s'enfuir  |
|  avec Amara vers les cités flottantes de l'Est ?"     |
|                                                       |
|  ...................................................  |
|                                                       |
|  [ PROSPECTS INTERACTIFS : FAITES VOTRE CHOIX ]        |
|  +─────────────────────────────────────────────────+  |
|  |  - Option A: Accomplir le rituel (Chapitre 25)   |  |
|  +─────────────────────────────────────────────────+  |
|  |  - Option B: S'enfuir avec Amara (Chapitre 26)   |  |
|  +─────────────────────────────────────────────────+  |
|                                                       |
|  +─────────────────────────────────────────────────+  |
|  | DRAWER PARAMÈTRES DE CONTEXTE LECTURE (ACTIF)    |  |
|  |                                                 |  |
|  | Thème:  (o) Ivoire [#F8F5F0]  ( ) Nuit [#0F172A] |  |
|  | Police: (o) Cormorant Garamond  ( ) Open Sans    |  |
|  | Taille: [-]  18px  [+]   Interligne: [ 1.6 ]    |  |
|  +─────────────────────────────────────────────────+  |
|                                                       |
|  [ Temps restant estimé: 4 min | Progression: 84% ]   |
+───────────────────────────────────────────────────────+
```

### 4.5. Éditeur de Blocs Notion-Style (Studio & Sidebars)

Destiné à un écran d'ordinateur (Web Desktop Layout). Disposition responsive à 3 colonnes.

```
+───────────────────────────────────────────────────────────────────────────────────────────+
| [STILOVA STUDIO]  Histoires > "L'Étoile du Sahel" > Chapitre 4 : La Transe                |
+───────────────────────────────────────────────────────────────────────────────────────────+
| SIDEBAR CONTENU CHAPITRES | ZONE D'ÉCRITURE PRINCIPALE CENTRAL (Notion) | CONSOLE AUXILIAIRE IA |
|                           |                                             |                       |
| [+] Ajouter un Chapitre   | # Chapitre 4 : La Transe                    | [ AI ASSISTANT LITE ] |
|                           |                                             |                       |
|   - Chap. 1 : L'Origine   | C'était lors du solstice d'été que la sage  | [!] Action Requise:    |
|   - Chap. 2 : La Menace   | de l'univers prit sa plume sacrée...       | Analysez le style de  |
|   - Chap. 3 : L'Exil      |                                             | ce chapitre.          |
|  [x] Chap. 4 : La Transe  | [@] Appeler l'IA pour générer une image...  |                       |
|                           |                                             | [Button: Résumer]     |
| [Visualiser le Graphe]    | +─────────────────────────────────────────+ | [Button: Corriger]    |
|                           | | BLOC ILLUSTRATION IA INTERACTIF         | | [Button: Suggérer]    |
| - Univers & Personnages   | | Prompt: "Un griot d'or au clair de lune"| |                       |
| - Paramètres d'histoire   | |                                         | | [PROMPT ILLUSTRATEUR]|
|                           | | [Image Générée : Griot Lumineux]        | | "Un masque dogon en  |
|                           | +─────────────────────────────────────────+ |  cristal émeraude..." |
|                           |                                             |                       |
|                           | Saisissez suite du récit ici (Type '/' )... | [Générer l'Image]     |
+───────────────────────────────────────────────────────────────────────────────────────────+
```

### 4.6. Visualiseur de Graphe d'Histoires Interactives

```
+───────────────────────────────────────────────────────────────────────────────────────────+
| [<- Back to Editor]            [ MOTEUR D'INTERACTION GRAPH ]            [Zoom +][Zoom -][Reset]|
+───────────────────────────────────────────────────────────────────────────────────────────+
|                                                                                           |
|          +───────────────────+                                                            |
|          |    Chapitre 1     |  (Racine de l'Histoire)                                    |
|          |   "Introduction"  |                                                            |
|          +─────────┬─────────+                                                            |
|                    │                                                                      |
|          ┌─────────┴─────────┐                                                            |
|          ▼                   ▼                                                            |
|  +───────────────+   +───────────────+                                                    |
|  |  Chapitre 2A  |   |  Chapitre 2B  |                                                    |
|  | "La Cité d'Or"|   | "La Forêt..." |                                                    |
|  +───────┬───────+   +───────┬───────+                                                    |
|          │                   │                                                            |
|    ┌─────┴─────┐             ├──────────────────────┐                                     |
|    ▼           ▼             ▼                      ▼                                     |
|  +───────+   +───────+   +───────+              +───────+                                 |
|  | Chap3A|   | Chap3B|   | Chap3C|              | Fin   |  (Fin de l'œuvre s'il y a mort   |
|  | "Sacre"|  | "Mort"|   | "Fuite"|             | "Trép"|   ou abandon du voyageur)        |
|  +───────+   +───────+   +───────+              +───────+                                 |
|                                                                                           |
+───────────────────────────────────────────────────────────────────────────────────────────+
```

---

# 5. SPÉCIFICATIONS ESTHÉTIQUES ET DIRECTIVES HAUTE FIDÉLITÉ

### 5.1. Atmosphère, contrastes de couleurs et hiérarchie visuelle

Pour que Stilova soit instantanément reconnue comme une application d'exception, nous évitons les ombres portées standard de la feuille de style Tailwind CSS de base et installons notre propre grammaire de contraste visuel basé sur un **noir d'Afrique profond texturé de nuances bleues (#0F172A)** contrasté par des accents de **métal poli brillant (Or Ancien #D4A017)**.

- **Atmosphère Générale :** Mystique, prestigieuse, ancrée et hautement lisible.
- **Micro-textures :** Utilisation d'un dégradé radial très subtil s'étendant à partir du coin supérieur gauche de l'écran pour casser l'uniformité du fond sombre. Un léger bruit texturé (0.02 d'opacité) donne aux écrans l'aspect organique du papyrus ou de la toile brute de reliure.
- **Angles des Fenêtres :** Arrondi raffiné de **12px (`rounded-xl`)** pour les cartes d'œuvres, et de **24px (`rounded-3xl`)** pour les boutons d'appel à l'action principaux, évoquant la fluidité de la sculpture traditionnelle d'Afrique de l'Ouest.

### 5.2. Distribution et poids chromatique (Règle 60-30-10)

L'équilibre visuel est régi par les quotas chromatiques suivants pour éviter de perturber la lisibilité :

- **60% (Fond dominant) - Bleu Nuit de Kourouman (`#0F172A`) :** Il garantit l'immersion, atténue la fatigue oculaire lors des sessions nocturnes et procure un sentiment de sécurité et d'exclusivité.
- **30% (Éléments secondaires / Contenus de texte structurels) - Ivoire Cendré / Gris Zinc (`#F8F5F0` / `#94A3B8`) :** Offre un contraste optimal de **7.4:1** (dépassant largement les critères WCAG AA standard de `4.5:1` pour le texte classique).
- **10% (Accents énergiques) - L'Or de l'Empire de Mali (`#D4A017`) :** Concentre le regard sur les opportunités de conversion premium, la complétion d'un chapitre, l'interaction IA réussie ou les notifications indispensables de la communauté.

---

# 6. DESIGN SYSTEM DÉTAILLÉ (TOKENS DE CONFIGURATION & TAILWIND)

### 6.1. Palette de couleurs exactes (Hex, Tailwind configs)

Voici la syntaxe exacte de déclaration de la palette au sein du moteur Tailwind CSS config de production :

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        stilova: {
          midnight: '#0F172A',      // Fond ténébreux immersif primé
          gold: '#D4A017',          // Or Ancien précieux pour le branding et les boutons CTA
          ivory: '#F8F5F0',         // Ivoire littéraire doux pour le confort de lecture
          emerald: '#10B981',       // Vert Émeraude pour les retours positifs et validations
          coral: '#F97360',         // Corail d'alerte pour les signalements et erreurs
          zincDark: '#1E293B',      // Version intermédiaire de fond pour les cartes et sidebars
          zincSoft: '#94A3B8',      // Teinte neutre textuelle pour les descriptions secondaires
          pureWhite: '#FFFFFF',     // Blanc d'impact
        }
      }
    }
  }
}
```

### 6.2. Échelle Typographique (Cormorant Garamond & Open Sans)

Pour concilier l'esthétique littéraire classique d'une maison d'édition et la modernité technique d'une application d'exception :

- **Titres, En-têtes, Noms d'Œuvres & Devises :** **Cormorant Garamond**, police Serif de grande élégance, caractérisée par des contrastes de déliés magnifiques.
- **Texte de lecture long, Corps de message & Contenu mobile :** **Open Sans**, police Sans-Serif pour préserver l'agilité oculaire.
- **Bouton, Labels & Puces :** **Open Sans SemiBold**, pour affirmer l'intention de clic.

```css
/* Déclaration CSS de notre hiérarchie typographique dans src/index.css */
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Open+Sans:wght@400;500;600;700&display=swap');

.font-stilova-serif {
  font-family: 'Cormorant Garamond', Georgia, serif;
}

.font-stilova-sans {
  font-family: 'Open Sans', system-ui, -apple-system, sans-serif;
}
```

Échelles d'application et hauteur de lignes :
- **Display Heading 1 (Écran Splash/Auth Titles) :** Cormorant Garamond / Bold / `text-5xl` / line-height: `leading-tight` (3.25rem) / Tracking: `tracking-tight`.
- **Heading 2 (Titre Histoires, Fiches) :** Cormorant Garamond / SemiBold / `text-3xl` / line-height: `leading-snug` (2.25rem).
- **Body Text Reader (Page Lecteur Immersif) :** Open Sans / Regular / `text-lg` (1.125rem) / line-height: `leading-relaxed` (1.75 - 1.85 selon réglage).
- **Secondary Caption (Fiches de données, Badges) :** Open Sans / Medium / `text-xs` / line-height: `leading-normal` / Color: `text-stilova-zincSoft`.

### 6.3. Spacing, Borders & Drop Shadows

Pour préserver de l'espace de respiration (Aesthetic Negative Space) afin que l'histoire reste intelligible :

- **Marges intérieures par défaut des fenêtres :** `p-6` (24px) sur mobile, `p-10` (40px) ou `p-12` (48px) sur tablette et desktop.
- **Bordures par défaut :** `border border-stilova-zincDark/50` pour donner un effet biseauté très léger sans alourdir le tracé.
- **Ombres de profondeur :** `shadow-hover-gold` (Ombre diffuse exclusive d'or pour le focus interactif Premium) :
  `box-shadow: 0 10px 30px -10px rgba(212, 160, 23, 0.15);`

---

# 7. BIBLIOTHÈQUE DE COMPOSANTS RÉUTILISABLES (PROPS & ACCESSIBILITÉ)

### 7.1. Composants interactifs globaux (Buttons, TextInputs)

#### Composant : `PrimaryButton`
- **Rôle :** Bouton d'action principal de conversion premium.
- **Tailwind Recipe :** `bg-stilova-gold hover:bg-stilova-gold/90 text-stilova-midnight font-stilova-sans font-semibold py-3 px-6 rounded-3xl transition-all duration-200 transform active:scale-95 shadow-lg shadow-stilova-gold/10 hover:shadow-stilova-gold/20 focus:outline-none focus:ring-2 focus:ring-stilova-gold focus:ring-offset-2 focus:ring-offset-stilova-midnight`
- **Props (TypeScript Type) :**
  ```typescript
  interface PrimaryButtonProps {
    id: string;               // Obligatoire pour l'identification de ciblage d'élément unique (directives HTML ID)
    label: string;            // Texte du bouton
    onClick: () => void;      // Callback interactif
    isDisabled?: boolean;     // État inactif
    icon?: React.ReactNode;   // Icône optionnelle issue de Lucide React
  }
  ```
- **Accessibilité (WCAG) :** Attribut `aria-label={label}`, `aria-disabled={isDisabled}`, support de la gestion d'activation via la touche `Enter` ou `SpaceBar` par capture clavier.

#### Composant : `SecondaryButton`
- **Rôle :** Action secondaire ou retour d'étape.
- **Tailwind Recipe :** `border-2 border-stilova-gold text-stilova-gold hover:bg-stilova-gold hover:text-stilova-midnight font-stilova-sans font-semibold py-3 px-6 rounded-3xl transition-all duration-200 focus:outline-none`
- **Props (TypeScript Type) :** Same as `PrimaryButtonProps`.

#### Composant : `TextInput`
- **Rôle :** Recueillir la donnée avec des validations immédiates intuitives.
- **Tailwind Recipe (États dynamiques) :**
  - *Vide/Neutre :* `bg-stilova-zincDark border border-stilova-zincSoft/30 text-stilova-ivory focus:border-stilova-gold`
  - *Focus stable :* `focus:ring-1 focus:ring-stilova-gold border-stilova-gold`
  - *Erreur détectée :* `border-stilova-coral focus:ring-1 focus:ring-stilova-coral text-stilova-coral/90`
  - *Succès validé :* `border-stilova-emerald focus:ring-1 focus:ring-stilova-emerald`
- **Props (TypeScript Type) :**
  ```typescript
  interface TextInputProps {
    id: string;
    label: string;
    placeholder: string;
    value: string;
    onChange: (val: string) => void;
    type?: 'text' | 'email' | 'password';
    error?: string;           // Message d'erreur personnalisé à afficher sous le champ
    isSuccess?: boolean;      // Vert de réussite immédiat
    helperText?: string;      // Ex : Règles de sécurité mot de passe
  }
  ```
- **Accessibilité (WCAG) :** Lier le label dynamiquement avec le champ d'écriture via `htmlFor={id}`. Lien vers l'erreur avec `aria-describedby={`${id}-error`}` pour les logiciels de lecture vocale.

### 7.2. Cartes thématiques et d'information (Cards)

#### Composant : `StoryCard`
- **Rôle :** Affiche une histoire en grille ou carrousel.
- **Tailwind Recipe :** `bg-stilova-zincDark rounded-xl overflow-hidden hover:shadow-hover-gold transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border border-stilova-zincSoft/10`
- **Props :**
  ```typescript
  interface StoryCardProps {
    id: string;
    title: string;
    authorName: string;
    coverImageUrl: string;
    completionPercentage?: number; // Pour la section "Continuer à lire"
    plumeCount: number;            // Score d'évaluation (1-5)
    isInteractive: boolean;        // Badge or distinctif si histoire à choix multiples
  }
  ```

#### Composant : `AuthorCard`
- **Rôle :** Suggestions d'écrivains avec micro-aperçu de leur univers de création.
- **Tailwind Recipe :** `bg-stilova-zincDark/40 border border-stilova-zincSoft/5 p-4 rounded-xl flex items-center gap-4 hover:bg-stilova-zincDark transition-all`
- **Props :**
  ```typescript
  interface AuthorCardProps {
    id: string;
    userName: string;
    avatarUrl: string;
    biography: string;
    followerCount: number;
    onFollowClick: () => void;
  }
  ```

#### Composant : `ContestCard`
- **Rôle :** Cartes d'impact du ralliement littéraire.
- **Tailwind Recipe :** `relative overflow-hidden bg-gradient-to-br from-stilova-midnight to-stilova-zincDark border border-stilova-gold/35 rounded-xl p-6 shadow-md`
- **Props :**
  ```typescript
  interface ContestCardProps {
    id: string;
    title: string;
    description: string;
    rewardLabel: string; // Ex: "5,000,000 FCFA + Édition"
    remainingDays: number;
    participantCount: number;
  }
  ```

#### Composant : `UniverseCard`
- **Rôle :** Représente les mondes romanesques construits par les auteurs.
- **Tailwind Recipe :** `relative h-40 rounded-xl overflow-hidden cursor-pointer group border border-stilova-zincSoft/20`
- **Props :**
  ```typescript
  interface UniverseCardProps {
    id: string;
    name: string;
    backgroundStyleUrl: string;
    storiesIncludedCount: number;
  }
  ```

#### Composant : `BadgeCard`
- **Rôle :** Récompenses issues de l'onboarding et des jalons de gamification.
- **Tailwind Recipe :** `flex flex-col items-center justify-center p-4 bg-stilova-zincDark rounded-xl border border-stilova-gold/10 hover:border-stilova-gold/40 transition-colors`
- **Props :**
  ```typescript
  interface BadgeCardProps {
    id: string;
    badgeName: string;
    iconSvgPath: string;
    unlockedDate?: string; // Si indéfini, affiché en nuance de gris à 50% d'opacité (bloqué)
  }
  ```

### 7.3. Barre de navigation adaptative

#### Composant : `BottomNavigation`
- **Tailwind Recipe :** `fixed bottom-0 left-0 right-0 h-16 bg-stilova-midnight/95 backdrop-blur-md border-t border-stilova-zincDark/80 flex justify-around items-center z-50`
- **Props :**
  ```typescript
  interface BottomNavigationProps {
    id: string;
    activeTabId: string;
    tabs: Array<{ id: string; label: string; icon: React.ReactNode }>;
    onTabSelect: (tabId: string) => void;
  }
  ```

---

# 8. ÉTATS D'INTERFACE SYSTÉMIQUES (ESTHÉTIQUE DE L'ATTENTE ET DE L'ÉCHEC)

### 8.1. Skeletons de Chargement haut de gamme

Ne jamais laisser l'utilisateur face à un indicateur circulaire "Progress Indicator" blanc uniforme déshumanisé. Nous privilégions les **Skeletons d'Inspiration Shimmer** :

- **Effet Visuel :** Des plaques géométriques grises (`bg-stilova-zincDark`) parcourues de gauche à droite par un reflet biseauté translucide animé par un flux cyclique lent de **1.8 secondes**.

```css
/* src/index.css - CSS de l'animation de chargement Shimmer */
@keyframes shimmerPulse {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.animate-shimmer {
  position: relative;
  overflow: hidden;
}

.animate-shimmer::after {
  content: '';
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  background: linear-gradient(90deg, transparent, rgba(212, 160, 23, 0.04), transparent);
  animation: shimmerPulse 1.8s infinite linear;
}
```

### 8.2. Empty States narratives et engageantes

Si la bibliothèque de lecture d'une sous-section est vierge de tout signet ou si aucun auteur n'est suivi, nous tirons profit de l'occasion pour narrer une invitation :

```
+─────────────────────────────────────────────────────────+
|                  [ Icon: Quill / Plume ]                |
|                    (Gris Soft d'or)                     |
|                                                         |
|               VOTRE GRANGER EST POUR L'INSTANT VIDE     |
|   La créativité n'attend que d'être récoltée. Rejoignez  |
|    le feed Découvrir pour cueillir vos premiers mystères.|
|                                                         |
|         +─────────────────────────────────────+         |
|         |    PARCOURIR LES HISTOIRES (CTA)    |         |
|         +─────────────────────────────────────+         |
+─────────────────────────────────────────────────────────+
```

### 8.3. Gestionnaires d'erreurs humaines

Si une erreur d'authentification ou d'interconnexion réseau de base surgit, nous délivrons un message rassurant et constructif :

- **Interdit :** *"Error 422: Unprocessable Entity"* ou *"Network Timeout"*.
- **Recommandé :** *"Les esprits du réseau vacillent momentanément. L'histoire n'a pas pu être chargée. Vérifiez votre liaison céleste de données."* suivi d'un bouton d'action de rafraîchissement réparateur ciblé : **[REESSAYER] (Icône de recyclage réactif)**.

### 8.4. Notifications de succès & Micro-interactions

- **Validation d'étape d'Onboarding / Soumission de chapitre :** Un toast discret apparaît en haut à droite avec une icône de coche entourée d'un filet **Vert Émeraude (#10B981)**. L'opacité passe de 0 à 100 en 100ms avec une légère impulsion physique élastique (spring-effect).

---

# 9. ADAPTABILITÉ RESPONSIVE & COMPORTEMENT DE MISE EN PAGE

Pour que Stilova soit une référence absolue sur l'ensemble des écrans sans déformer ses ratios d'or esthétiques :

### 9.1. Grilles fluides & Adaptation Mobile / Tablette / Web

#### 1. Mobile (Viewport < 640px) - Priorité Absolue
- **Layout :** Monocolonne intégrale pour les listes.
- **Saisie :** Marges d'écran compactes, touch targets de **44x44px minimum** pour toutes les icônes interactives.
- **Composant de Navigation :** Bottom Navigation dynamique exclusive à 4 ou 5 onglets.

#### 2. Tablette (640px <= Viewport < 1024px)
- **Layout :** Grille à 2 ou 3 colonnes pour la présentation des fiches d'œuvres (`StoryCard`).
- **Sidebar d'éditeur :** Devient un tiroir rétractable (Drawer) pour concentrer l'écriture sur l'écran tactile sans gêner les pouces.
- **Fiche Technique :** La jaquette de lecture s'agrandit pour occuper 40% de la largeur totale, le résumé se glisse à ses côtés de manière équilibrée.

#### 3. Web Desktop (Viewport >= 1024px)
- **Layout :** Grille bento élargie (Grilles fluides max-largeur 1280px).
- **Navigation :** La barre de navigation basse disparaît au profit d'un menu latéral permanent élégant à gauche (Sidebar), vêtu d'acier poli noir avec une typographie épurée Cormorant Garamond.
- **Éditeur de Blocs :** Mode triple colonne complet (Fichiers & Versions à gauche, écriture au milieu, assistant IA et inspecteur de propriétés à droite).

---

# 10. DOCUMENTATION DU WORKSPACE ET TRANSFERT VERS FIGMA

Pour permettre à toute équipe graphique d'importer et d'activer instantanément ce Design System complet dans le logiciel de maquettage Figma :

### 10.1. Importation des variables, Styles locaux, Auto-layouts & Symboles

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DIRECTIVES D'IMPORT FIGMA                       │
└────────────────────────────────────────────────────────────────────────┘

1. CONFIGURATION DU FICHIER :
   - Créez deux pages de base : "❖ Design System Tokens" et "📱 Maquettes"
   - Activez le mode sombre par défaut sur la page Maquettes avec la nuance 
     de fond hexadécimale : #0F172A (Bleu Nuit).

2. IMPORTATION DES STYLES DE RECOUVREMENT (VARIABLES DE COULEUR) :
   - Enregistrer des variables de couleur locales de la manière suivante :
     - "Brand/Midnight"  ──> Value: #0F172A
     - "Brand/Gold"      ──> Value: #D4A017
     - "Core/Ivory"      ──> Value: #F8F5F0
     - "Status/Success"  ──> Value: #10B981
     - "Status/Alert"    ──> Value: #F97360
     - "Grays/ZincDark"  ──> Value: #1E293B
     - "Grays/ZincSoft"  ──> Value: #94A3B8

3. TYPES ET POLICES (STYLES DE TEXTE FIGMA) :
   - "Display/H1-Cormorant" ──> Font: Cormorant Garamond, Weight: Bold, 
                                Size: 48, Line Height: 54px
   - "Headline/H2-Cormorant"──> Font: Cormorant Garamond, Weight: SemiBold, 
                                Size: 32, Line Height: 38px
   - "Body/Reading-OpenSans"──> Font: Open Sans, Weight: Regular, 
                                Size: 18, Line Height: 30px
   - "Button/Label-OpenSans"──> Font: Open Sans, Weight: SemiBold, 
                                Size: 14, Line-Height: 20px

4. RÈGLES AUTO-LAYOUT DE MAQUETTAGE :
   - Cartes (StoryCard, ContestCard) : Use Auto-Layout horizontal ou vertical, 
     Padding: 16px tout autour, Gap: 12px entre les éléments, rounded: 12px.
   - Boutons (PrimaryButton) : Auto-Layout horizontal, Space horizontal: 24px, 
     Space vertical: 12px, Alignement: Centré, Rounded corner radius: 24px.
   - Onboarding / Mobile views : Contraintes de grille fluide (Stretch) avec 
     marges de secours latérales réglées à 24px stables.

5. ACCESSIBILITÉ CONTRAST CHECKER (Figma Plugins) :
   - Utilisez le plug-in "Stark" ou "Able" de Figma pour valider systématiquement 
     que le ratio texte Ivoire (#F8F5F0) sur Bleu Nuit (#0F172A) conserve 
     son statut AA de conformité tout au long de l'expérience interactive.
```

---
*Ce document forme l'épine dorsale UX/UI de l'application Stilova. Toutes les spécifications listées ici sont prêtes à être rattachées aux composants de code Flutter/React et aux structures de base de données associées.*

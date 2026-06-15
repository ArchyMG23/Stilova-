# 🖋️ STILOVA : Le stylet qui grave ton histoire

> **Plateforme Panafricaine Immersive de Lecture & co-Écriture Interactive.**
> Stilova unifie le meilleur de Wattpad, Substack, Kindle, Notion, Duolingo et de la puissance de l'IA générative Gemini dans une architecture unifiée, sécurisée et prête pour la production.

---

## 🗺️ STRUCTURE DU PROJET

L'arborescence officielle de Stilova est structurée de manière modulaire, respectant les normes d'architecture hexagonale et DDD (Domain-Driven Design) pour le backend, ainsi qu'une approche Feature-First robuste pour le client mobile/web :

```text
stilova/
├── backend/                       # Serveur d'APIs unifiées NestJS + Prisma ORM
│   ├── prisma/                    # Schémas de base de données PostgreSQL & Semis (Seed)
│   ├── src/
│   │   ├── domain/               # Entités métier anémiques et Value-Objects
│   │   ├── infrastructure/       # Configs centralisées (Database, Redis, BullMQ, AWS)
│   │   ├── guards/               # Sécurité & Autorisations (JWT, RBAC, Permissions)
│   │   ├── filters/              # Interception unifiée des exceptions PostgreSQL, HTTP & Métier
│   │   └── modules/              # Modules encapsulés (Auth, Users, Stories, AI, Moderation)
│   └── test/                      # Suite complète de tests d'intégrations & E2E (Supertest)
├── mobile/                        # Client unifié (iOS, Android, Web) en Flutter + Riverpod
│   ├── lib/
│   │   ├── core/                  # Thèmes (Polices Inter, Georgia, Fira), réseaux (Dio API Client)
│   │   ├── features/              # Domaines hermétiques (Onboarding, Explorer, Reader, WriteStudio)
│   │   └── routes/                # Routage réactif & gardes dynamiques (GoRouter)
│   └── test/                      # Tests unitaires & de widgets unitaires d'onboarding
├── docs/                          # Spécifications, schémas OpenAPI v3.1 et documentation API
├── infrastructure/                # Déploiements multi-conteneurs local & plans d'architecture AWS
└── scripts/                       # Shell scripts automates d'initialisation de projets
```

---

## 🛠️ SPECIFICATIONS DE LA STACK TECHNIQUE

### Backend (NestJS Monolith Hexagonal)
*   **Moteur d'Exécution** : Node.js 18+ (en TypeScript strict).
*   **Framework** : NestJS avec encapsulation modulaire.
*   **Accès Base de Données** : Prisma ORM & Drizzle (optimisés pour les pools transactionnels).
*   **Moteur Relationnel** : PostgreSQL 15 & 16.
*   **Calcul Cache & File d'Attente** : Redis (pour le stockage de sessions) et BullMQ pour les jobs d'arrière-plan asynchrones (notifications, summarization IA).
*   **Securité** : Guards JWT (2FA, rotation régulière de rafraîchissement), Helmet, CORS restricitifs, Argon2id pour le hachage des mots de passe.
*   **Générateur de Docs** : Swagger UI / OpenAPI 3.1.

### Client Mobile (Flutter Feature-First)
*   **Moteur d'Exécution** : Dart 3.x / Flutter 3.x+ (support multiplateforme Web, Android, iOS).
*   **Gestion d'État** : Riverpod (StateNotifierProvider, AsyncValue).
*   **Routage** : GoRouter avec navigation gérée dynamiquement par l'état d'authentification.
*   **Réseau** : Client HTTP Dio unifié avec intercepteurs auto-refresh token.
*   **Persistance locale** : Database relationnelle Drift (SQLite local pour la lecture hors ligne).

---

## 🚀 GUIDE DE BOOTSTRAP RAPIDE

### Étape 1 : Cloner et Préparer l'Environnement
```bash
git clone https://github.com/your-org/stilova.git
cd stilova
```

### Étape 2 : Lancer le Backend Local via Docker
Démarrez instantanément PostgreSQL, Redis et l'application NestJS avec leurs vérifications physiques de santé :
```bash
docker-compose -f infrastructure/docker-compose.yml up --build -d
```

### Étape 3 : Initialiser la Base de Données
Mettez en place la structure PostgreSQL, lancez les migrations de production et appliquez le semis de données (roles, permissions, superadministrateur système) :
```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

### Étape 4 : Lancer le Client Mobile/Web
```bash
cd ../mobile
flutter pub get
flutter run -d chrome # Ou votre émulateur mobile favori
```

---

## 🔒 POLITIQUES DE CONTRIBUTION & SÉCURITÉ
*   **Couverture de code** : Un seuil minimal de **80%** de couverture de tests sur l'ensemble des modules backend et écrans Flutter est requis lors de l'intégration continue.
*   **Aucun mot de passe en dur** : Utilisez exclusivement les variables définies de façon uniforme dans le fichier `.env.example`.

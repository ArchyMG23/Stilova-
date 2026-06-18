# STILOVA — DOCUMENTATION DE CONFIGURATION DE SUPABASE STORAGE

Ce document décrit comment configurer Supabase Storage pour Stilova, en remplacement de l'ancien système Firebase Storage. Ce guide assure que le fondateur (**FOUNDER_OWNER**) conserve un contrôle souverain absolu sur tous les actifs du système.

---

## 1. VARIABLES D'ENVIRONNEMENT

Pour activer de façon transparente la couche d'abstraction et se connecter à Supabase Storage, les variables suivantes doivent être définies dans votre fichier d'environnement (par exemple `.env` / `.env.production`) :

```env
# URL et Clé anonyme publique d'API de votre projet Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key_supabase_jwt

# Adresse email souveraine du Fondateur propriétaire (Auto-claim FOUNDER_OWNER)
OWNER_EMAIL=gabrielyombi311@gmail.com
```

---

## 2. STRUCTURE DES BUCKETS (REQUIS)

Vous devez créer manuellement les **Buckets** de stockage suivants dans votre console Supabase Storage (`https://supabase.com/dashboard/project/.../storage/buckets`) avec les paramètres indiqués :

| Nom du Bucket | Niveau de Visibilité | Limite de taille | Extensions autorisées | Description |
| :--- | :--- | :--- | :--- | :--- |
| `avatars` | **Public** | 2 MB | `jpg, jpeg, png, webp, gif` | Avatars de profils des champions |
| `covers` | **Public** | 5 MB | `jpg, jpeg, png, webp` | Couvertures de récits, livres, sagas |
| `illustrations` | **Public** | 5 MB | `jpg, jpeg, png, webp` | Générations d'illustrations IA d'Atelier |
| `chapters`| **Privé / Signés** | 15 MB | `mp3, wav, ogg, mp4` | Séquences sonores & musiques de chapitres |
| `contests` | **Public** | 10 MB | `jpg, png, pdf, zip` | Matériel des compétitions & submissions |
| `temporary` | **Privé** | 2 MB | `jpg, png` | Pièces jointes de retours ou caches temporaires |

---

## 3. RÈGLES DE SÉCURITÉ DE STOCKAGE (POLITIQUES RLS CRITIQUES)

Pour chaque bucket, vous devez activer les **Règles RLS (Row Level Security)** dans Supabase afin d'empêcher les escalades de privilèges et sécuriser le contenu.

### A. Bucket `avatars`
* **Lecture (SELECT)** : `true` (Tous les utilisateurs, même visiteurs, peuvent voir les avatars).
* **Écriture / Mise à jour (INSERT/UPDATE)** : 
  Vérifier que l'utilisateur écrit uniquement dans son propre dossier :
  ```sql
  auth.uid()::text = (storage.foldername(name))[1]
  ```

### B. Bucket `covers`
* **Lecture (SELECT)** : `true` (Toutes les couvertures sont publiques).
* **Création / Modification (INSERT/UPDATE/DELETE)** :
  Autorisé pour les rôles administratifs (`AUTHOR`, `MODERATOR`, `ADMIN`, `SUPER_ADMIN`, `FOUNDER_OWNER`) :
  ```sql
  -- Via le champ role présent dans les données de claims
  -- (Vérifie les métadonnées de l'utilisateur ou la table profils via trigger sync)
  ```

### C. Protection absolue du Fondateur (FOUNDER_OWNER)
Afin de préserver le principe de **Founder First Protection** :
* Aucune politique de suppression globale ne doit être accordée sur le stockage sans vérification de l'identifiant du fondateur.
* Le fondateur (`gabrielyombi311@gmail.com`) conserve un accès complet en lecture et écriture sans restriction pour auditer toute la structure.

---

## 4. ARCHITECTURE ET ABSTRACTION DE CODE

Stilova utilise une architecture à haute exportabilité structurée de la manière suivante :

1. Directives de contrat définies dans `IStorageProvider` (`src/types.ts`).
2. Implémentation isolée dans `SupabaseStorageProvider` (`src/lib/storage.ts`) utilisant `@supabase/supabase-js`.
3. Support alternatif inactif prêt pour l'hébergement AWS S3 (`S3StorageProvider`).
4. Routage intelligent et validation sémantique centralisée dans `StorageService` (`src/lib/storage.ts`).

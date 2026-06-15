# 📂 SCRIPTS DE PLATFORME ET AUTOMATES (STILOVA)

Ce dossier regroupe les scripts shell utilitaires d'automatisation destinés aux ingénieurs et développeurs de la plateforme **Stilova**.

---

## 🛠️ SCRIPTS DISPONIBLES

### 1. `bootstrap.sh`
Un assistant interactif qui initialise votre espace de travail de façon automatique de bout en bout.
*   **Fonctionnalités** :
    *   Vérifie que les moteurs logiciels pré-requis sont présents (Node.js, NPM, Flutter).
    *   Initialise et clone automatiquement vos fichiers de secrets `.env` au niveau du backend s'ils n'existent pas.
    *   Installe de manière propre l'ensemble des dépendances NPM du serveur d'API.
*   **Utilisation** :
    ```bash
    chmod +x scripts/bootstrap.sh
    ./scripts/bootstrap.sh
    ```

---

## 🔒 DIRECTIVES DE CONTRIBUTION
*   **Compatibilité OS** : Tous les scripts de ce dossier doivent rester compatibles POSIX et testés sous macOS (Zsh) et Linux (Bash).
*   **Gestion des Erreurs** : Conservez l'instruction directive `set -Eeuo pipefail` au début de chaque script shell pour forcer l'arrêt au premier échec inattendu d'un sous-processus.

#!/usr/bin/env bash

# ##################################################################
# STILOVA DEVELOPER PLATFORM ENVIRONMENT BOOTSTRAPPER SETUP
# ##################################################################

set -Eeuo pipefail

GREEN='\033[0;32m'
AMBER='\033[0;33m'
RED='\033[0;31m'
RESET='\033[0m'

echo -e "${GREEN}"
echo "================================================================"
echo "          STILOVA - REPOSITORY PLATFORM INITIALIZER             "
echo "================================================================"
echo -e "${RESET}"

# 1. Verification System Node & NPM Engines
echo -e "${AMBER}[1/5] Vérification des pré-requis systèmes...${RESET}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Erreur: Node.js n'est pas installé. Veuillez installer Node.js v18+.${RESET}"
    exit 1
fi
echo -e "✓ Node.js : $(node -v)"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}Erreur: NPM est introuvable. Veuillez l'ajouter à votre PATH.${RESET}"
    exit 1
fi
echo -e "✓ NPM : v$(npm -v)"

# 2. Verification command of Flutter
if ! command -v flutter &> /dev/null; then
    echo -e "${AMBER}Avertissement: Flutter SDK est introuvable dans votre PATH.${RESET}"
    echo -e "La partie mobile nécessitera l'installation de Flutter pour sa compilation."
else
    echo -e "✓ Flutter : $(flutter --version | head -n 1)"
fi

# 3. Preparation Environment Variables for Secrets
echo -e "\n${AMBER}[2/5] Initialisation des variables d'environnements (.env)...${RESET}"
if [ ! -f "stilova/backend/.env" ]; then
    if [ -f "stilova/backend/.env.example" ]; then
        cp stilova/backend/.env.example stilova/backend/.env
        echo -e "✓ stilova/backend/.env généré à partir de .env.example"
    else
        cat <<EOF > stilova/backend/.env
DATABASE_URL="postgresql://stilova_admin:stilova_db_secret_pwd@localhost:5432/stilova_prod_db?schema=public"
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD="redis_secret_pwd"
GEMINI_API_KEY=""
JWT_ACCESS_SECRET="jwt_dev_access_secret_stilova_2026"
JWT_REFRESH_SECRET="jwt_dev_refresh_secret_stilova_2026"
EOF
        echo -e "✓ Fichier stilova/backend/.env complété de valeurs par défaut pour le développement."
    fi
else
    echo -e "✓ Le fichier d'environnement stilova/backend/.env existe déjà."
fi

# 4. Backend Dependencies Installations & Prisma Setup
echo -e "\n${AMBER}[3/5] Installation des dépendances Backend (NestJS)...${RESET}"
if [ -d "stilova/backend" ]; then
    cd stilova/backend
    npm ci
    echo -e "✓ Dépendances Node d'API backend restaurées."
    cd ../..
else
    echo -e "${RED}Erreur: Le répertoire stilova/backend n'existe pas.${RESET}"
    exit 1
fi

# 5. Local Docker Orchestration startup option
echo -e "\n${AMBER}[4/5] Initialisation de l'arborescence Docker...${RESET}"
if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    echo -e "✓ Moteur de conteneurs Docker opérationnel."
    echo -e "Pour démarrer la pile de developpement local, veuillez exécuter :"
    echo -e "  ${GREEN}docker-compose -f stilova/infrastructure/docker-compose.yml up -d${RESET}"
else
    echo -e "${AMBER}Avertissement : Docker ou Docker Compose n'est pas en cours d'exécution.${RESET}"
    echo -e "Veuillez démarrer l'application Docker Desktop locale."
fi

# 6. Conclusion
echo -e "\n${GREEN}================================================================"
echo -e "         STILOVA BOOTSTRAP TERMINÉ AVEC SUCCÈS !                "
echo -e "================================================================${RESET}"
echo -e "Rendez-vous dans ${GREEN}stilova/backend${RESET} et insérez votre ${AMBER}GEMINI_API_KEY${RESET}."
echo -e "Lancez la base PostgreSQL puis exécutez la migration :"
echo -e "  ${GREEN}npx prisma migrate dev --name init${RESET}"
EOF

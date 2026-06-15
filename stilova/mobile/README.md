# 📱 CLIENT MOBILE - STILOVA (FLUTTER)

Ce répertoire contient le code source de l'application cliente mobile **Stilova** compilable pour **iOS**, **Android** et le **Web**.

---

## 🛠️ CARACTÉRISTIQUES DE L'ARCHITECTURE CLIENT

L'application est découpée selon une structuration **Feature-First** (ou par domaine fonctionnel), permettant d'isoler hermétiquement l'Onboarding, le Catalogue de Découvertes, le Lecteur Immersif, et le Studio d'Écriture :

```text
lib/
├── core/                         # Configurations globales unifiées (Network, Theme, Auth states)
├── features/                     # Modules fonctionnels autonomes (Onboarding, Discover, Reader, Write)
│   ├── presentation/             # Widgets UI, Écrans, États locaux (StateNotifier, Controllers)
│   └── data/                     # Modèles d'entités locaux et liaisons de persistence Drift
└── routes/                       # Routage réactif navigant via GoRouter
```

---

## 🚀 GUIDE DE LANCEMENT LOCAL

### Étape 1 : Récupérer les Packages Flutter
```bash
flutter pub get
```

### Étape 2 : Lancer le Générateur de Code (Freezed, Drift, Riverpod)
Le projet exploite des générateurs statiques de code pour garantir la désérialisation sécurisée des JSON et le mapping relationnel SQL. Compilez-les à l'aide de l'outil `build_runner` :
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

### Étape 3 : Exécuter l'Application
Connectez un terminal de test (Émulateur iOS Simulator, Android Emulator, ou navigateur Chrome) et exécutez la commande :
```bash
flutter run
```

---

## 🧪 EXÉCUTION DE LA SUITE DE TESTS GLOBALS
Pour lancer les assertions unitaires de nos widgets d'Onboarding et de routing, exécutez :
```bash
flutter test
```

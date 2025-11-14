# Plateforme de Vote Étudiant

Plateforme de vote électronique pour les élections étudiantes avec vérification de carte étudiante via IA.

## 🚀 Installation

1. **Installer les dépendances :**
```bash
npm install
```

## 🧪 Comment tester

### 1. Démarrer le serveur de développement

```bash
npm run dev
```

L'application sera accessible à l'adresse affichée (généralement `http://localhost:5173`)

### 2. Tester les fonctionnalités

#### **Test du scan de carte étudiante :**
- Sur **desktop** : Cliquez sur "Activer la caméra" ou importez une image de carte étudiante
- Sur **mobile** : Utilisez le bouton "Importer une photo de la carte"
- Prendre ou importer une photo de carte étudiante
- Cliquer sur "Vérifier"

**Note importante :** La vérification utilise **Tesseract.js** (OCR gratuit et open source) qui fonctionne entièrement côté client. Aucune clé API n'est nécessaire !

#### **Test du vote :**
1. Après vérification réussie de la carte, vous arrivez sur l'écran de vote
2. Sélectionnez un candidat
3. Cliquez sur "Confirmer mon vote"
4. Le vote est enregistré dans le localStorage

#### **Test de l'accès administrateur :**
1. Sur l'écran d'accueil, cliquez sur "Accès Administrateur"
2. Entrez le mot de passe : `admin2025`
3. Vous pouvez voir les résultats des élections

### 3. Tester les cas d'erreur

- **Carte invalide** : Importez une image qui n'est pas une carte étudiante
- **Carte expirée** : Importez une carte avec une date d'expiration passée
- **Ville incorrecte** : Importez une carte d'un étudiant qui n'est pas de Tanguiéta
- **Double vote** : Essayez de voter deux fois avec la même carte

## ⚠️ Configuration requise

### Module de vérification photo (GRATUIT - Tesseract.js)

Le module de vérification photo utilise **Tesseract.js**, une bibliothèque OCR open source et **100% gratuite** qui fonctionne entièrement côté client. Aucune clé API n'est nécessaire !

Le module extrait automatiquement les informations suivantes de la carte étudiante :
- **Nom de famille** (lastName)
- **Prénom** (firstName)
- **Date de validité** (validityDate et validUntil)
- **Lieu (At)** - lieu de naissance indiqué après "At:" ou "A At:"

**Avantages de Tesseract.js :**
- ✅ **100% gratuit** - Aucun coût, aucune limite
- ✅ **Fonctionne hors ligne** - Traitement côté client
- ✅ **Respect de la vie privée** - Les images ne quittent jamais votre appareil
- ✅ **Aucune configuration** - Fonctionne immédiatement après l'installation
- ✅ **Pas de clé API** - Aucune configuration nécessaire

**Conseils pour une meilleure extraction :**
- Prenez une photo bien éclairée de la carte
- Assurez-vous que la carte est bien cadrée et nette
- Évitez les reflets et les ombres

## 📁 Structure du projet

```
etudiant/
├── src/
│   ├── components/
│   │   └── VotingPlatform.jsx  # Composant principal
│   ├── utils/
│   │   └── storage.js          # Utilitaire de stockage local
│   ├── App.jsx                 # Composant racine
│   └── main.jsx                # Point d'entrée
├── index.html                  # HTML principal
├── vite.config.js             # Configuration Vite
└── package.json               # Dépendances
```

## 🔧 Scripts disponibles

- `npm run dev` - Démarrer le serveur de développement
- `npm run build` - Construire pour la production
- `npm run preview` - Prévisualiser la build de production

## 📝 Notes importantes

- Les votes sont stockés dans le **localStorage** du navigateur
- La vérification de carte utilise **Tesseract.js** (OCR gratuit) - **aucune connexion Internet requise** pour l'extraction
- L'application est optimisée pour mobile et desktop
- Le timer de vote est de **60 secondes** par défaut
- Pour une meilleure précision, assurez-vous que la photo de la carte est claire et bien éclairée



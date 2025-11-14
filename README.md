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

**Note importante :** La vérification utilise l'API Claude d'Anthropic. Vous devez :
- Avoir une clé API Anthropic valide
- Configurer l'en-tête `x-api-key` dans la requête (actuellement manquant dans le code)

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

### API Anthropic

Le code actuel fait appel à l'API Claude mais **manque la clé API**. Pour que la vérification fonctionne, vous devez :

1. Obtenir une clé API sur [console.anthropic.com](https://console.anthropic.com)
2. Ajouter l'en-tête d'authentification dans `verifyCard()` :

```javascript
headers: {
  'Content-Type': 'application/json',
  'x-api-key': 'VOTRE_CLE_API_ICI',
  'anthropic-version': '2023-06-01'
}
```

### Alternative pour tester sans API

Pour tester sans l'API Anthropic, vous pouvez créer une fonction de mock qui retourne des données de test.

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
- La vérification de carte nécessite une **connexion Internet** et une **clé API Anthropic**
- L'application est optimisée pour mobile et desktop
- Le timer de vote est de **60 secondes** par défaut



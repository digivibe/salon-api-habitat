# Migration des Exposants - Salon Habitat 2025

Ce dossier contient les scripts pour migrer les exposants de la base de données.

## 📋 Vue d'ensemble

La migration effectue les opérations suivantes:
- **Suppression** des exposants obsolètes (listés dans `data/todelete.txt`)
- **Mise à jour** des exposants existants avec les nouvelles données
- **Ajout** de nouveaux exposants (depuis `data/expos2025.csv`)
- **Protection** de "Dormans Coworking" (qui a des publications et ne doit pas être touché)

## 🚀 Utilisation rapide

### Option 1: Migration complète automatique (RECOMMANDÉ)

```bash
node scripts/migrateAll.js
```

Ce script orchestre tout le processus avec des confirmations à chaque étape critique.

### Option 2: Étape par étape

Si vous préférez contrôler chaque étape manuellement:

```bash
# 1. Sauvegarder la base de données actuelle
node scripts/exportExposants.js

# 2. Analyser les opérations de migration (sans modifier la DB)
node scripts/migrateExposants.js

# 3. Vérifier le fichier data/migration_operations.json

# 4. Exécuter la migration (MODIFIE LA DB!)
node scripts/executeMigration.js

# 5. Exporter les données finales
node scripts/exportFinalData.js
```

## 📁 Scripts disponibles

### `exportExposants.js`
Crée une sauvegarde complète de tous les exposants actuels.
- **Entrée**: Base de données MongoDB
- **Sortie**: `data/backup_exposants_[timestamp].json`

### `migrateExposants.js`
Analyse les données et génère un plan de migration.
- **Entrée**:
  - Base de données MongoDB (exposants actuels)
  - `data/expos2025.csv` (nouveaux exposants)
  - `data/todelete.txt` (exposants à supprimer)
- **Sortie**: `data/migration_operations.json`
- **Note**: N'effectue AUCUNE modification de la DB

### `executeMigration.js`
Exécute les opérations de migration sur la base de données.
- **Entrée**: `data/migration_operations.json`
- **Sortie**: `data/migration_results.json`
- **⚠️ ATTENTION**: Modifie la base de données!

### `exportFinalData.js`
Export les données finales après migration.
- **Entrée**: Base de données MongoDB
- **Sortie**:
  - `data/exposants_final.json` (format JSON complet)
  - `data/exposants_final.csv` (format CSV pour Excel)
  - `data/new_exposants_credentials.json` (identifiants des nouveaux comptes)

### `migrateAll.js`
Script principal qui orchestre tout le processus avec confirmations.

## 🧠 Algorithme de correspondance intelligente

Le script utilise un algorithme de correspondance avancé pour identifier les exposants:

1. **Normalisation des noms**: Suppression des accents, ponctuation, casse
2. **Correspondance exacte**: 100% de similarité
3. **Correspondance partielle**: Détection des inclusions (ex: "IAD" dans "IAD France")
4. **Correspondance par mots**: Analyse des mots communs
5. **Seuil de confiance**: 60% minimum pour proposer une correspondance

### Exemples de correspondances:
- `"IAD"` → `"Christel Velly - IAD France"` (80% - inclusion)
- `"DOM ET VIE"` → `"Dom et Vie"` (100% - normalisation)
- `"Activ Architecture"` → `"Activ Architecture 51"` (80% - ajout de détails)

## 📊 Format des données

### Structure du CSV source (`expos2025.csv`)
```
Nom,Adresse,Activité,Téléphone,Email,Site Web,LinkedIn,Facebook,Instagram
```

### Structure des opérations de migration
```json
{
  "toDelete": [
    {
      "_id": "...",
      "nom": "...",
      "matchedWith": "...",
      "similarity": 1.0
    }
  ],
  "toUpdate": [
    {
      "_id": "...",
      "oldData": { ... },
      "newData": { ... },
      "similarity": 0.8
    }
  ],
  "toAdd": [
    {
      "nom": "...",
      "email": "...",
      "password": "...",
      "generatedPassword": "...",
      ...
    }
  ],
  "toKeep": [
    {
      "nom": "Dormans Coworking",
      "reason": "..."
    }
  ]
}
```

## 🔐 Génération des mots de passe

Pour les nouveaux exposants sans email dans le CSV:
- Un email par défaut est généré: `[username]@salon-habitat.fr`
- Un mot de passe aléatoire est créé (16 caractères hexadécimaux)
- Les identifiants sont sauvegardés dans `new_exposants_credentials.json`

## ⚠️ Points d'attention

### Protection de "Dormans Coworking"
Cet exposant a des publications sur l'application. Il est **automatiquement protégé** et ne sera ni supprimé ni modifié, même s'il apparaît dans `todelete.txt`.

### Suppression en cascade
Quand un exposant est supprimé, **toutes ses données associées** sont également supprimées:
- Vidéos (`ExposantVideo`)
- Bondeals (`ExposantBondeal`)
- Commentaires (`Comment`)
- Likes (`Like`)
- Sessions de connexion (`Login`)

### Validation des données
Les champs obligatoires reçoivent des valeurs par défaut si manquants:
- `location`: "Dormans"
- `bio`: "Exposant du salon Habitat"
- `phoneNumber`: ""
- Réseaux sociaux: ""

### Statut par défaut
Tous les nouveaux exposants reçoivent:
- `isValid`: 2 (validé avec publication)
- `statut`: 1 (actif)

## 🔄 Rollback en cas de problème

Si la migration échoue ou produit des résultats inattendus:

1. La sauvegarde complète est dans `data/backup_exposants_[timestamp].json`
2. Vous pouvez restaurer manuellement via MongoDB:

```javascript
// Connectez-vous à MongoDB et exécutez:
const backup = require('./data/backup_exposants_[timestamp].json');

// Supprimer tous les exposants actuels
await Exposant.deleteMany({});

// Restaurer la sauvegarde
await Exposant.insertMany(backup);
```

## 📝 Vérifications post-migration

Après la migration, vérifiez:

1. Le nombre total d'exposants correspond aux attentes
2. "Dormans Coworking" est toujours présent
3. Les nouveaux exposants ont bien été ajoutés
4. Les exposants à supprimer ont été supprimés
5. Les mises à jour ont été appliquées correctement

Utilisez le fichier `exposants_final.csv` dans Excel pour une vérification visuelle rapide.

## 🆘 Support

En cas de problème:
1. Vérifier les logs de console (très détaillés)
2. Consulter `data/migration_results.json` pour les erreurs
3. Vérifier la sauvegarde `data/backup_exposants_*.json`
4. Les fichiers `migration_operations.json` montrent exactement ce qui a été planifié

## 🏗️ Architecture technique

### Dépendances
- `mongoose`: ORM MongoDB
- `dotenv`: Variables d'environnement
- `fs`: Système de fichiers
- `crypto`: Génération de mots de passe

### Variables d'environnement requises
- `MONGO_URI`: URI de connexion MongoDB

### Modèles utilisés
- `Exposant`: Modèle principal
- `Categorie`: Catégories d'exposants
- `ExposantVideo`, `ExposantBondeal`: Contenus
- `Comment`, `Like`: Interactions
- `Login`: Sessions

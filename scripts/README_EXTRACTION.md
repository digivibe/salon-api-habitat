# Scripts d'extraction et de nettoyage

## Scripts disponibles

### 1. Nettoyer les données (sauf événements)

```bash
npm run clear:data
```

Ce script supprime toutes les données sauf les événements :
- Salons
- Catégories
- Exposants
- Vidéos
- Bon deals

⚠️ **Attention** : Cette action est irréversible. Les événements seront conservés.

### 2. Extraire les données vers CSV

```bash
npm run extract:csv
```

Ce script se connecte aux 3 anciens serveurs et extrait les données essentielles dans des fichiers CSV :
- `salons.csv` : Liste des salons
- `categories.csv` : Liste des catégories par salon
- `exposants.csv` : Liste des exposants par salon
- `videos.csv` : Liste des vidéos par salon
- `bondeals.csv` : Liste des bon deals par salon

## Configuration

Avant d'exécuter le script d'extraction, configurez les variables d'environnement dans votre fichier `.env` :

```env
# Anciennes bases de données
OLD_HABITAT_MONGO_URI=mongodb://localhost:27017/salonapp
OLD_EMPLOI_MONGO_URI=mongodb://localhost:27017/salonapp-formation
OLD_NOEL_MONGO_URI=mongodb://localhost:27017/salonapp-noel
```

## Fichiers CSV générés

Les fichiers CSV seront créés dans le dossier `migration/csv/` :

- **salons.csv** : Colonnes : Salon, Nom, isActive
- **categories.csv** : Colonnes : Salon, Label, Color, BorderColor, Statut
- **exposants.csv** : Colonnes : Salon, Email, Username, Nom, Categorie, Location, Bio, isValid, PhoneNumber, LinkedIn, Facebook, Instagram, Weblink, Profil, Cover, Statut
- **videos.csv** : Colonnes : Salon, ExposantEmail, Name, Description, Statut
- **bondeals.csv** : Colonnes : Salon, ExposantEmail, Title, Description, Image, Statut

## Processus recommandé

1. **Extraire les données** : `npm run extract:csv`
2. **Vérifier les fichiers CSV** dans `migration/csv/`
3. **Valider les données** dans les CSV
4. **Nettoyer les données** : `npm run clear:data`
5. **Importer les données** : `npm run seed:migration`


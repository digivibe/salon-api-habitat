# API de Gestion des Exposants - Documentation

## 📋 Vue d'ensemble

Cette API permet d'administrer les exposants via la route `/api/v1/manage`. Toutes les routes nécessitent une **authentification administrateur** (isValid = 3).

**Base URL**: `http://localhost:9000/api/v1/manage` (ou votre domaine en production)

## 🔐 Authentification

Toutes les routes nécessitent un token d'administrateur. Le token peut être fourni de 3 façons:

1. **Header Authorization** (recommandé):
```
Authorization: Bearer YOUR_TOKEN_HERE
```

2. **Query parameter**:
```
?token=YOUR_TOKEN_HERE
```

3. **Body parameter**:
```json
{
  "token": "YOUR_TOKEN_HERE"
}
```

## 📊 Endpoints

### 1. Obtenir les statistiques

```http
GET /api/v1/manage/stats
```

**Réponse**:
```json
{
  "status": 200,
  "data": {
    "exposants": {
      "total": 47,
      "active": 45,
      "inactive": 2
    },
    "byValidation": {
      "simpleExposant": 7,
      "valideNoPublication": 11,
      "valideWithPublication": 28,
      "administrator": 1
    },
    "byCategory": [
      {
        "_id": "663a31d1a8616a0a3a57531a",
        "label": "Aménagement intérieur",
        "count": 35
      }
    ],
    "content": {
      "videos": 24,
      "bondeals": 18,
      "comments": 156,
      "likes": 342
    }
  }
}
```

---

### 2. Lister tous les exposants

```http
GET /api/v1/manage/exposants
```

**Query Parameters**:
- `page` (number, default: 1) - Numéro de page
- `limit` (number, default: 20) - Nombre d'éléments par page
- `search` (string) - Recherche par nom, email ou username
- `isValid` (0|1|2|3) - Filtrer par niveau de validation
- `statut` (0|1) - Filtrer par statut actif/inactif
- `categorie` (ObjectId) - Filtrer par catégorie

**Exemples**:
```
GET /api/v1/manage/exposants?page=1&limit=10
GET /api/v1/manage/exposants?search=lagache
GET /api/v1/manage/exposants?isValid=2&statut=1
GET /api/v1/manage/exposants?categorie=663a31d1a8616a0a3a57531a
```

**Réponse**:
```json
{
  "status": 200,
  "data": [
    {
      "_id": "6707b06513187735ba042991",
      "nom": "Lagache",
      "email": "communication@lagache.com",
      "username": "lagac",
      "location": "51200 Épernay",
      "bio": "Votre expert fermetures et vérandas",
      "isValid": 2,
      "statut": 1,
      "categorie": {
        "_id": "663a31d1a8616a0a3a57531a",
        "label": "Aménagement intérieur"
      },
      "createdAt": "2024-10-10T10:15:33.000Z",
      "updatedAt": "2024-10-10T10:20:15.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 47,
    "pages": 3
  }
}
```

---

### 3. Obtenir un exposant par ID

```http
GET /api/v1/manage/exposants/:id
```

**Paramètres**:
- `id` (string, required) - ID de l'exposant

**Réponse**:
```json
{
  "status": 200,
  "data": {
    "_id": "6707b06513187735ba042991",
    "nom": "Lagache",
    "email": "communication@lagache.com",
    "username": "lagac",
    "location": "51200 Épernay",
    "bio": "Votre expert fermetures et vérandas",
    "phoneNumber": "03 26 59 95 05",
    "weblink": "lagache.com",
    "linkedinLink": "https://www.linkedin.com/company/lagache/",
    "facebookLink": "Lien",
    "instaLink": "Lien",
    "profil": "https://salon-api-habitat.onrender.com/uploads/exposants_profile_pic/logo.png",
    "cover": "https://salonapp-api-y25d.onrender.com/uploads/exposants_cover_pic/default.png",
    "isValid": 2,
    "statut": 1,
    "categorie": {
      "_id": "663a31d1a8616a0a3a57531a",
      "label": "Aménagement intérieur"
    },
    "stats": {
      "videos": 3,
      "bondeals": 5,
      "comments": 12,
      "likes": 45,
      "logins": 8
    },
    "createdAt": "2024-10-10T10:15:33.000Z",
    "updatedAt": "2024-10-10T10:20:15.000Z"
  }
}
```

---

### 4. Créer un nouvel exposant

```http
POST /api/v1/manage/exposants
```

**Body** (JSON):
```json
{
  "categorie": "663a31d1a8616a0a3a57531a",
  "email": "nouveau@example.com",
  "username": "nouveau_exposant",
  "password": "motdepasse123",
  "nom": "Nouveau Exposant",
  "location": "Paris, France",
  "bio": "Description de l'exposant",
  "phoneNumber": "01 23 45 67 89",
  "weblink": "https://example.com",
  "linkedinLink": "",
  "facebookLink": "",
  "instaLink": "",
  "isValid": 2,
  "statut": 1
}
```

**Champs obligatoires**:
- `categorie` (ObjectId) - ID de la catégorie
- `email` (string) - Email unique
- `username` (string) - Nom d'utilisateur unique
- `password` (string) - Mot de passe (sera hashé automatiquement)
- `nom` (string) - Nom de l'exposant
- `location` (string) - Localisation
- `bio` (string) - Description/bio

**Champs optionnels**:
- `phoneNumber` (string)
- `weblink` (string)
- `linkedinLink` (string)
- `facebookLink` (string)
- `instaLink` (string)
- `isValid` (0|1|2|3, default: 2)
- `statut` (0|1, default: 1)
- `profil` (string, URL)
- `cover` (string, URL)

**Réponse**:
```json
{
  "status": 201,
  "message": "Exposant créé avec succès",
  "data": {
    "_id": "68e8dde823afb728726b3407",
    "nom": "Nouveau Exposant",
    "email": "nouveau@example.com",
    ...
  }
}
```

---

### 5. Mettre à jour un exposant

```http
PUT /api/v1/manage/exposants/:id
```

**Paramètres**:
- `id` (string, required) - ID de l'exposant

**Body** (JSON) - Tous les champs sont optionnels:
```json
{
  "nom": "Nouveau nom",
  "email": "newemail@example.com",
  "location": "Nouvelle adresse",
  "bio": "Nouvelle bio",
  "phoneNumber": "06 12 34 56 78",
  "isValid": 2,
  "statut": 1
}
```

**Notes**:
- Le mot de passe sera automatiquement hashé s'il est modifié
- L'email et le username doivent rester uniques
- La catégorie doit exister si elle est modifiée

**Réponse**:
```json
{
  "status": 200,
  "message": "Exposant mis à jour avec succès",
  "data": {
    "_id": "6707b06513187735ba042991",
    "nom": "Nouveau nom",
    ...
  }
}
```

---

### 6. Mettre à jour les permissions d'un exposant

```http
PATCH /api/v1/manage/exposants/:id/permissions
```

**Paramètres**:
- `id` (string, required) - ID de l'exposant

**Body** (JSON):
```json
{
  "isValid": 2
}
```

**Valeurs possibles pour `isValid`**:
- `0` - Simple exposant
- `1` - Validé sans publication
- `2` - Validé avec publication
- `3` - Administrateur

**Réponse**:
```json
{
  "status": 200,
  "message": "Permissions mises à jour avec succès",
  "data": {
    "_id": "6707b06513187735ba042991",
    "nom": "Lagache",
    "isValid": 2,
    ...
  }
}
```

---

### 7. Mettre à jour le statut d'un exposant

```http
PATCH /api/v1/manage/exposants/:id/status
```

**Paramètres**:
- `id` (string, required) - ID de l'exposant

**Body** (JSON):
```json
{
  "statut": 1
}
```

**Valeurs possibles pour `statut`**:
- `0` - Inactif
- `1` - Actif

**Réponse**:
```json
{
  "status": 200,
  "message": "Statut mis à jour avec succès",
  "data": {
    "_id": "6707b06513187735ba042991",
    "nom": "Lagache",
    "statut": 1,
    ...
  }
}
```

---

### 8. Supprimer un exposant

```http
DELETE /api/v1/manage/exposants/:id
```

**Paramètres**:
- `id` (string, required) - ID de l'exposant

**⚠️ Attention**: Cette action supprime l'exposant et **toutes ses données associées**:
- Vidéos (ExposantVideo)
- Bondeals (ExposantBondeal)
- Commentaires (Comment)
- Likes (Like)
- Sessions de connexion (Login)

**Réponse**:
```json
{
  "status": 200,
  "message": "Exposant supprimé avec succès (ainsi que toutes ses données associées)"
}
```

---

## 🚨 Gestion des erreurs

### Codes d'erreur

- **400** - Mauvaise requête (données invalides)
- **401** - Non authentifié (token manquant ou invalide)
- **403** - Accès refusé (droits d'administrateur requis)
- **404** - Ressource non trouvée
- **500** - Erreur serveur

### Format des erreurs

```json
{
  "status": 403,
  "message": "Accès refusé. Droits d'administrateur requis."
}
```

Avec détails supplémentaires si disponible:
```json
{
  "status": 400,
  "message": "Cet email est déjà utilisé",
  "error": "Email already exists"
}
```

---

## 📝 Exemples d'utilisation

### Avec cURL

```bash
# Obtenir les statistiques
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:9000/api/v1/manage/stats

# Lister les exposants
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:9000/api/v1/manage/exposants?page=1&limit=10"

# Créer un exposant
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"categorie":"663a31d1a8616a0a3a57531a","email":"test@example.com","username":"test","password":"pass123","nom":"Test","location":"Paris","bio":"Test bio"}' \
  http://localhost:9000/api/v1/manage/exposants

# Mettre à jour les permissions
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isValid":2}' \
  http://localhost:9000/api/v1/manage/exposants/EXPOSANT_ID/permissions

# Supprimer un exposant
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:9000/api/v1/manage/exposants/EXPOSANT_ID
```

### Avec JavaScript (fetch)

```javascript
const token = 'YOUR_TOKEN_HERE';
const baseUrl = 'http://localhost:9000/api/v1/manage';

// Obtenir les statistiques
async function getStats() {
  const response = await fetch(`${baseUrl}/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
}

// Créer un exposant
async function createExposant(data) {
  const response = await fetch(`${baseUrl}/exposants`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return await response.json();
}

// Mettre à jour les permissions
async function updatePermissions(exposantId, isValid) {
  const response = await fetch(`${baseUrl}/exposants/${exposantId}/permissions`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ isValid })
  });
  return await response.json();
}
```

---

## 🔍 Notes importantes

1. **Authentification obligatoire**: Toutes les routes nécessitent un compte administrateur (isValid = 3)

2. **Suppression cascade**: La suppression d'un exposant supprime automatiquement toutes ses données associées

3. **Unicité**: Les champs `email` et `username` doivent être uniques dans la base de données

4. **Hashage automatique**: Les mots de passe sont automatiquement hashés avec bcrypt lors de la création ou modification

5. **Pagination**: Par défaut, 20 éléments par page. Maximum recommandé: 100 éléments par page

6. **Recherche**: La recherche est insensible à la casse et recherche dans nom, email et username

7. **Images par défaut**: Si non spécifiées, les images de profil et couverture utilisent les URLs par défaut du système

# 🚀 API de Gestion - Démarrage Rapide

## Base URL
```
/api/v1/manage
```

## 🔑 Authentification
Toutes les routes nécessitent un token d'administrateur (isValid = 3).

**Administrateur actuel**:
- Username: `3g`
- Email: `Walid.nouira@3gcivil.com`

Ajouter le token dans le header:
```
Authorization: Bearer YOUR_TOKEN
```

## 📍 Routes Principales

### 📊 Statistiques
```http
GET /api/v1/manage/stats
```

### 👥 Gestion des Exposants

#### Lister
```http
GET /api/v1/manage/exposants
GET /api/v1/manage/exposants?search=lagache
GET /api/v1/manage/exposants?isValid=2&page=1&limit=10
```

#### Voir détails
```http
GET /api/v1/manage/exposants/:id
```

#### Créer
```http
POST /api/v1/manage/exposants
Content-Type: application/json

{
  "categorie": "663a31d1a8616a0a3a57531a",
  "email": "nouveau@example.com",
  "username": "nouveau",
  "password": "motdepasse",
  "nom": "Nouveau Exposant",
  "location": "Paris",
  "bio": "Description"
}
```

#### Modifier
```http
PUT /api/v1/manage/exposants/:id
Content-Type: application/json

{
  "nom": "Nouveau nom",
  "bio": "Nouvelle bio"
}
```

#### Modifier permissions
```http
PATCH /api/v1/manage/exposants/:id/permissions
Content-Type: application/json

{
  "isValid": 2
}
```

**Niveaux de permissions**:
- `0` = Simple exposant
- `1` = Validé sans publication
- `2` = Validé avec publication ✅
- `3` = Administrateur 👑

#### Modifier statut
```http
PATCH /api/v1/manage/exposants/:id/status
Content-Type: application/json

{
  "statut": 1
}
```

**Statuts**:
- `0` = Inactif ❌
- `1` = Actif ✅

#### Supprimer
```http
DELETE /api/v1/manage/exposants/:id
```

⚠️ **Supprime aussi**: videos, bondeals, comments, likes, logins

---

## 🧪 Test rapide avec cURL

```bash
# Remplacer YOUR_TOKEN par votre token admin

# Stats
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:9000/api/v1/manage/stats

# Liste
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:9000/api/v1/manage/exposants?page=1&limit=5

# Recherche
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:9000/api/v1/manage/exposants?search=dormans"
```

---

## 📚 Documentation complète

Voir `docs/MANAGE_API.md` pour la documentation complète avec tous les exemples.

---

## 🔒 Sécurité

- ✅ Authentification requise sur toutes les routes
- ✅ Vérification du niveau admin (isValid = 3)
- ✅ Validation des données entrantes
- ✅ Protection contre les doublons (email, username)
- ✅ Hashage automatique des mots de passe (bcrypt)

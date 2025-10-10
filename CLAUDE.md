# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Node.js REST API for a salon/exhibition application built with Express.js and MongoDB. The API manages exhibitors (exposants), visitors, events, videos, deals (bondeals), likes, comments, and notifications. It uses Cloudinary for media storage and supports push notifications via Expo.

## Development Commands

### Running the Server
```bash
npm start          # Production mode (node server)
npm run dev        # Development mode with auto-reload (nodemon)
```

The server runs on port 9000 by default (configurable via `process.env.PORT`).

### Database
MongoDB connection is handled in `config/db.js`. Requires `MONGO_URI` environment variable.

## Architecture Overview

### Authentication System
The application uses a **cookie-based token authentication** system with a unique multi-layered approach:

1. **Visitor Layer**: Every user gets a unique visitor token (cookie) tracked in the `visitors` collection
2. **Login Layer**: When an exposant logs in, a `Login` document links the visitor to the exposant
3. **Session Management**: The `Login` document has a `session` field (0=logged out, 1=logged in)

**Key Authentication Flow**:
- `libs/tokenCreator.js`: Generates SHA-256 hashed tokens for visitors
- `libs/checkExposantLogin.js`: Validates tokens by checking Visitor → Login → Exposant chain
- Controllers use `checkExposantLogin(token)` to verify authentication and retrieve `exposantId`

### Data Models Relationships

**Core Models** (`models/`):
- `Exposant`: Exhibitors/vendors with profile, category, social links, validation status (`isValid`: 0-3)
  - Pre-save hook automatically hashes passwords with bcrypt
- `Visitor`: Tracks unique visitors by cookie, IP, country code
- `Login`: Links visitors to exposants with session state
- `ExposantVideo`: Videos uploaded by exposants (Cloudinary URLs)
- `ExposantBondeal`: Promotional deals/offers with images
- `Categorie`: Categories for exposants
- `Like` & `Comment`: Legacy models for individual content types
- `UnifiedLike` & `UnifiedComment`: Newer unified models supporting multiple content types across salons

**Key Fields**:
- Most models have `statut` field (0=inactive, 1=active)
- `Exposant.isValid`: 0=simple, 1=validated no publish, 2=validated with publish, 3=admin
- Timestamps are enabled on most collections

### Routing Structure

Routes are organized in `routes/` and mounted at `/api/v1` (see `routes/index.js`):

- `/api/v1/app`: App configuration & categories
- `/api/v1/auth`: Authentication (login, register, password reset)
- `/api/v1/exposant`: Exposant-specific actions (videos, bondeals, profile updates)
- `/api/v1/event`: Event management
- `/api/v1/user`: Visitor/user operations
- `/api/v1/notification`: Push notification management
- `/api/v1/likes/`, `/api/v1/comments/`: Unified likes/comments system (newer)

Root-level routes in `server.js`:
- `POST /upload`: Direct Cloudinary upload
- `GET /cloud`: List all Cloudinary resources
- `DELETE /delete`: Delete Cloudinary resource by URL
- `GET /ping`: Keep-alive endpoint (prevents Render.com sleep)

### File Upload System

The upload system (`middlewares/uploadMiddleware.js`) uses Multer + Cloudinary:

1. **Local Storage**: Files temporarily saved to `uploads/` directory
2. **Cloudinary Upload**: Automatic upload with transformations:
   - Videos: Converted to 9:16 aspect ratio (1080x1920) for TikTok-style format
   - Images: No transformation applied
3. **Cleanup**: Local files deleted after Cloudinary upload
4. **URL Storage**: `req.file.cloudinaryUrl` contains the hosted URL

**Helper Functions**:
- `deleteByUrl(url)`: Extracts public_id and resource_type from URL, deletes from Cloudinary
- Controllers call this before deleting database records to clean up media

**Specialized Upload Middlewares**:
- `uploadExposantVideo.js`: Video uploads for exposants
- `uploadExposantBondeal.js`: Image uploads for deals
- `uploadProfilePic.js`: Profile picture uploads
- `uploadCoverPic.js`: Cover photo uploads

### Controller Patterns

Controllers follow a consistent error-handling pattern:
```javascript
exports.someAction = async (req, res) => {
    const { token, ...otherData } = req.body
    let message = ""
    try {
        const expoStatut = await checkExposantLogin(token)
        if (!expoStatut) {
            message = "Vous n'êtes pas connecté pour effectuer cette action!"
            throw new Error(message)
        }
        // ... business logic
        res.status(200).json({ status: 200, message: "DONE", ...data })
    } catch (error) {
        res.status(200).json({ status: 400, message: message || "Erreur...", error: error.message })
    }
}
```

**Note**: All responses return HTTP 200, with actual status in JSON body (`status: 200` for success, `status: 400` for errors).

### Environment Variables

Required in `.env`:
- `MONGO_URI`: MongoDB connection string
- `PORT`: Server port (default 9000)
- `CORS_ORIGIN`: Allowed CORS origin
- `BASE_LINK`: Base URL for the API
- `CLOUDINARY_CLOUD_NAME`: Cloudinary account name
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret
- Email configuration for password reset (nodemailer)
- Expo push notification credentials

## Important Notes

### Data Deletion Cascade
When deleting an exposant account (`exposantController.deleteAccount`), all related data is deleted:
- Comments, Bondeals, Videos, Likes, Login records

### Keep-Alive Mechanism
The server pings `https://coworkingapp-jaqx.onrender.com` every 2.5 minutes (line 84-92 in `server.js`) to prevent instance sleep on Render.com free tier.

### Default Images
Default profile and cover images are hardcoded URLs in `exposantModel.js`. These URLs should not be deleted from Cloudinary.

### Password Handling
Passwords are hashed automatically via Mongoose pre-save hook in `exposantModel.js`. Never save passwords without this hook.

### Response Format
Controllers return status codes in JSON body rather than HTTP status codes. Always check `response.status` field, not HTTP status.

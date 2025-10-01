const express = require('express');
const router = express.Router();

const unifiedLikeController = require('../controllers/unifiedLikeController');
const unifiedCommentController = require('../controllers/unifiedCommentController');

// ============ ROUTES LIKES UNIFIÉS ============

// Toggle like (create ou delete)
router.post('/likes/toggle', unifiedLikeController.toggleUnifiedLike);

// Get likes par vidéo
router.get('/likes/video/:videoId', unifiedLikeController.getLikesByVideoId);

// Get likes par exposant
router.get('/likes/exposant/:exposantId', unifiedLikeController.getLikesByExposantId);

// Get likes par salon
router.get('/likes/salon/:salon', unifiedLikeController.getLikesBySalon);

// Delete like
router.delete('/likes/:id', unifiedLikeController.deleteUnifiedLike);

// Stats likes
router.get('/likes/stats', unifiedLikeController.getLikesStats);

// ============ ROUTES COMMENTAIRES UNIFIÉS ============

// Create comment
router.post('/comments', unifiedCommentController.createUnifiedComment);

// Get comments par vidéo
router.get('/comments/video/:videoId', unifiedCommentController.getCommentsByVideoId);

// Get comments par exposant
router.get('/comments/exposant/:exposantId', unifiedCommentController.getCommentsByExposantId);

// Get comments par salon
router.get('/comments/salon/:salon', unifiedCommentController.getCommentsBySalon);

// Update comment
router.put('/comments/:id', unifiedCommentController.updateUnifiedComment);

// Delete comment
router.delete('/comments/:id', unifiedCommentController.deleteUnifiedComment);

// Stats comments
router.get('/comments/stats', unifiedCommentController.getCommentsStats);

module.exports = router;
const express = require('express');
const likeController = require('../controllers/likeController');

const router = express.Router();

// Route to create a new like
router.post('/likes', likeController.createLike);

// Route to get all likes
router.get('/likes', likeController.getAllLikes);

// Route to get a like by ID
router.get('/likes/:id', likeController.getLikeByID);

// Route to get likes by exposant ID
router.get('/likes/exposant/:exposantId', likeController.getLikesByExposantID);

// Route to get likes by video ID
router.get('/likes/video/:videoId', likeController.getLikesByVideoID);

// Route to toggle a like
router.post('/likes/toggle', likeController.toggleLike);

// Route to delete a like by ID
router.delete('/likes/:id', likeController.deleteLike);

module.exports = router;

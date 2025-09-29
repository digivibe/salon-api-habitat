const express = require('express');
const commentController = require('../controllers/commentController');

const router = express.Router();

// Route to create a new comment
router.post('/comments', commentController.createComment);

// Route to get all comments
router.get('/comments', commentController.getAllComments);

// Route to get a comment by ID
router.get('/comments/:id', commentController.getCommentByID);

// Route to get comments by exposant ID
router.get('/comments/exposant/:exposantId', commentController.getCommentsByExposantID);

// Route to get comments by video ID
router.get('/comments/video/:videoId', commentController.getCommentsByVideoID);

// Route to update a comment by ID
router.put('/comments/:id', commentController.updateComment);

// Route to delete a comment by ID
router.delete('/comments/:id', commentController.deleteComment);

module.exports = router;

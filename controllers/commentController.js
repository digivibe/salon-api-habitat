const Comment = require("../models/commentModel")
const fallbackService = require("../services/fallbackService")

// Create a new comment
exports.createComment = async (req, res) => {
    try {
        const newComment = new Comment(req.body)
        await newComment.save()
        res.status(201).json(newComment)
    } catch (error) {
        if (error.message.includes("exposant") || error.message.includes("video")) {
            try {
                console.log("[v0] Tentative de création de commentaire via fallback")
                const fallbackResult = await fallbackService.createComment(req.body)
                return res.status(201).json(fallbackResult)
            } catch (fallbackError) {
                console.log("[v0] Échec du fallback pour createComment:", fallbackError.message)
            }
        }
        res.status(400).json({ error: error.message })
    }
}

// Get all comments
exports.getAllComments = async (req, res) => {
    try {
        const comments = await Comment.find()
        res.status(200).json(comments)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// Get comment by ID
exports.getCommentByID = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id)
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" })
        }
        res.status(200).json(comment)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// Get comments by exposant ID
exports.getCommentsByExposantID = async (req, res) => {
    try {
        const comments = await Comment.find({ exposantId: req.params.exposantId })

        if (comments.length === 0) {
            try {
                console.log("[v0] Aucun commentaire trouvé localement, tentative de fallback")
                const fallbackComments = await fallbackService.findCommentsByExposantId(req.params.exposantId)
                return res.status(200).json(fallbackComments)
            } catch (fallbackError) {
                console.log("[v0] Échec du fallback pour getCommentsByExposantID:", fallbackError.message)
            }
        }

        res.status(200).json(comments)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// Get comments by video ID
exports.getCommentsByVideoID = async (req, res) => {
    try {
        const comments = await Comment.find({ videoId: req.params.videoId })

        if (comments.length === 0) {
            try {
                console.log("[v0] Aucun commentaire trouvé localement pour cette vidéo, tentative de fallback")
                const fallbackComments = await fallbackService.findCommentsByVideoId(req.params.videoId)
                return res.status(200).json(fallbackComments)
            } catch (fallbackError) {
                console.log("[v0] Échec du fallback pour getCommentsByVideoID:", fallbackError.message)
            }
        }

        res.status(200).json(comments)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// Update a comment
exports.updateComment = async (req, res) => {
    try {
        const updatedComment = await Comment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        if (!updatedComment) {
            return res.status(404).json({ message: "Comment not found" })
        }
        res.status(200).json(updatedComment)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

// Delete a comment
exports.deleteComment = async (req, res) => {
    try {
        const deletedComment = await Comment.findByIdAndDelete(req.params.id)
        if (!deletedComment) {
            return res.status(404).json({ message: "Comment not found" })
        }
        res.status(200).json({ message: "Comment deleted successfully" })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}
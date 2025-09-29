const Like = require('../models/likeModel');

// Create a new like
exports.createLike = async (req, res) => {
    try {
        const newLike = new Like(req.body);
        await newLike.save();
        res.status(201).json(newLike);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get all likes
exports.getAllLikes = async (req, res) => {
    try {
        const likes = await Like.find();
        res.status(200).json(likes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get like by ID
exports.getLikeByID = async (req, res) => {
    try {
        const like = await Like.findById(req.params.id);
        if (!like) {
            return res.status(404).json({ message: 'Like not found' });
        }
        res.status(200).json(like);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get likes by exposant ID
exports.getLikesByExposantID = async (req, res) => {
    try {
        const likes = await Like.find({ exposantId: req.params.exposantId });
        res.status(200).json(likes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Toggle like
exports.toggleLike = async (req, res) => {
    const { exposantId, videoId } = req.body;
    try {
        const existingLike = await Like.findOne({ exposantId, videoId });
        if (existingLike) {
            await Like.findByIdAndDelete(existingLike._id);
        } else {
            const newLike = new Like({ exposantId, videoId });
            await newLike.save();
        }
        const likes = await Like.find();
        res.status(200).json(likes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get likes by video ID
exports.getLikesByVideoID = async (req, res) => {
    try {
        const likes = await Like.find({ videoId: req.params.videoId });
        res.status(200).json(likes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a like
exports.deleteLike = async (req, res) => {
    try {
        const deletedLike = await Like.findByIdAndDelete(req.params.id);
        if (!deletedLike) {
            return res.status(404).json({ message: 'Like not found' });
        }
        res.status(200).json({ message: 'Like deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

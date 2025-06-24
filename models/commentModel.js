const mongoose = require('mongoose');
const autopopulate = require('mongoose-autopopulate');
const Schema = mongoose.Schema;

const commentSchema = new mongoose.Schema({
    exposantId: {
        type: Schema.Types.ObjectId,
        ref: 'Exposant',
        required: true,
        autopopulate: true
    },
    videoId: {
        type: Schema.Types.ObjectId,
        ref: 'ExposantVideo',
        required: true,
        autopopulate: true
    },
    content: {
        type: String,
        required: true,
    }
}, { collection: 'comments', timestamps: true });

commentSchema.plugin(autopopulate);

module.exports = mongoose.model('Comment', commentSchema);

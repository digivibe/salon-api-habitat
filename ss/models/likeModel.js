const mongoose = require('mongoose');
const autopopulate = require('mongoose-autopopulate');
const Schema = mongoose.Schema;

const likeSchema = new mongoose.Schema({
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
}, { collection: 'likes', timestamps: true });

likeSchema.plugin(autopopulate);

module.exports = mongoose.model('Like', likeSchema);

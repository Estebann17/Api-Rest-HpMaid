const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  follower: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email: { type: String, required: true },
  },
  following: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email: { type: String, required: true },
  },
 
});

const Follow = mongoose.model('Follow', followSchema);

module.exports = Follow;

const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  title: String,
  mal_id: Number,
  content: mongoose.Schema.Types.Mixed,
  user: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
  },
 
});

const Card = mongoose.model('Card', cardSchema);

module.exports = Card;

const mongoose = require('mongoose');

const tradeRequestSchema = new mongoose.Schema({
  requester: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    cardsOffered: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Card',
    }],
  },
  targetUser: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    cardsOffered: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Card',
    }],
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'ready' ,'rejected'],
    default: 'pending',
  },
});

const TradeRequest = mongoose.model('tradeRequest', tradeRequestSchema);

module.exports = TradeRequest;

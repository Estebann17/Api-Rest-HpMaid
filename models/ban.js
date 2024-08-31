const mongoose = require('mongoose');

const banSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timeToReturn: {
    type: Date
  },
  responsable: {  
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reason: String
});

const Ban = mongoose.model('Ban', banSchema);

module.exports = Ban;

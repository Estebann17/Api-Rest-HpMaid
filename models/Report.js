const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  cause: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;

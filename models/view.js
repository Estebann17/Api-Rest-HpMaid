const mongoose = require("mongoose");

const viewSchema = new mongoose.Schema({
  viewer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const View = mongoose.model("View", viewSchema);

module.exports = View;

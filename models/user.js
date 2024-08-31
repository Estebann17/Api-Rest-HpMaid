const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: false,
  },
  nick: {
    type: String,
    required: false,
  },
  bio: {
    type: String,
    required: false,
  },
  image: {
    type: String,
    required: false,
  },
  banner: {
    type: String,
    required: false,
  },
  twitter: {
    type: String,
    required: false,
  },
  instagram: {
    type: String,
    required: false,
  },
  facebook: {
    type: String,
    required: false,
  },
  spotify: {
    type: String,
    required: false,
  },
  coins: {
    type: Number,
    default: 0,
  },
  userRole: { type: String, default: "user" },
  cards: [{ type: mongoose.Schema.Types.ObjectId, ref: "Card" }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  trades: [{ type: mongoose.Schema.Types.ObjectId, ref: "Trade" }],
  views: [{ type: mongoose.Schema.Types.ObjectId, ref: "View" }],
  favApiCards: [{ type: mongoose.Schema.Types.ObjectId, ref: "apiCards" }],
});
userSchema.plugin(mongoosePaginate);
const User = mongoose.model("User", userSchema);

module.exports = User;

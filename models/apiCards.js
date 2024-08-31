const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const cardSchema = new mongoose.Schema(
  {
    mal_id: Number,
    url: String,
    images: {
      jpg: {
        image_url: String,
      },
      webp: {
        image_url: String,
        small_image_url: String,
      },
    },
    name: String,
    name_kanji: String,
    nicknames: [String],
    favorites: Number,
    about: String,
    anime: [
      {
        role: String,
        anime: {
          mal_id: Number,
          title: String,
        },
      },
    ],
    manga: [
      {
        role: String,
        manga: {
          mal_id: Number,
          title: String,
          images: {
            jpg: {
              image_url: String,
              small_image_url: String,
              large_image_url: String,
            },
            webp: {
              image_url: String,
              small_image_url: String,
              large_image_url: String,
            },
          },
        },
      },
    ],
    voices: [
      {
        person: {
          mal_id: Number,
          url: String,
          images: {
            jpg: {
              image_url: String,
            },
          },
          name: String,
        },
        language: String,
      },
    ],
    rareza: String,
    monedas: { type: Number, index: true },
    favoritedBy: [String],
  },
  { timestamps: true }
);
cardSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("apiCards", cardSchema);

const mongoose = require("mongoose");

const playlistSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    tracks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Track",
      },
    ],
  },
  { timestamps: true },
);

playlistSchema.index({ owner: 1, updatedAt: -1 });

module.exports = mongoose.model("Playlist", playlistSchema);
import mongoose from "mongoose";

const albumSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  desc: {
    type: String,
    required: true,
  },
  bgColor: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  // Aggregated play count across all songs in this album.
  // Protected by a distributed Redis lock during worker updates.
  totalPlays: {
    type: Number,
    default: 0,
  },
});

const albumModel = mongoose.model("Album", albumSchema);
export default albumModel;

import mongoose from "mongoose";

const songSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  desc: {
    type: String,
    required: true,
  },
  album: {
    // type: mongoose.Schema.Types.ObjectId,
    // ref: "Album",
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  file: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  playCount: {
    type: Number,
    default: 0,
  },
});

const songModel = mongoose.model("Song", songSchema);
export default songModel;

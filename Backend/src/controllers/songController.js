import { v2 as cloudinary } from "cloudinary";
import songModel from "../models/songModel.js";
import {
  CACHE_KEYS,
  getCachedJson,
  setCachedJson,
  invalidateCatalogCache,
  INSTANCE_ID,
} from "../config/redis.js";

const addSong = async (req, res) => {
  try {
    const name = req.body.name;
    const desc = req.body.desc;
    const album = req.body.album;
    const audioFile = req.files.audio[0];
    const imageFile = req.files.image[0];
    const audioUpload = await cloudinary.uploader.upload(audioFile.path, {
      resource_type: "video",
    });
    const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
      resource_type: "image",
    });
    const duration = `${Math.floor(audioUpload.duration / 60)} : ${
      audioUpload.duration % 60
    }`;

    const songData = {
      name,
      desc,
      album,
      file: audioUpload.secure_url,
      image: imageUpload.secure_url,
      duration,
      playCount: 0,
    };

    console.log(songData);
    const song = songModel(songData);
    await song.save();
    await invalidateCatalogCache();
    res.status(201).json({ message: "Song added successfully", success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding song" });
  }
};

const listSong = async (req, res) => {
  try {
    const cached = await getCachedJson(CACHE_KEYS.SONGS);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      return res.status(200).json({
        songs: cached,
        success: true,
        cache: "HIT",
        instanceId: INSTANCE_ID,
      });
    }

    const allSongs = await songModel.find({});
    await setCachedJson(CACHE_KEYS.SONGS, allSongs);
    res.setHeader("X-Cache", "MISS");
    res.status(200).json({
      songs: allSongs,
      success: true,
      cache: "MISS",
      instanceId: INSTANCE_ID,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error retrieving songs" });
  }
};

const removeSong = async (req, res) => {
  try {
    await songModel.findByIdAndDelete(req.body.id);
    await invalidateCatalogCache();
    res.status(200).json({ message: "Song removed successfully", success: true });
  } catch (error) {
    res.status(500).json({ message: "Error removing song" });
  }
}

export { addSong, listSong, removeSong };

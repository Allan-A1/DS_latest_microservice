import { v2 as cloudinary } from "cloudinary";
import songModel from "../models/songModel.js";
import {
  CACHE_KEYS,
  getCachedJson,
  setCachedJson,
  invalidateCatalogCache,
  INSTANCE_ID,
  getTopTrendingSongIds,
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
};

const getTrendingSongs = async (req, res) => {
  try {
    const rawScores = await getTopTrendingSongIds(10);
    if (!rawScores || rawScores.length === 0) {
      const topMongo = await songModel.find({}).sort({ playCount: -1 }).limit(5);
      return res.status(200).json({
        success: true,
        source: "mongodb-fallback",
        instanceId: INSTANCE_ID,
        trending: topMongo.map((s) => ({ song: s, score: s.playCount || 0 })),
      });
    }

    const leaderboardItems = [];
    const songIds = [];
    for (let i = 0; i < rawScores.length; i += 2) {
      const songId = rawScores[i];
      const score = Number(rawScores[i + 1]);
      songIds.push(songId);
      leaderboardItems.push({ songId, score });
    }

    const songs = await songModel.find({ _id: { $in: songIds } });
    const songMap = new Map(songs.map((s) => [s._id.toString(), s]));

    const trending = leaderboardItems
      .filter((item) => songMap.has(item.songId))
      .map((item) => ({
        song: songMap.get(item.songId),
        trendingScore: item.score,
      }));

    res.status(200).json({
      success: true,
      source: "redis-leaderboard",
      instanceId: INSTANCE_ID,
      count: trending.length,
      trending,
    });
  } catch (error) {
    console.error("Error retrieving trending songs:", error);
    res.status(500).json({ success: false, message: "Error retrieving trending songs" });
  }
};

export { addSong, listSong, removeSong, getTrendingSongs };


import { v2 as cloudinary } from "cloudinary";
import albumModel from "../models/albumModel.js";
import {
  CACHE_KEYS,
  getCachedJson,
  setCachedJson,
  invalidateCatalogCache,
  INSTANCE_ID,
} from "../config/redis.js";

const addAlbum = async (req, res) => {
  try {
    const { name, desc, bgColor } = req.body;
    const imageFile = req.file;

    const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
      resource_type: "image",
    });

    const albumData = {
      name,
      desc,
      bgColor,
      image: imageUpload.secure_url,
    };
    const album = albumModel(albumData);
    await album.save();
    await invalidateCatalogCache();

    res.status(201).json({ message: "Album added successfully", album, success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error adding album" });
  }
};

const listAlbum = async (req, res) => {
  try {
    const cached = await getCachedJson(CACHE_KEYS.ALBUMS);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      return res.status(200).json({
        albums: cached,
        success: true,
        cache: "HIT",
        instanceId: INSTANCE_ID,
      });
    }

    const albums = await albumModel.find();
    await setCachedJson(CACHE_KEYS.ALBUMS, albums);
    res.setHeader("X-Cache", "MISS");
    res.status(200).json({
      albums,
      success: true,
      cache: "MISS",
      instanceId: INSTANCE_ID,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching albums" });
  }
};

const removeAlbum = async (req, res) => {
  try {
    const { id } = req.body;
    const deletedAlbum = await albumModel.findByIdAndDelete(id);
    if (!deletedAlbum) {
      return res.status(404).json({ message: "Album not found" });
    }
    await invalidateCatalogCache();
    res.status(200).json({ message: "Album deleted successfully", success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting album" });
  }
};

export { addAlbum, listAlbum, removeAlbum };

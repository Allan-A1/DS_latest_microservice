import React, { useContext, useEffect, useState } from "react";
import Navbar from "./Navbar";
import { useParams } from "react-router-dom";
import { assets } from "../assets/frontend-assets/assets";
import { PlayerContext } from "../context/PlayerContext";

const DisplayAlbum = () => {
  const { id } = useParams();
  const {
    songsData,
    albumsData,
    playWithId,
    playAlbum,
    track,
    isPlaying,
    play,
    pause,
    isLiked,
    toggleLike,
  } = useContext(PlayerContext);
  const [albumData, setAlbumData] = useState(null);

  useEffect(() => {
    const found = albumsData.find((item) => item._id === id);
    if (found) setAlbumData(found);
  }, [id, albumsData]);

  if (!albumData) {
    return (
      <div className="pb-16">
        <Navbar />
        <div className="text-center py-24 text-[#a7a7a7]">
          <p className="text-xl font-bold">Album not found</p>
          <p className="text-sm mt-1">This album may have been deleted or is still loading.</p>
        </div>
      </div>
    );
  }

  // Songs that belong to this album
  const albumSongs = songsData.filter((item) => item.album === albumData.name);
  const isCurrentAlbumPlaying =
    track && albumSongs.some((s) => s._id === track._id);

  const formatDuration = (raw) => {
    if (!raw) return "3:00";
    if (typeof raw === "string" && raw.includes(":")) {
      const parts = raw.split(":");
      const mins = parts[0].trim();
      const secs = Math.floor(parseFloat(parts[1]) || 0);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
    return raw;
  };

  return (
    <div className="pb-16">
      <Navbar />

      {/* Album Banner */}
      <div className="mt-8 flex gap-8 flex-col md:flex-row md:items-end">
        <img
          className="w-48 h-48 rounded object-cover shadow-2xl flex-shrink-0"
          src={albumData.image}
          alt={albumData.name}
        />
        <div className="flex flex-col">
          <p className="text-xs uppercase font-bold tracking-widest text-white/80">Album</p>
          <h2 className="text-4xl font-extrabold my-2 md:text-6xl text-white">
            {albumData.name}
          </h2>
          <h4 className="text-sm text-[#b3b3b3]">{albumData.desc}</h4>
          <p className="mt-2 flex items-center gap-2 flex-wrap text-xs text-[#d1d1d1]">
            <img src={assets.spotify_logo} className="inline-block w-5" alt="" />
            <b>Spotify</b> • <b>{albumSongs.length} songs</b>
            {albumData.totalPlays > 0 && (
              <span className="text-green-400 font-semibold ml-2">
                🎵 {albumData.totalPlays.toLocaleString()} total plays
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Action Buttons: Play Album */}
      <div className="my-6 flex items-center gap-5">
        {albumSongs.length > 0 && (
          <button
            onClick={() => {
              if (isCurrentAlbumPlaying) {
                isPlaying ? pause() : play();
              } else {
                playAlbum(albumData.name);
              }
            }}
            className="w-14 h-14 rounded-full bg-green-500 hover:scale-105 transition-transform flex items-center justify-center text-black shadow-xl"
            title={`Play ${albumData.name}`}
          >
            {isCurrentAlbumPlaying && isPlaying ? (
              <span className="text-2xl font-bold">⏸</span>
            ) : (
              <span className="text-2xl font-bold ml-1">▶</span>
            )}
          </button>
        )}
      </div>

      {/* Songs Table Header */}
      <div className="grid grid-cols-3 sm:grid-cols-4 mt-6 mb-3 pl-2 text-xs font-semibold uppercase tracking-wider text-[#a7a7a7]">
        <p>
          <b className="mr-4">#</b>Title
        </p>
        <p>Album</p>
        <p className="hidden sm:block">Plays</p>
        <img src={assets.clock_icon} className="m-auto w-4 opacity-70" alt="" />
      </div>
      <hr className="border-[#282828] mb-2" />

      {/* Songs List */}
      {albumSongs.length > 0 ? (
        <div className="flex flex-col gap-1">
          {albumSongs.map((item, idx) => {
            const isCurrent = track?._id === item._id;
            return (
              <div
                onClick={() => playWithId(item._id)}
                className={`grid grid-cols-3 sm:grid-cols-4 p-2 rounded-md hover:bg-[#ffffff15] cursor-pointer items-center text-[#a7a7a7] transition-colors ${
                  isCurrent ? "bg-[#ffffff10]" : ""
                }`}
                key={item._id}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className={`w-4 text-center text-sm ${isCurrent ? "text-green-500 font-bold" : ""}`}>
                    {isCurrent && isPlaying ? "▶" : idx + 1}
                  </span>
                  <img src={item.image} className="w-10 h-10 rounded object-cover flex-shrink-0" alt="" />
                  <div className="truncate">
                    <p className={`text-sm font-semibold truncate ${isCurrent ? "text-green-500" : "text-white"}`}>
                      {item.name}
                    </p>
                    <p className="text-xs text-[#a7a7a7] truncate">{item.desc}</p>
                  </div>
                </div>
                <p className="text-sm truncate">{albumData.name}</p>
                <p className="text-sm text-green-400 hidden sm:block">
                  {item.playCount || 0} plays
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(item._id);
                    }}
                    className="text-base hover:scale-110 transition-transform"
                    title={isLiked(item._id) ? "Unlike" : "Like"}
                  >
                    {isLiked(item._id) ? "💚" : "🤍"}
                  </button>
                  <span className="text-sm">{formatDuration(item.duration)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center bg-[#181818]/60 rounded-xl my-4 text-[#a7a7a7]">
          <p className="text-lg font-bold text-white mb-1">No songs in this album yet</p>
          <p className="text-sm">
            Add songs with album name <span className="text-white font-semibold">"{albumData.name}"</span> in the Admin panel.
          </p>
          <button
            onClick={() => window.open("http://localhost:5174", "_blank")}
            className="mt-4 px-4 py-2 bg-white text-black text-xs font-semibold rounded-full hover:scale-105 transition-transform"
          >
            Open Admin Panel
          </button>
        </div>
      )}
    </div>
  );
};

export default DisplayAlbum;



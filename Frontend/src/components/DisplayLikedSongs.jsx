import React, { useContext } from "react";
import Navbar from "./Navbar";
import { PlayerContext } from "../context/PlayerContext";
import { assets } from "../assets/frontend-assets/assets";

const DisplayLikedSongs = () => {
  const { songsData, likedSongs, playWithId, track, isPlaying, play, pause, toggleLike } =
    useContext(PlayerContext);

  const favoritedSongs = songsData.filter((s) => likedSongs.includes(s._id));

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
    <>
      <Navbar />
      {/* Header Banner */}
      <div className="mt-8 flex gap-6 flex-col md:flex-row md:items-end">
        <div className="w-48 h-48 rounded bg-gradient-to-br from-indigo-700 via-purple-600 to-pink-500 flex items-center justify-center shadow-2xl flex-shrink-0">
          <span className="text-6xl select-none">💜</span>
        </div>
        <div className="flex flex-col">
          <p className="text-sm font-semibold uppercase tracking-wider">Playlist</p>
          <h1 className="text-4xl md:text-6xl font-bold my-2 text-white">Liked Songs</h1>
          <p className="text-[#a7a7a7] text-sm flex items-center gap-2 mt-1">
            <span className="font-semibold text-white">Your Favorites</span> •{" "}
            <span>{favoritedSongs.length} songs</span>
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="my-6 flex items-center gap-4">
        {favoritedSongs.length > 0 && (
          <button
            onClick={() => {
              if (track && favoritedSongs.some((s) => s._id === track._id)) {
                isPlaying ? pause() : play();
              } else {
                playWithId(favoritedSongs[0]._id);
              }
            }}
            className="w-12 h-12 rounded-full bg-green-500 hover:scale-105 transition-transform flex items-center justify-center text-black shadow-lg"
            title="Play Liked Songs"
          >
            {isPlaying && favoritedSongs.some((s) => s._id === track?._id) ? (
              <span className="text-xl">⏸</span>
            ) : (
              <span className="text-xl ml-1">▶</span>
            )}
          </button>
        )}
      </div>

      {/* Song Table */}
      {favoritedSongs.length === 0 ? (
        <div className="text-center py-16 bg-[#181818]/40 rounded-xl my-6">
          <p className="text-2xl font-bold mb-2">Songs you like will appear here</p>
          <p className="text-sm text-[#a7a7a7] max-w-md mx-auto">
            Save songs by tapping the heart icon on any track in the home or search page.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 mt-6 mb-3 pl-2 text-xs font-semibold uppercase tracking-wider text-[#a7a7a7]">
            <p>
              <b className="mr-4">#</b>Title
            </p>
            <p>Album</p>
            <p className="hidden sm:block">Plays</p>
            <img src={assets.clock_icon} className="m-auto w-4 opacity-70" alt="" />
          </div>
          <hr className="border-[#282828] mb-2" />
          <div className="flex flex-col gap-1 pb-16">
            {favoritedSongs.map((item, idx) => {
              const isCurrent = track?._id === item._id;
              return (
                <div
                  key={item._id}
                  onClick={() => playWithId(item._id)}
                  className={`grid grid-cols-3 sm:grid-cols-4 p-2 rounded-md hover:bg-[#ffffff15] cursor-pointer items-center text-[#a7a7a7] transition-colors ${
                    isCurrent ? "bg-[#ffffff10]" : ""
                  }`}
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
                  <p className="text-sm truncate">{item.album || "Single"}</p>
                  <p className="text-sm text-green-400 hidden sm:block">{item.playCount || 0} plays</p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(item._id);
                      }}
                      className="text-base hover:scale-110 transition-transform"
                    >
                      💚
                    </button>
                    <span className="text-sm">{formatDuration(item.duration)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
};

export default DisplayLikedSongs;

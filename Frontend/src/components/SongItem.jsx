import React, { useContext } from "react";
import { PlayerContext } from "../context/PlayerContext";

const SongItem = ({ name, image, desc, id, playCount = 0 }) => {
  const { playWithId, track, isPlaying, play, pause, isLiked, toggleLike } =
    useContext(PlayerContext);

  const isCurrent = track?._id === id;

  const handlePlayClick = (e) => {
    e.stopPropagation();
    if (isCurrent) {
      isPlaying ? pause() : play();
    } else {
      playWithId(id);
    }
  };

  return (
    <div
      onClick={() => playWithId(id)}
      className="min-w-[170px] max-w-[190px] p-3 rounded-lg cursor-pointer bg-[#181818]/60 hover:bg-[#282828] transition duration-200 group relative flex-shrink-0"
    >
      <div className="relative w-full aspect-square mb-3">
        <img
          src={image}
          className="w-full h-full object-cover rounded-md shadow-md"
          alt={name}
        />
        {/* Floating Play Button on hover */}
        <button
          onClick={handlePlayClick}
          className={`absolute bottom-2 right-2 w-10 h-10 rounded-full bg-green-500 shadow-xl flex items-center justify-center text-black hover:scale-105 transition-all duration-200 ${
            isCurrent
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
          }`}
          title={isCurrent && isPlaying ? "Pause" : "Play"}
        >
          {isCurrent && isPlaying ? (
            <span className="text-sm font-bold">⏸</span>
          ) : (
            <span className="text-sm font-bold ml-0.5">▶</span>
          )}
        </button>
      </div>

      <div className="flex items-start justify-between gap-1">
        <p className={`font-bold text-sm truncate ${isCurrent ? "text-green-500" : "text-white"}`}>
          {name}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(id);
          }}
          className="text-xs hover:scale-110 transition-transform opacity-70 hover:opacity-100"
          title={isLiked(id) ? "Remove from Liked Songs" : "Save to Liked Songs"}
        >
          {isLiked(id) ? "💚" : "🤍"}
        </button>
      </div>

      <p className="text-[#a7a7a7] text-xs truncate mt-0.5">{desc}</p>
      <p className="text-[11px] text-green-400/90 font-medium mt-1.5">
        🎵 {playCount} plays
      </p>
    </div>
  );
};

export default SongItem;


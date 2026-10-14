import React, { useContext } from "react";
import { PlayerContext } from "../context/PlayerContext";

const QueueDrawer = () => {
  const {
    isQueueOpen,
    setIsQueueOpen,
    songsData,
    track,
    isPlaying,
    playWithId,
    toggleLike,
    isLiked,
  } = useContext(PlayerContext);

  if (!isQueueOpen) return null;

  // Identify current track index and upcoming queue
  const currentIdx = track ? songsData.findIndex((s) => s._id === track._id) : -1;
  const nextSongs =
    currentIdx !== -1
      ? [...songsData.slice(currentIdx + 1), ...songsData.slice(0, currentIdx)]
      : songsData;

  return (
    <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-[#181818] border-l border-[#282828] z-50 shadow-2xl flex flex-col p-4 text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#282828]">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span>🎧 Play Queue</span>
        </h2>
        <button
          onClick={() => setIsQueueOpen(false)}
          className="text-[#a7a7a7] hover:text-white p-1 rounded-full text-base hover:bg-[#282828] transition-colors"
          title="Close Queue"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto mt-4 space-y-6 pr-1">
        {/* Now Playing */}
        {track && (
          <div>
            <p className="text-xs font-bold text-[#a7a7a7] uppercase tracking-wider mb-2">
              Now Playing
            </p>
            <div className="flex items-center justify-between p-2 rounded-lg bg-green-950/40 border border-green-800/40">
              <div className="flex items-center gap-3 overflow-hidden">
                <img
                  src={track.image}
                  className="w-12 h-12 rounded object-cover flex-shrink-0"
                  alt=""
                />
                <div className="truncate">
                  <p className="text-sm font-bold text-green-400 truncate flex items-center gap-1.5">
                    {isPlaying && <span className="animate-pulse">▶</span>}
                    {track.name}
                  </p>
                  <p className="text-xs text-[#a7a7a7] truncate">{track.desc}</p>
                </div>
              </div>
              <button
                onClick={() => toggleLike(track._id)}
                className="text-base hover:scale-110 transition-transform ml-2"
              >
                {isLiked(track._id) ? "💚" : "🤍"}
              </button>
            </div>
          </div>
        )}

        {/* Next Up */}
        <div>
          <p className="text-xs font-bold text-[#a7a7a7] uppercase tracking-wider mb-2">
            Next in Queue ({nextSongs.length})
          </p>
          {nextSongs.length > 0 ? (
            <div className="flex flex-col gap-1">
              {nextSongs.map((s, idx) => (
                <div
                  key={s._id}
                  onClick={() => playWithId(s._id)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-[#242424] cursor-pointer group transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="text-xs text-[#a7a7a7] w-4 text-center group-hover:hidden">
                      {idx + 1}
                    </span>
                    <span className="text-xs text-green-400 w-4 text-center hidden group-hover:inline">
                      ▶
                    </span>
                    <img
                      src={s.image}
                      className="w-10 h-10 rounded object-cover flex-shrink-0"
                      alt=""
                    />
                    <div className="truncate">
                      <p className="text-sm font-semibold truncate group-hover:text-green-400 text-white transition-colors">
                        {s.name}
                      </p>
                      <p className="text-xs text-[#a7a7a7] truncate">{s.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#a7a7a7]">
                    <span className="text-green-400/80">{s.playCount || 0} plays</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(s._id);
                      }}
                      className="text-sm hover:scale-110 transition-transform"
                    >
                      {isLiked(s._id) ? "💚" : "🤍"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#a7a7a7]">No more tracks in queue.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QueueDrawer;

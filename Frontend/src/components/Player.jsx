import React, { useContext, useState } from "react";
import { assets } from "../assets/frontend-assets/assets";
import { PlayerContext } from "../context/PlayerContext";

const Player = () => {
  const {
    seekBg,
    seekBar,
    isPlaying,
    play,
    pause,
    track,
    time,
    previous,
    next,
    seekSong,
    volume,
    setVolume,
    toggleMute,
    isShuffle,
    toggleShuffle,
    isLoop,
    toggleLoop,
    isQueueOpen,
    setIsQueueOpen,
    isLiked,
    toggleLike,
  } = useContext(PlayerContext);

  const [lyricsNotice, setLyricsNotice] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Fullscreen error:", err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error("Exit fullscreen error:", err);
      });
    }
  };

  const showLyrics = () => {
    setLyricsNotice(true);
    setTimeout(() => setLyricsNotice(false), 3000);
  };

  if (!track) return null;

  return (
    <div className="h-[12%] sm:h-[10%] bg-black border-t border-[#222] flex justify-between items-center text-white px-3 sm:px-4 z-40 relative">
      {/* Toast for lyrics */}
      {lyricsNotice && (
        <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 bg-[#282828] text-white text-xs px-3 py-1.5 rounded-full shadow-lg border border-[#3e3e3e]">
          🎤 Lyrics synced stream not available for this song
        </div>
      )}

      {/* Left: Track info + Heart button */}
      <div className="flex items-center gap-3 max-w-[30%] overflow-hidden">
        <img
          className="w-12 h-12 rounded object-cover shadow-sm flex-shrink-0"
          src={track.image}
          alt={track.name}
        />
        <div className="truncate">
          <p className="text-xs sm:text-sm font-semibold truncate hover:underline cursor-pointer">
            {track.name}
          </p>
          <p className="text-[10px] sm:text-xs text-[#a7a7a7] truncate">
            {track.desc || track.album || "Single"}
          </p>
        </div>
        <button
          onClick={() => toggleLike(track._id)}
          className="text-base sm:text-lg hover:scale-110 transition-transform ml-1 flex-shrink-0"
          title={isLiked(track._id) ? "Remove from Liked" : "Save to Liked"}
        >
          {isLiked(track._id) ? "💚" : "🤍"}
        </button>
      </div>

      {/* Center: Playback controls + Seek Bar */}
      <div className="flex flex-col items-center gap-1 flex-1 max-w-xl px-2">
        <div className="flex gap-4 sm:gap-6 items-center">
          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            className="hidden sm:block transition-transform hover:scale-110"
            title={isShuffle ? "Shuffle On" : "Shuffle Off"}
          >
            <img
              className="w-4 h-4 cursor-pointer"
              style={{
                filter: isShuffle
                  ? "invert(58%) sepia(85%) saturate(450%) hue-rotate(85deg)"
                  : "none",
                opacity: isShuffle ? 1 : 0.6,
              }}
              src={assets.shuffle_icon}
              alt="shuffle"
            />
          </button>

          {/* Previous */}
          <button
            onClick={previous}
            className="hover:scale-110 transition-transform"
            title="Previous"
          >
            <img className="w-4 h-4 cursor-pointer" src={assets.prev_icon} alt="previous" />
          </button>

          {/* Play / Pause (large circular button) */}
          <button
            onClick={isPlaying ? pause : play}
            className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-md"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <img className="w-3.5 h-3.5" src={assets.pause_icon} alt="pause" />
            ) : (
              <img className="w-3.5 h-3.5 ml-0.5" src={assets.play_icon} alt="play" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={next}
            className="hover:scale-110 transition-transform"
            title="Next"
          >
            <img className="w-4 h-4 cursor-pointer" src={assets.next_icon} alt="next" />
          </button>

          {/* Loop */}
          <button
            onClick={toggleLoop}
            className="hidden sm:block transition-transform hover:scale-110"
            title={isLoop ? "Loop On" : "Loop Off"}
          >
            <img
              className="w-4 h-4 cursor-pointer"
              style={{
                filter: isLoop
                  ? "invert(58%) sepia(85%) saturate(450%) hue-rotate(85deg)"
                  : "none",
                opacity: isLoop ? 1 : 0.6,
              }}
              src={assets.loop_icon}
              alt="loop"
            />
          </button>
        </div>

        {/* Seek Bar */}
        <div className="w-full flex items-center justify-center gap-2 text-[11px] text-[#a7a7a7] select-none">
          <span className="w-8 text-right font-mono">
            {time.currentTime.minutes}:{String(time.currentTime.seconds).padStart(2, "0")}
          </span>
          <div
            ref={seekBg}
            onClick={seekSong}
            className="w-full max-w-[420px] h-1 bg-[#4d4d4d] hover:h-1.5 rounded-full cursor-pointer relative group transition-all"
          >
            <div
              ref={seekBar}
              className="h-full bg-white group-hover:bg-green-500 rounded-full transition-colors relative"
              style={{ width: "0%" }}
            />
          </div>
          <span className="w-8 font-mono">
            {time.duration.minutes}:{String(time.duration.seconds).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Right: Volume & Extras */}
      <div className="flex items-center gap-3 max-w-[30%] justify-end">
        {/* Lyrics */}
        <button
          onClick={showLyrics}
          className="hidden md:block opacity-70 hover:opacity-100 hover:scale-110 transition-all"
          title="Lyrics"
        >
          <img className="w-4 h-4" src={assets.mic_icon} alt="mic" />
        </button>

        {/* Queue Drawer Toggle */}
        <button
          onClick={() => setIsQueueOpen((prev) => !prev)}
          className={`opacity-70 hover:opacity-100 hover:scale-110 transition-all ${
            isQueueOpen ? "text-green-500 opacity-100" : ""
          }`}
          title="Play Queue"
        >
          <img
            className="w-4 h-4"
            style={{ filter: isQueueOpen ? "invert(58%) sepia(85%) saturate(450%) hue-rotate(85deg)" : "none" }}
            src={assets.queue_icon}
            alt="queue"
          />
        </button>

        {/* Speaker / Mute Toggle */}
        <button
          onClick={toggleMute}
          className="hidden sm:block opacity-70 hover:opacity-100 hover:scale-110 transition-all"
          title={volume === 0 ? "Unmute" : "Mute"}
        >
          <img
            className="w-4 h-4"
            src={volume === 0 ? assets.speaker_icon : assets.volume_icon}
            alt="volume"
          />
        </button>

        {/* Functional Volume Slider */}
        <div className="hidden sm:flex items-center">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-16 md:w-20 accent-green-500 cursor-pointer h-1"
            title={`Volume: ${Math.round(volume * 100)}%`}
          />
        </div>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="hidden lg:block opacity-70 hover:opacity-100 hover:scale-110 transition-all"
          title="Toggle Fullscreen"
        >
          <img className="w-4 h-4" src={assets.zoom_icon} alt="fullscreen" />
        </button>
      </div>
    </div>
  );
};

export default Player;


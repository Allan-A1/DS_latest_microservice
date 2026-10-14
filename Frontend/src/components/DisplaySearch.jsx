import React, { useContext, useState } from "react";
import Navbar from "./Navbar";
import { PlayerContext } from "../context/PlayerContext";
import { assets } from "../assets/frontend-assets/assets";
import { useNavigate } from "react-router-dom";

const DisplaySearch = () => {
  const {
    songsData,
    albumsData,
    playWithId,
    track,
    isPlaying,
    searchQuery,
    setSearchQuery,
    isLiked,
    toggleLike,
  } = useContext(PlayerContext);

  const navigate = useNavigate();
  const [filterType, setFilterType] = useState("all"); // "all", "songs", "albums"

  const q = (searchQuery || "").trim().toLowerCase();

  const matchedSongs = q
    ? songsData.filter(
        (s) =>
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.album && s.album.toLowerCase().includes(q)) ||
          (s.desc && s.desc.toLowerCase().includes(q))
      )
    : [];

  const matchedAlbums = q
    ? albumsData.filter(
        (a) =>
          (a.name && a.name.toLowerCase().includes(q)) ||
          (a.desc && a.desc.toLowerCase().includes(q))
      )
    : [];

  const topResult = matchedSongs[0] || matchedAlbums[0];

  // Browse categories when not searching
  const browseCategories = [
    { name: "Pop", color: "bg-pink-600" },
    { name: "Hip-Hop", color: "bg-orange-600" },
    { name: "Rock", color: "bg-red-700" },
    { name: "Chill", color: "bg-blue-600" },
    { name: "Workout", color: "bg-emerald-600" },
    { name: "Party", color: "bg-purple-600" },
    { name: "Focus", color: "bg-teal-700" },
    { name: "Sleep", color: "bg-indigo-800" },
  ];

  return (
    <div className="pb-16">
      <Navbar />

      {/* Search Input Bar (in page) */}
      <div className="mt-4 mb-6 flex items-center gap-3 bg-[#242424] rounded-full px-4 py-3 max-w-xl border border-transparent focus-within:border-white transition-colors">
        <img src={assets.search_icon} className="w-5 h-5 opacity-70" alt="Search" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="What do you want to play? (Song, artist, album...)"
          className="bg-transparent w-full outline-none text-white text-sm placeholder:text-[#a7a7a7]"
          autoFocus
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-xs text-[#a7a7a7] hover:text-white px-2 py-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category filter pills if search is active */}
      {q && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilterType("all")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filterType === "all" ? "bg-white text-black" : "bg-[#2a2a2a] text-white hover:bg-[#333]"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType("songs")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filterType === "songs" ? "bg-white text-black" : "bg-[#2a2a2a] text-white hover:bg-[#333]"
            }`}
          >
            Songs ({matchedSongs.length})
          </button>
          <button
            onClick={() => setFilterType("albums")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filterType === "albums" ? "bg-white text-black" : "bg-[#2a2a2a] text-white hover:bg-[#333]"
            }`}
          >
            Albums ({matchedAlbums.length})
          </button>
        </div>
      )}

      {/* Search Results */}
      {q ? (
        <div>
          {matchedSongs.length === 0 && matchedAlbums.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl font-bold mb-2">No results found for "{searchQuery}"</p>
              <p className="text-sm text-[#a7a7a7]">
                Please check your spelling, or try searching for another song or artist.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Top Result + Songs Side-by-Side (Spotify style) */}
              {filterType !== "albums" && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Top Result Card */}
                  {topResult && (
                    <div className="lg:col-span-2 bg-[#181818] hover:bg-[#282828] p-5 rounded-lg group transition duration-300 relative cursor-pointer"
                         onClick={() => {
                           if (topResult.file) {
                             playWithId(topResult._id);
                           } else {
                             navigate(`/album/${topResult._id}`);
                           }
                         }}>
                      <p className="text-xl font-bold mb-3 text-white">Top Result</p>
                      <img
                        src={topResult.image}
                        className="w-24 h-24 rounded-md object-cover shadow-lg mb-4"
                        alt={topResult.name}
                      />
                      <h3 className="text-2xl font-bold text-white mb-1 truncate">{topResult.name}</h3>
                      <p className="text-sm text-[#a7a7a7] mb-3">
                        {topResult.file ? "Song" : "Album"} • {topResult.album || topResult.desc || "Music"}
                      </p>
                      <span className="inline-block px-3 py-1 bg-black/40 text-xs rounded-full uppercase tracking-wider text-white">
                        {topResult.file ? "Song" : "Album"}
                      </span>
                    </div>
                  )}

                  {/* Songs List */}
                  <div className={`flex flex-col gap-2 ${topResult ? "lg:col-span-3" : "lg:col-span-5"}`}>
                    <p className="text-xl font-bold mb-1 text-white">Songs</p>
                    {matchedSongs.slice(0, 4).map((s) => {
                      const isCurrent = track?._id === s._id;
                      return (
                        <div
                          key={s._id}
                          onClick={() => playWithId(s._id)}
                          className="flex items-center justify-between p-2 rounded-md hover:bg-[#ffffff15] group cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <img src={s.image} className="w-10 h-10 rounded object-cover flex-shrink-0" alt="" />
                            <div className="truncate">
                              <p className={`text-sm font-semibold truncate ${isCurrent ? "text-green-500" : "text-white"}`}>
                                {s.name}
                              </p>
                              <p className="text-xs text-[#a7a7a7] truncate">{s.desc}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-[#a7a7a7]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLike(s._id);
                              }}
                              className="text-base hover:scale-110 transition-transform"
                            >
                              {isLiked(s._id) ? "💚" : "🤍"}
                            </button>
                            <span className="text-green-400">{s.playCount || 0} plays</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Matching Albums */}
              {filterType !== "songs" && matchedAlbums.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4 text-white">Albums</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {matchedAlbums.map((a) => (
                      <div
                        key={a._id}
                        onClick={() => navigate(`/album/${a._id}`)}
                        className="bg-[#181818] hover:bg-[#282828] p-4 rounded-lg cursor-pointer transition duration-300 group"
                      >
                        <img src={a.image} className="w-full aspect-square rounded-md object-cover shadow-md mb-3" alt="" />
                        <h4 className="font-bold text-sm text-white truncate">{a.name}</h4>
                        <p className="text-xs text-[#a7a7a7] truncate mt-1">{a.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Default Browse Categories when no search input */
        <div>
          <h2 className="text-2xl font-bold mb-5 text-white">Browse All</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {browseCategories.map((cat) => (
              <div
                key={cat.name}
                onClick={() => setSearchQuery(cat.name)}
                className={`${cat.color} h-36 rounded-xl p-4 font-bold text-xl cursor-pointer hover:scale-105 transition-transform duration-200 relative overflow-hidden shadow-lg select-none`}
              >
                <span>{cat.name}</span>
                <span className="absolute bottom-2 right-3 text-4xl opacity-20">🎵</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DisplaySearch;

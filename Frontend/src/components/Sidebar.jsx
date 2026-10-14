import React, { useContext, useState } from "react";
import { assets } from "../assets/frontend-assets/assets";
import { useNavigate, useLocation } from "react-router-dom";
import { PlayerContext } from "../context/PlayerContext";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { albumsData, likedSongs, refreshData } = useContext(PlayerContext);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const isHome = location.pathname === "/";
  const isSearch = location.pathname === "/search";
  const isLiked = location.pathname === "/liked-songs";

  return (
    <div className="w-[25%] h-full p-2 flex flex-col gap-2 text-white hidden md:flex select-none">
      {/* Top Nav: Home & Search */}
      <div className="bg-[#121212] rounded-lg p-4 flex flex-col gap-4">
        <div
          onClick={() => navigate("/")}
          className={`flex items-center gap-4 cursor-pointer transition-colors ${
            isHome ? "text-white" : "text-[#b3b3b3] hover:text-white"
          }`}
        >
          <img
            className="w-6 h-6"
            src={assets.home_icon}
            alt="Home"
            style={{ opacity: isHome ? 1 : 0.7 }}
          />
          <p className="font-bold text-sm">Home</p>
        </div>

        <div
          onClick={() => navigate("/search")}
          className={`flex items-center gap-4 cursor-pointer transition-colors ${
            isSearch ? "text-white" : "text-[#b3b3b3] hover:text-white"
          }`}
        >
          <img
            className="w-6 h-6"
            src={assets.search_icon}
            alt="Search"
            style={{ opacity: isSearch ? 1 : 0.7 }}
          />
          <p className="font-bold text-sm">Search</p>
        </div>
      </div>

      {/* Library Section */}
      <div className="bg-[#121212] flex-1 rounded-lg flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="p-4 flex items-center justify-between text-[#b3b3b3] hover:text-white transition-colors">
          <div
            onClick={() => navigate("/liked-songs")}
            className="flex items-center gap-3 cursor-pointer"
          >
            <img className="w-6 h-6" src={assets.stack_icon} alt="Library" />
            <p className="font-bold text-sm text-white">Your Library</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshData && refreshData()}
              className="p-1 hover:bg-[#282828] rounded-full transition-colors"
              title="Refresh Library"
            >
              <img src={assets.arrow_icon} className="w-4 h-4 opacity-70 hover:opacity-100" alt="Refresh" />
            </button>
            <button
              onClick={() => setShowAddMenu((prev) => !prev)}
              className="p-1 hover:bg-[#282828] rounded-full transition-colors"
              title="Add Playlist or Album"
            >
              <img src={assets.plus_icon} className="w-4 h-4 opacity-70 hover:opacity-100" alt="Add" />
            </button>
          </div>
        </div>

        {/* Add Menu Popup */}
        {showAddMenu && (
          <div className="mx-3 mb-2 p-3 bg-[#282828] rounded-lg shadow-xl border border-[#3e3e3e] text-xs">
            <p className="font-bold text-white mb-1">Create Playlist / Album</p>
            <p className="text-[#a7a7a7] text-[11px] mb-2">
              Add new tracks and albums through the Admin Panel.
            </p>
            <button
              onClick={() => {
                window.open("http://localhost:5174", "_blank");
                setShowAddMenu(false);
              }}
              className="w-full py-1.5 bg-green-500 text-black font-bold rounded hover:scale-[1.02] transition-transform text-center"
            >
              Open Admin Panel (:5174)
            </button>
          </div>
        )}

        {/* Scrollable Library List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 flex flex-col gap-1">
          {/* Liked Songs Pinned Item */}
          <div
            onClick={() => navigate("/liked-songs")}
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
              isLiked ? "bg-[#282828]" : "hover:bg-[#222]"
            }`}
          >
            <div className="w-11 h-11 rounded-md bg-gradient-to-br from-indigo-700 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-lg">💜</span>
            </div>
            <div className="truncate">
              <p className={`text-sm font-semibold truncate ${isLiked ? "text-green-400" : "text-white"}`}>
                Liked Songs
              </p>
              <p className="text-xs text-[#a7a7a7] flex items-center gap-1">
                📌 Playlist • {likedSongs.length} songs
              </p>
            </div>
          </div>

          {/* Albums List */}
          {albumsData.length > 0 ? (
            albumsData.map((a) => {
              const isSelected = location.pathname === `/album/${a._id}`;
              return (
                <div
                  key={a._id}
                  onClick={() => navigate(`/album/${a._id}`)}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? "bg-[#282828]" : "hover:bg-[#222]"
                  }`}
                >
                  <img
                    src={a.image}
                    className="w-11 h-11 rounded-md object-cover flex-shrink-0 shadow-md"
                    alt=""
                  />
                  <div className="truncate">
                    <p className={`text-sm font-semibold truncate ${isSelected ? "text-green-400" : "text-white"}`}>
                      {a.name}
                    </p>
                    <p className="text-xs text-[#a7a7a7] truncate">
                      Album • {a.desc}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 bg-[#1f1f1f] rounded-lg mt-2 text-xs flex flex-col gap-2">
              <p className="font-bold text-white">Create your first playlist</p>
              <p className="text-[#a7a7a7] text-[11px]">It's easy, we'll help you</p>
              <button
                onClick={() => window.open("http://localhost:5174", "_blank")}
                className="px-3 py-1.5 bg-white text-black font-bold rounded-full w-fit hover:scale-105 transition-transform"
              >
                Create Playlist
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;



import React, { useContext, useState } from "react";
import { assets } from "../assets/frontend-assets/assets";
import { useNavigate, useLocation } from "react-router-dom";
import { PlayerContext } from "../context/PlayerContext";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { searchQuery, setSearchQuery, activeFilter, setActiveFilter } =
    useContext(PlayerContext);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  const filters = ["All", "Music", "Podcasts"];

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (location.pathname !== "/search") {
      navigate("/search");
    }
  };

  return (
    <>
      <div className="w-full flex justify-between items-center font-semibold gap-3 relative">
        {/* Left: Navigation Arrows + Search Input */}
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-full bg-black/70 hover:bg-black flex items-center justify-center transition-colors"
              title="Go Back"
            >
              <img src={assets.arrow_left} className="w-4 h-4" alt="Back" />
            </button>
            <button
              onClick={() => navigate(1)}
              className="w-8 h-8 rounded-full bg-black/70 hover:bg-black flex items-center justify-center transition-colors"
              title="Go Forward"
            >
              <img src={assets.arrow_right} className="w-4 h-4" alt="Forward" />
            </button>
          </div>

          {/* Quick Search bar in Navbar */}
          <div className="flex items-center gap-2 bg-[#242424] hover:bg-[#2a2a2a] rounded-full px-3 py-1.5 flex-1 border border-transparent focus-within:border-white transition-all">
            <img src={assets.search_icon} className="w-4 h-4 opacity-70" alt="Search" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search songs, albums..."
              className="bg-transparent w-full text-xs text-white outline-none placeholder:text-[#a7a7a7]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-[#a7a7a7] hover:text-white px-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.open("https://www.spotify.com/premium/", "_blank")}
            className="bg-white text-black text-xs font-bold px-3.5 py-1.5 rounded-full hidden sm:block hover:scale-105 transition-transform"
          >
            Explore Premium
          </button>
          <button
            onClick={() => setShowInstallModal(true)}
            className="bg-black/60 hover:bg-black py-1.5 px-3 rounded-full text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
          >
            <span>⬇</span> Install App
          </button>

          {/* User Profile Avatar with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="bg-purple-600 hover:scale-105 transition-transform w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-md"
              title="User Account"
            >
              A
            </button>

            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-[#282828] rounded-lg shadow-2xl p-1 z-50 text-xs border border-[#3e3e3e]">
                  <div className="px-3 py-2 border-b border-[#3e3e3e]">
                    <p className="font-bold text-white">Allan (Admin)</p>
                    <p className="text-[#a7a7a7] text-[11px]">allan@example.com</p>
                  </div>
                  <button
                    onClick={() => {
                      window.open("http://localhost:5174", "_blank");
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-white hover:bg-[#3e3e3e] rounded flex items-center justify-between transition-colors"
                  >
                    <span>🛠️ Open Admin Panel</span>
                    <span className="text-[10px] text-green-400 font-mono">:5174</span>
                  </button>
                  <button
                    onClick={() => {
                      window.open("http://localhost:8080", "_blank");
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-white hover:bg-[#3e3e3e] rounded flex items-center justify-between transition-colors"
                  >
                    <span>📊 Redpanda Kafka Console</span>
                    <span className="text-[10px] text-orange-400 font-mono">:8080</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate("/liked-songs");
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-white hover:bg-[#3e3e3e] rounded transition-colors"
                  >
                    💜 Liked Songs
                  </button>
                  <div className="border-t border-[#3e3e3e] my-1" />
                  <button
                    onClick={() => {
                      alert("Spotify Clone is currently running in local mode.");
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-[#a7a7a7] hover:text-white hover:bg-[#3e3e3e] rounded transition-colors"
                  >
                    ⚙️ Settings
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filter Chips (Only show on Home route) */}
      {location.pathname === "/" && (
        <div className="flex items-center gap-2 mt-4">
          {filters.map((f) => (
            <p
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3.5 py-1 rounded-full cursor-pointer text-xs font-semibold transition-colors ${
                activeFilter === f
                  ? "bg-white text-black"
                  : "bg-[#242424] text-white hover:bg-[#2a2a2a]"
              }`}
            >
              {f}
            </p>
          ))}
        </div>
      )}

      {/* Install App Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#242424] border border-[#3e3e3e] rounded-xl max-w-sm w-full p-6 text-center shadow-2xl">
            <span className="text-4xl mb-3 inline-block">📱</span>
            <h3 className="text-xl font-bold text-white mb-2">Install Spotify Web</h3>
            <p className="text-xs text-[#a7a7a7] mb-5">
              Enjoy music on any device! You can install Spotify as an app directly through your browser's address bar (look for the install icon ⊕ on Google Chrome or Edge).
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowInstallModal(false)}
                className="px-5 py-2 bg-green-500 text-black font-bold text-xs rounded-full hover:scale-105 transition-transform"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { assets } from "../assets/frontend-assets/assets";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === "/";
  const isSearch = location.pathname === "/search";
  const isLiked = location.pathname === "/liked-songs";

  return (
    <div className="md:hidden flex items-center justify-around bg-[#121212] border-t border-[#282828] py-2 px-4 z-40 fixed bottom-0 left-0 right-0">
      <button
        onClick={() => navigate("/")}
        className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
          isHome ? "text-white" : "text-[#a7a7a7] hover:text-white"
        }`}
      >
        <img
          src={assets.home_icon}
          className="w-5 h-5"
          style={{ opacity: isHome ? 1 : 0.6 }}
          alt="Home"
        />
        <span>Home</span>
      </button>

      <button
        onClick={() => navigate("/search")}
        className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
          isSearch ? "text-white" : "text-[#a7a7a7] hover:text-white"
        }`}
      >
        <img
          src={assets.search_icon}
          className="w-5 h-5"
          style={{ opacity: isSearch ? 1 : 0.6 }}
          alt="Search"
        />
        <span>Search</span>
      </button>

      <button
        onClick={() => navigate("/liked-songs")}
        className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
          isLiked ? "text-white" : "text-[#a7a7a7] hover:text-white"
        }`}
      >
        <span className="text-base leading-5">💜</span>
        <span>Liked</span>
      </button>

      <button
        onClick={() => window.open("http://localhost:5174", "_blank")}
        className="flex flex-col items-center gap-1 text-[11px] font-medium text-[#a7a7a7] hover:text-white transition-colors"
      >
        <span className="text-base leading-5">🛠️</span>
        <span>Admin</span>
      </button>
    </div>
  );
};

export default BottomNav;

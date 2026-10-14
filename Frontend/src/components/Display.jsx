import React, { useContext, useEffect, useRef } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import DisplayHome from "./DisplayHome";
import DisplayAlbum from "./DisplayAlbum";
import DisplaySearch from "./DisplaySearch";
import DisplayLikedSongs from "./DisplayLikedSongs";
import { PlayerContext } from "../context/PlayerContext";

const Display = () => {
  const { albumsData } = useContext(PlayerContext);

  const displayRef = useRef();
  const location = useLocation();
  const isAlbum = location.pathname.includes("album");
  const isLiked = location.pathname.includes("liked-songs");
  const albumId = isAlbum ? location.pathname.split("/").pop() : "";

  const bgColor =
    isAlbum && albumsData.length > 0
      ? (albumsData.find((album) => album._id === albumId)?.bgColor ?? "#121212")
      : isLiked
      ? "#3b1e54"
      : "#121212";

  useEffect(() => {
    if (displayRef.current) {
      if (isAlbum || isLiked) {
        displayRef.current.style.background = `linear-gradient(${bgColor}, #121212)`;
      } else {
        displayRef.current.style.background = "#121212";
      }
    }
  }, [location.pathname, bgColor, isAlbum, isLiked]);

  return (
    <div
      ref={displayRef}
      className="w-[100%] m-2 px-6 pt-4 rounded bg-[#121212] text-white overflow-auto lg:w-[75%] lg:ml-0 transition-colors duration-500"
    >
      <Routes>
        <Route path="/" element={<DisplayHome />} />
        <Route path="/search" element={<DisplaySearch />} />
        <Route path="/liked-songs" element={<DisplayLikedSongs />} />
        <Route
          path="/album/:id"
          element={
            <DisplayAlbum
              album={albumsData.find((album) => album._id === albumId)}
            />
          }
        />
      </Routes>
    </div>
  );
};

export default Display;


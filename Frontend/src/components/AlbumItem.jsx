import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { PlayerContext } from "../context/PlayerContext";

const AlbumItem = ({ image, name, desc, id }) => {
  const navigate = useNavigate();
  const { playAlbum } = useContext(PlayerContext);

  const handlePlayAlbum = (e) => {
    e.stopPropagation();
    playAlbum(name);
  };

  return (
    <div
      onClick={() => navigate(`/album/${id}`)}
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
          onClick={handlePlayAlbum}
          className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-green-500 shadow-xl flex items-center justify-center text-black hover:scale-105 transition-all duration-200 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
          title={`Play ${name}`}
        >
          <span className="text-sm font-bold ml-0.5">▶</span>
        </button>
      </div>

      <p className="font-bold text-sm text-white truncate">{name}</p>
      <p className="text-[#a7a7a7] text-xs truncate mt-0.5">{desc}</p>
    </div>
  );
};

export default AlbumItem;
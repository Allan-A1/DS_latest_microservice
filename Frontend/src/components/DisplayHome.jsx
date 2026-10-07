import React, { useContext } from "react";
import Navbar from "./Navbar";
// import { albumsData, songsData } from "../assets/frontend-assets/assets";
import AlbumItem from "./AlbumItem";
import SongItem from "./SongItem";
import { PlayerContext } from "../context/PlayerContext";

const DisplayHome = () => {

  const {songsData, albumsData } = useContext(PlayerContext);
  
  return (
    <>
      <Navbar />
      <div className="mb-4">
        <h1 className="my-5 font-bold text-2xl">Featured Charts</h1>
        <div className="flex overflow-auto">
          {albumsData.map((album, index) => (
            <AlbumItem
              key={index}
              name={album.name}
              desc={album.desc}
              image={album.image}
              id={album._id}
            />
          ))}
        </div>
      </div>
      <div className="mb-4">
        <h1 className="my-5 font-bold text-2xl">Today's Biggest hits</h1>
        <div className="flex overflow-auto">
          {songsData.map((song, index) => (
            <SongItem
              key={index}
              name={song.name}
              desc={song.desc}
              image={song.image}
              id={song._id}
              playCount={song.playCount || 0}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default DisplayHome;

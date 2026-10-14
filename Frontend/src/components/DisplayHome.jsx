import React, { useContext } from "react";
import Navbar from "./Navbar";
import AlbumItem from "./AlbumItem";
import SongItem from "./SongItem";
import { PlayerContext } from "../context/PlayerContext";

const DisplayHome = () => {
  const { songsData, albumsData, activeFilter } = useContext(PlayerContext);

  const showMusic = activeFilter === "All" || activeFilter === "Music";
  const showPodcasts = activeFilter === "Podcasts";

  return (
    <div className="pb-16">
      <Navbar />

      {showMusic && (
        <>
          {/* Featured Charts / Albums */}
          <div className="mb-6">
            <h1 className="my-5 font-bold text-2xl text-white">Featured Charts</h1>
            {albumsData.length > 0 ? (
              <div className="flex overflow-auto gap-4 pb-2">
                {albumsData.map((album) => (
                  <AlbumItem
                    key={album._id}
                    name={album.name}
                    desc={album.desc}
                    image={album.image}
                    id={album._id}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-[#181818] p-5 rounded-lg border border-[#282828] text-sm text-[#b3b3b3] flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">No albums created yet</p>
                  <p className="text-xs text-[#a7a7a7] mt-0.5">
                    Create albums and playlists easily via the Admin panel.
                  </p>
                </div>
                <button
                  onClick={() => window.open("http://localhost:5174", "_blank")}
                  className="px-4 py-2 bg-white text-black font-semibold text-xs rounded-full hover:scale-105 transition-transform"
                >
                  Open Admin
                </button>
              </div>
            )}
          </div>

          {/* Today's Biggest Hits / Songs */}
          <div className="mb-6">
            <h1 className="my-5 font-bold text-2xl text-white">Today's Biggest Hits</h1>
            {songsData.length > 0 ? (
              <div className="flex overflow-auto gap-4 pb-2">
                {songsData.map((song) => (
                  <SongItem
                    key={song._id}
                    name={song.name}
                    desc={song.desc}
                    image={song.image}
                    id={song._id}
                    playCount={song.playCount || 0}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-[#181818] p-5 rounded-lg border border-[#282828] text-sm text-[#b3b3b3]">
                <p className="font-semibold text-white">No songs available yet</p>
                <p className="text-xs text-[#a7a7a7] mt-0.5">
                  Upload MP3 songs in the Admin Panel to start streaming!
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {showPodcasts && (
        <div className="my-8">
          <h1 className="my-5 font-bold text-2xl text-white">Top Podcasts</h1>
          <div className="p-8 bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl flex flex-col items-start gap-4 shadow-xl">
            <span className="text-4xl">🎙️</span>
            <div>
              <h2 className="text-2xl font-bold text-white">Podcasts Coming Soon</h2>
              <p className="text-[#d1d1d1] text-sm mt-1 max-w-lg">
                We're currently expanding Spotify clone to support audio podcasts, series, and live talk shows. Check back soon or enjoy music today!
              </p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="px-5 py-2 bg-white text-black text-sm font-semibold rounded-full hover:scale-105 transition-transform"
            >
              Back to Music
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisplayHome;


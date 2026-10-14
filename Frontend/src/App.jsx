import React, { useContext } from "react";
import Sidebar from "./components/Sidebar";
import Player from "./components/Player";
import Display from "./components/Display";
import QueueDrawer from "./components/QueueDrawer";
import BottomNav from "./components/BottomNav";
import { PlayerContext } from "./context/PlayerContext";

const App = () => {
  const { audioRef, track, loading, songsData } = useContext(PlayerContext);

  if (loading && songsData.length === 0) {
    return (
      <div className="h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
        <p className="text-sm font-semibold text-[#a7a7a7] animate-pulse">
          Connecting to Spotify Music Service...
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden relative">
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <Display />
      </div>

      {/* Floating / Persistent Player */}
      <Player />

      {/* Slide-out Queue Panel */}
      <QueueDrawer />

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav />

      {/* Persistent Audio Element */}
      <audio ref={audioRef} src={track ? track.file : ""} preload="auto" />
    </div>
  );
};

export default App;


import React, { useState } from "react";
import { Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AddSong from "./Pages/AddSong";
import AddAlbum from "./Pages/AddAlbum";
import ListSong from "./Pages/ListSong";
import ListAlbum from "./Pages/ListAlbum";
import Sidebar from "./Components/Sidebar";
import Navbar from "./Components/Navbar";
import AdminLogin, { SESSION_KEY } from "./Components/AdminLogin";

export const url = `http://localhost:3000`;

const App = () => {
  const [isAuthed, setIsAuthed] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "true"
  );

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthed(false);
  };

  if (!isAuthed) {
    return <AdminLogin onAuth={() => setIsAuthed(true)} />;
  }

  return (
    <div className="flex items-start min-h-screen">
      <ToastContainer />
      <Sidebar />
      <div className="flex-1 h-screen overflow-y-scroll bg-[#f3fff7]">
        <div className="flex justify-between items-center">
          <Navbar />
          <button
            onClick={handleLogout}
            className="mr-6 mt-4 text-xs text-red-500 hover:text-red-700 border border-red-300 hover:border-red-500 px-3 py-1 rounded-full transition-colors"
          >
            Logout
          </button>
        </div>
        <div className="pt-8 pl-5 sm:pt-12 sm:pl-12">
          <Routes>
            <Route path="/add-song" element={<AddSong />} />
            <Route path="/add-album" element={<AddAlbum />} />
            <Route path="/list-song" element={<ListSong />} />
            <Route path="/list-album" element={<ListAlbum />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;


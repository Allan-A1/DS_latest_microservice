import React, { useState } from "react";

/**
 * AdminLogin — simple password gate for the admin panel.
 * Set VITE_ADMIN_PASSWORD in admin/.env to change the password.
 * Falls back to "admin123" if env var is not set.
 */
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";
const SESSION_KEY = "spotify_admin_authed";

const AdminLogin = ({ onAuth }) => {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      onAuth();
    } else {
      setError("Incorrect password. Try again.");
      setShake(true);
      setInput("");
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
      <div
        className={`bg-white rounded-2xl shadow-2xl p-10 w-full max-w-sm flex flex-col items-center gap-6 ${shake ? "animate-shake" : ""}`}
        style={{ animation: shake ? "shake 0.4s ease" : "none" }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="bg-green-500 rounded-full w-14 h-14 flex items-center justify-center text-white text-3xl font-bold shadow">
            ♪
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Spotify Admin</h1>
          <p className="text-gray-400 text-sm">Enter your admin password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input
            type="password"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(""); }}
            placeholder="Admin password"
            autoFocus
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
          />
          {error && (
            <p className="text-red-500 text-xs text-center">{error}</p>
          )}
          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
          >
            Login
          </button>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
};

export { SESSION_KEY };
export default AdminLogin;

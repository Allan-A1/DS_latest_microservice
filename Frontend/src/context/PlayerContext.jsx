import { createContext, useEffect, useRef, useState } from "react";
import axios from "axios";

const PlayerContext = createContext();

const PlayerContextProvider = ({ children }) => {
  const audioRef = useRef();
  const seekBg = useRef();
  const seekBar = useRef();

  const url = "http://localhost:3000";

  const [songsData, setSongsData] = useState([]);
  const [albumsData, setAlbumsData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [track, setTrack] = useState(null);
  const [pendingPlay, setPendingPlay] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [prevVolume, setPrevVolume] = useState(1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isLoop, setIsLoop] = useState(false);

  // Search & Navigation Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All"); // "All", "Music", "Podcasts"
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  // Liked songs persisted in localStorage
  const [likedSongs, setLikedSongs] = useState(() => {
    try {
      const saved = localStorage.getItem("spotify_liked_songs");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleLike = (songId) => {
    if (!songId) return;
    setLikedSongs((prev) => {
      const updated = prev.includes(songId)
        ? prev.filter((id) => id !== songId)
        : [...prev, songId];
      try {
        localStorage.setItem("spotify_liked_songs", JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to save liked songs:", err);
      }
      return updated;
    });
  };

  const isLiked = (songId) => likedSongs.includes(songId);

  const [time, setTime] = useState({
    currentTime: { seconds: 0, minutes: 0 },
    duration: { seconds: 0, minutes: 0 },
  });

  const getSongsData = async (resetTrack = true) => {
    try {
      const res = await axios.get(`${url}/api/song/list`);
      if (res.data.success) {
        setSongsData(res.data.songs);
        if (resetTrack && res.data.songs.length > 0) {
          setTrack((prev) => prev || res.data.songs[0]);
        }
      }
    } catch (error) {
      console.error("Error loading songs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAlbumsData = async () => {
    try {
      const res = await axios.get(`${url}/api/album/list`);
      if (res.data.success) {
        setAlbumsData(res.data.albums);
      }
    } catch (error) {
      console.error("Error loading albums:", error);
    }
  };

  const recordPlay = async (songId) => {
    if (!songId) return;
    try {
      await axios.post(`${url}/api/play`, { songId });
    } catch (error) {
      console.error("Error recording play:", error);
    }
  };

  useEffect(() => {
    getSongsData();
    getAlbumsData();
    const interval = setInterval(() => {
      getSongsData(false);
      getAlbumsData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const play = () => {
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        recordPlay(track?._id);
      }).catch((e) => console.log("Play failed:", e));
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const playWithId = (id) => {
    const song = songsData.find((s) => s._id === id);
    if (!song) return;
    setTrack(song);
    setPendingPlay(true);
    recordPlay(id);
  };

  const playAlbum = (albumName) => {
    const albumSongs = songsData.filter((s) => s.album === albumName);
    if (albumSongs.length > 0) {
      setTrack(albumSongs[0]);
      setPendingPlay(true);
      recordPlay(albumSongs[0]._id);
    }
  };

  // Watch for track change + pendingPlay intent
  useEffect(() => {
    if (pendingPlay && track && audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setPendingPlay(false);
      }).catch(() => setPendingPlay(false));
    }
  }, [track, pendingPlay]);

  const previous = () => {
    if (!track || songsData.length === 0) return;
    const idx = songsData.findIndex((s) => s._id === track._id);
    if (isShuffle) {
      const randomIdx = Math.floor(Math.random() * songsData.length);
      const prev = songsData[randomIdx];
      setTrack(prev);
      setPendingPlay(true);
      recordPlay(prev._id);
    } else if (idx > 0) {
      const prev = songsData[idx - 1];
      setTrack(prev);
      setPendingPlay(true);
      recordPlay(prev._id);
    } else {
      // Loop to end
      const last = songsData[songsData.length - 1];
      setTrack(last);
      setPendingPlay(true);
      recordPlay(last._id);
    }
  };

  const next = () => {
    if (!track || songsData.length === 0) return;
    const idx = songsData.findIndex((s) => s._id === track._id);
    if (isShuffle) {
      const randomIdx = Math.floor(Math.random() * songsData.length);
      const nxt = songsData[randomIdx];
      setTrack(nxt);
      setPendingPlay(true);
      recordPlay(nxt._id);
    } else if (idx < songsData.length - 1) {
      const nxt = songsData[idx + 1];
      setTrack(nxt);
      setPendingPlay(true);
      recordPlay(nxt._id);
    } else if (isLoop) {
      const first = songsData[0];
      setTrack(first);
      setPendingPlay(true);
      recordPlay(first._id);
    }
  };

  // Auto-advance on track end
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => next();
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [track, isShuffle, isLoop, songsData]);

  const setVolume = (val) => {
    const v = Math.max(0, Math.min(1, val));
    setVolumeState(v);
    if (v > 0) setPrevVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume || 0.8);
    }
  };

  const toggleShuffle = () => setIsShuffle((s) => !s);
  const toggleLoop = () => setIsLoop((l) => !l);

  const seekSong = (e) => {
    if (!audioRef.current || !seekBg.current || !audioRef.current.duration) return;
    const rect = seekBg.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const seekFraction = Math.max(0, Math.min(1, clickX / width));
    audioRef.current.currentTime = seekFraction * audioRef.current.duration;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      const current = audio.currentTime || 0;
      const duration = audio.duration || 0;
      if (seekBar.current && duration > 0) {
        seekBar.current.style.width = Math.floor((current / duration) * 100) + "%";
      }
      setTime({
        currentTime: {
          seconds: Math.floor(current % 60),
          minutes: Math.floor(current / 60),
        },
        duration: {
          seconds: Math.floor(duration % 60) || 0,
          minutes: Math.floor(duration / 60) || 0,
        },
      });
    };

    audio.ontimeupdate = updateTime;
    return () => {
      if (audio) audio.ontimeupdate = null;
    };
  }, [audioRef.current, track]);

  const contextValue = {
    audioRef,
    seekBar,
    seekBg,
    track,
    setTrack,
    isPlaying,
    setIsPlaying,
    time,
    setTime,
    play,
    pause,
    playWithId,
    playAlbum,
    previous,
    next,
    seekSong,
    songsData,
    albumsData,
    volume,
    setVolume,
    toggleMute,
    isShuffle,
    toggleShuffle,
    isLoop,
    toggleLoop,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    isQueueOpen,
    setIsQueueOpen,
    likedSongs,
    toggleLike,
    isLiked,
    loading,
    refreshData: () => {
      getSongsData();
      getAlbumsData();
    },
  };

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
    </PlayerContext.Provider>
  );
};

export { PlayerContext, PlayerContextProvider };

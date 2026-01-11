import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const AudioPlayerContext = createContext(null);

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  }
  return context;
}

export function AudioPlayerProvider({ children }) {
  const audioRef = useRef(null);
  const [state, setState] = useState({
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isLoading: false,
  });

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => {
      setState(prev => ({ ...prev, currentTime: audio.currentTime }));
    });

    audio.addEventListener('loadedmetadata', () => {
      setState(prev => ({ ...prev, duration: audio.duration, isLoading: false }));
    });

    audio.addEventListener('ended', () => {
      setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
    });

    audio.addEventListener('waiting', () => {
      setState(prev => ({ ...prev, isLoading: true }));
    });

    audio.addEventListener('canplay', () => {
      setState(prev => ({ ...prev, isLoading: false }));
    });

    audio.addEventListener('error', () => {
      setState(prev => ({ ...prev, isLoading: false, isPlaying: false }));
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  const playTrack = async (track, playbackUrl) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (state.currentTrack?.id === track.id) {
      if (state.isPlaying) {
        audio.pause();
        setState(prev => ({ ...prev, isPlaying: false }));
      } else {
        audio.play();
        setState(prev => ({ ...prev, isPlaying: true }));
      }
      return;
    }

    setState(prev => ({ ...prev, currentTrack: track, isLoading: true, currentTime: 0 }));
    
    // Use the provided signed playback URL
    audio.src = playbackUrl;
    audio.volume = state.volume;
    audio.play().then(() => {
      setState(prev => ({ ...prev, isPlaying: true }));
    }).catch(() => {
      setState(prev => ({ ...prev, isPlaying: false, isLoading: false }));
    });
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !state.currentTrack) return;

    if (state.isPlaying) {
      audio.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
    } else {
      audio.play();
      setState(prev => ({ ...prev, isPlaying: true }));
    }
  };

  const pause = () => {
    audioRef.current?.pause();
    setState(prev => ({ ...prev, isPlaying: false }));
  };

  const seek = (time) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setState(prev => ({ ...prev, currentTime: time }));
  };

  const setVolume = (volume) => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
    setState(prev => ({ ...prev, volume }));
  };

  const closePlayer = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = '';
    }
    setState({
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: state.volume,
      isLoading: false,
    });
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        ...state,
        playTrack,
        togglePlay,
        pause,
        seek,
        setVolume,
        closePlayer,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}
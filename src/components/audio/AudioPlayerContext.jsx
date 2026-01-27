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
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const [state, setState] = useState({
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isLoading: false,
    queue: [],
    queueIndex: -1,
    isFlowMode: false,
    flowArtistEmail: null,
    isFlowEnding: false,
    flowEndMessage: null,
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
      handleTrackEnd();
    });

    audio.addEventListener('waiting', () => {
      setState(prev => ({ ...prev, isLoading: true }));
    });

    audio.addEventListener('canplay', () => {
      setState(prev => ({ ...prev, isLoading: false }));
    });

    audio.addEventListener('error', (e) => {
      console.error('Audio playback error:', audio.error, e);
      setState(prev => ({ ...prev, isLoading: false, isPlaying: false }));
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  const handleTrackEnd = async () => {
    if (state.queueIndex < state.queue.length - 1) {
      // Play next in queue
      playNext();
    } else if (state.isFlowMode && !state.isFlowEnding) {
      // Flow mode: try to generate more tracks
      try {
        const { base44 } = await import('@/api/base44Client');
        const response = await base44.functions.invoke('generateFlow', {
          startTrackId: state.queue[state.queue.length - 1]?.track.id,
          artistEmail: state.flowArtistEmail
        });

        if (response.data.tracks && response.data.tracks.length > 1) {
          // Fetch signed URLs for new tracks
          const newTracks = response.data.tracks.slice(1);
          const signedUrls = await Promise.all(
            newTracks.map(track => 
              base44.integrations.Core.CreateFileSignedUrl({
                file_uri: track.audio_file_uri,
                expires_in: 3600
              }).then(res => res.signed_url)
            )
          );

          // Add to queue
          const newQueueItems = newTracks.map((track, i) => ({
            track,
            playbackUrl: signedUrls[i]
          }));

          setState(prev => ({
            ...prev,
            queue: [...prev.queue, ...newQueueItems]
          }));

          // Play next track
          setTimeout(() => playNext(), 100);
        } else {
          // No more tracks - gentle end
          setState(prev => ({
            ...prev,
            isFlowEnding: true,
            flowEndMessage: 'Your flow is complete. May you carry this peace forward.'
          }));

          // Fade out over 3 seconds
          const audio = audioRef.current;
          if (audio) {
            const fadeSteps = 30;
            const fadeInterval = setInterval(() => {
              if (audio.volume > 0.03) {
                audio.volume = Math.max(0, audio.volume - (state.volume / fadeSteps));
              } else {
                clearInterval(fadeInterval);
                audio.pause();
                setState(prev => ({
                  ...prev,
                  isPlaying: false,
                }));

                // Clear end message after 5 seconds
                setTimeout(() => {
                  setState(prev => ({
                    ...prev,
                    isFlowEnding: false,
                    flowEndMessage: null,
                    isFlowMode: false,
                    flowArtistEmail: null,
                  }));
                }, 5000);
              }
            }, 100);
          }
        }
      } catch (error) {
        console.error('Failed to generate flow:', error);
        setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
      }
    } else {
      setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
    }
  };

  const playTrack = async (track, playbackUrl, addToQueue = false) => {
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

    if (addToQueue) {
      setState(prev => ({
        ...prev,
        queue: [...prev.queue, { track, playbackUrl }],
      }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      currentTrack: track, 
      isLoading: true, 
      currentTime: 0,
      queueIndex: -1,
      isFlowMode: false,
      flowArtistEmail: null,
    }));
    
    // Use the provided signed playback URL
    audio.src = playbackUrl;
    audio.volume = state.volume;
    
    // Initialize Web Audio API for visualizations
    if (!audioContextRef.current) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();
        const source = audioContextRef.current.createMediaElementSource(audio);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      } catch (err) {
        console.warn('Web Audio API not supported');
      }
    }
    
    audio.play().then(() => {
      setState(prev => ({ ...prev, isPlaying: true }));
    }).catch((err) => {
      console.error('Audio play error:', err);
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
      queue: [],
      queueIndex: -1,
    });
  };

  const playNext = () => {
    if (state.queueIndex < state.queue.length - 1) {
      const nextIndex = state.queueIndex + 1;
      const nextItem = state.queue[nextIndex];
      setState(prev => ({ 
        ...prev, 
        currentTrack: nextItem.track, 
        isLoading: true, 
        currentTime: 0,
        queueIndex: nextIndex,
      }));
      
      const audio = audioRef.current;
      audio.src = nextItem.playbackUrl;
      audio.volume = state.volume;
      audio.play().then(() => {
        setState(prev => ({ ...prev, isPlaying: true }));
      }).catch(() => {
        setState(prev => ({ ...prev, isPlaying: false, isLoading: false }));
      });
    }
  };

  const playPrevious = () => {
    if (state.queueIndex > 0) {
      const prevIndex = state.queueIndex - 1;
      const prevItem = state.queue[prevIndex];
      setState(prev => ({ 
        ...prev, 
        currentTrack: prevItem.track, 
        isLoading: true, 
        currentTime: 0,
        queueIndex: prevIndex,
      }));
      
      const audio = audioRef.current;
      audio.src = prevItem.playbackUrl;
      audio.volume = state.volume;
      audio.play().then(() => {
        setState(prev => ({ ...prev, isPlaying: true }));
      }).catch(() => {
        setState(prev => ({ ...prev, isPlaying: false, isLoading: false }));
      });
    } else if (state.currentTime > 3) {
      // Restart current track if more than 3 seconds in
      seek(0);
    }
  };

  const removeFromQueue = (index) => {
    setState(prev => {
      const newQueue = prev.queue.filter((_, i) => i !== index);
      let newQueueIndex = prev.queueIndex;
      if (index < prev.queueIndex) {
        newQueueIndex--;
      } else if (index === prev.queueIndex) {
        newQueueIndex = -1;
      }
      return { ...prev, queue: newQueue, queueIndex: newQueueIndex };
    });
  };

  const clearQueue = () => {
    setState(prev => ({ ...prev, queue: [], queueIndex: -1 }));
  };

  const setQueue = (tracks, playbackUrls) => {
    const queueItems = tracks.map((track, index) => ({
      track,
      playbackUrl: playbackUrls[index],
    }));
    setState(prev => ({ ...prev, queue: queueItems, queueIndex: -1, isFlowMode: false }));
  };

  const startFlow = async (startTrack, artistEmail = null) => {
    try {
      const { base44 } = await import('@/api/base44Client');
      const response = await base44.functions.invoke('generateFlow', {
        startTrackId: startTrack.id,
        artistEmail: artistEmail
      });

      if (response.data.tracks && response.data.tracks.length > 0) {
        // Fetch signed URLs for all tracks
        const signedUrls = await Promise.all(
          response.data.tracks.map(track => 
            base44.integrations.Core.CreateFileSignedUrl({
              file_uri: track.audio_file_uri,
              expires_in: 3600
            }).then(res => res.signed_url)
          )
        );

        const queueItems = response.data.tracks.map((track, i) => ({
          track,
          playbackUrl: signedUrls[i]
        }));

        setState(prev => ({
          ...prev,
          queue: queueItems,
          queueIndex: 0,
          currentTrack: queueItems[0].track,
          isLoading: true,
          currentTime: 0,
          isFlowMode: true,
          flowArtistEmail: artistEmail,
          isFlowEnding: false,
          flowEndMessage: null,
        }));

        const audio = audioRef.current;
        audio.src = queueItems[0].playbackUrl;
        audio.volume = state.volume;
        audio.play().then(() => {
          setState(prev => ({ ...prev, isPlaying: true }));
        }).catch(() => {
          setState(prev => ({ ...prev, isPlaying: false, isLoading: false }));
        });
      }
    } catch (error) {
      console.error('Failed to start flow:', error);
    }
  };

  const getAnalyser = () => analyserRef.current;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ignore if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch(e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowright':
          e.preventDefault();
          seek(Math.min(state.currentTime + 10, state.duration));
          break;
        case 'arrowleft':
          e.preventDefault();
          seek(Math.max(state.currentTime - 10, 0));
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume(Math.min(state.volume + 0.1, 1));
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume(Math.max(state.volume - 0.1, 0));
          break;
        case 'n':
          e.preventDefault();
          playNext();
          break;
        case 'p':
          e.preventDefault();
          playPrevious();
          break;
        case 'm':
          e.preventDefault();
          setVolume(state.volume > 0 ? 0 : 0.7);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [state, togglePlay, seek, setVolume]);

  // Media Session API for mobile controls
  useEffect(() => {
    if ('mediaSession' in navigator && state.currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: state.currentTrack.title,
        artist: state.currentTrack.intention || 'Sound Library',
        artwork: state.currentTrack.cover_image_url ? [
          { src: state.currentTrack.cover_image_url, sizes: '512x512', type: 'image/jpeg' }
        ] : [],
      });

      navigator.mediaSession.setActionHandler('play', togglePlay);
      navigator.mediaSession.setActionHandler('pause', togglePlay);
      navigator.mediaSession.setActionHandler('nexttrack', state.queue.length > 0 ? playNext : null);
      navigator.mediaSession.setActionHandler('previoustrack', state.queueIndex > 0 ? playPrevious : null);
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime) seek(details.seekTime);
      });
    }
  }, [state.currentTrack, state.queue, state.queueIndex, togglePlay]);

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
        playNext,
        playPrevious,
        removeFromQueue,
        clearQueue,
        setQueue,
        startFlow,
        getAnalyser,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}
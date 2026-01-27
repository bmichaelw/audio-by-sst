import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, List } from 'lucide-react';

export default function FlowPlayerEmbed({ playlist, tracks, artist, user }) {
  const audioRef = useRef(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [showQueue, setShowQueue] = useState(false);
  const [playedTracks, setPlayedTracks] = useState(new Set());

  const currentTrack = tracks[currentTrackIndex];

  // Get signed URL for current track
  useEffect(() => {
    const getAudioUrl = async () => {
      if (!currentTrack?.audio_file_uri) return;
      
      try {
        const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
          file_uri: currentTrack.audio_file_uri,
          expires_in: 3600
        });
        setAudioUrl(signed_url);
      } catch (error) {
        console.error('Failed to get audio URL:', error);
      }
    };
    
    getAudioUrl();
  }, [currentTrack]);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      
      // Track play at 30% completion
      if (!playedTracks.has(currentTrack.id) && 
          audio.currentTime > audio.duration * 0.3 && 
          user) {
        base44.entities.PlayHistory.create({
          user_email: user.email,
          track_id: currentTrack.id,
          played_at: new Date().toISOString(),
          completed: false
        });
        setPlayedTracks(prev => new Set([...prev, currentTrack.id]));
      }
    };

    const handleEnded = async () => {
      // Track completion
      if (user) {
        const history = await base44.entities.PlayHistory.filter({
          user_email: user.email,
          track_id: currentTrack.id
        });
        
        const recent = history.sort((a, b) => 
          new Date(b.played_at) - new Date(a.played_at)
        )[0];
        
        if (recent) {
          await base44.entities.PlayHistory.update(recent.id, { completed: true });
        }
      }
      
      // Auto-play next track
      if (currentTrackIndex < tracks.length - 1) {
        setCurrentTrackIndex(prev => prev + 1);
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack, user, currentTrackIndex, tracks.length, playedTracks]);

  // Auto-play when track changes
  useEffect(() => {
    if (audioUrl && isPlaying) {
      audioRef.current?.play();
    }
  }, [audioUrl, isPlaying]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const playNext = () => {
    if (currentTrackIndex < tracks.length - 1) {
      setCurrentTrackIndex(prev => prev + 1);
      setIsPlaying(true);
      setCurrentTime(0);
    }
  };

  const playPrevious = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(prev => prev - 1);
      setIsPlaying(true);
      setCurrentTime(0);
    }
  };

  const playTrackAt = (index) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
    setCurrentTime(0);
    setShowQueue(false);
  };

  const handleSeek = (value) => {
    const audio = audioRef.current;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value) => {
    const newVolume = value[0];
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (isMuted) {
      audio.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Cover Art */}
        <div className="relative aspect-video w-full">
          <img 
            src={currentTrack?.cover_image_url || playlist.cover_image_url || 'https://via.placeholder.com/800x450?text=Flow'} 
            alt={playlist.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Playlist Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <p className="text-xs opacity-80 mb-1">{playlist.name}</p>
            <p className="text-sm font-light">{currentTrackIndex + 1} / {tracks.length}</p>
          </div>
        </div>

        {/* Player Controls */}
        <div className="p-6">
          {/* Current Track Info */}
          <div className="mb-4 text-center">
            <h2 className="text-xl font-light mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
              {currentTrack?.title}
            </h2>
            <p className="text-sm text-stone-600">
              {artist?.full_name || currentTrack?.artist_email}
            </p>
          </div>

          {/* Audio Element */}
          {audioUrl && (
            <audio ref={audioRef} src={audioUrl} preload="metadata" />
          )}

          {/* Progress Bar */}
          <div className="mb-4">
            <Slider
              value={[currentTime]}
              max={currentTrack?.duration_seconds || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="mb-2"
            />
            <div className="flex justify-between text-xs text-stone-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(currentTrack?.duration_seconds || 0)}</span>
            </div>
          </div>

          {/* Play Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-20"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={playPrevious}
                disabled={currentTrackIndex === 0}
              >
                <SkipBack className="w-5 h-5" />
              </Button>

              <Button
                size="icon"
                onClick={togglePlay}
                disabled={!audioUrl}
                className="w-12 h-12 rounded-full"
                style={{ backgroundColor: '#d9ca9c' }}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={playNext}
                disabled={currentTrackIndex === tracks.length - 1}
              >
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowQueue(!showQueue)}
            >
              <List className="w-5 h-5" />
            </Button>
          </div>

          {/* Queue */}
          {showQueue && (
            <div className="mb-4 border-t border-stone-200 pt-4">
              <p className="text-xs font-medium text-stone-500 mb-2 uppercase tracking-wide">Queue</p>
              <ScrollArea className="h-48">
                {tracks.map((track, index) => (
                  <button
                    key={track.id}
                    onClick={() => playTrackAt(index)}
                    className={`w-full text-left p-2 rounded-lg hover:bg-stone-100 transition-colors ${
                      index === currentTrackIndex ? 'bg-stone-100' : ''
                    }`}
                  >
                    <p className="text-sm font-medium truncate">{track.title}</p>
                    <p className="text-xs text-stone-500 truncate">{formatTime(track.duration_seconds)}</p>
                  </button>
                ))}
              </ScrollArea>
            </div>
          )}

          {/* Branding */}
          <div className="pt-4 border-t border-stone-200">
            <a
              href={window.location.origin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6963e3baba38fec6b46ac249/c1e96d6f5_AuDiosanguinelogosquare.png"
                alt=""
                className="w-4 h-4 rounded-full"
              />
              <span>Powered by Au'Dio</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
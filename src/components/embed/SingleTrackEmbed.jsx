import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

export default function SingleTrackEmbed({ track, artist, user }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false);

  // Get signed URL for audio
  useEffect(() => {
    const getAudioUrl = async () => {
      try {
        const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
          file_uri: track.audio_file_uri,
          expires_in: 3600
        });
        setAudioUrl(signed_url);
      } catch (error) {
        console.error('Failed to get audio URL:', error);
      }
    };
    
    if (track?.audio_file_uri) {
      getAudioUrl();
    }
  }, [track]);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      
      // Track play at 30% completion
      if (!hasTrackedPlay && audio.currentTime > audio.duration * 0.3 && user) {
        base44.entities.PlayHistory.create({
          user_email: user.email,
          track_id: track.id,
          played_at: new Date().toISOString(),
          completed: false
        });
        setHasTrackedPlay(true);
      }
    };

    const handleEnded = async () => {
      setIsPlaying(false);
      
      // Track completion
      if (user) {
        const history = await base44.entities.PlayHistory.filter({
          user_email: user.email,
          track_id: track.id
        });
        
        const recent = history.sort((a, b) => 
          new Date(b.played_at) - new Date(a.played_at)
        )[0];
        
        if (recent) {
          await base44.entities.PlayHistory.update(recent.id, { completed: true });
        }
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [track, user, hasTrackedPlay]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
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
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Cover Art */}
        {track.cover_image_url && (
          <div className="relative aspect-square w-full">
            <img 
              src={track.cover_image_url} 
              alt={track.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}

        {/* Track Info & Controls */}
        <div className="p-6">
          {/* Track Title & Artist */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-light mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              {track.title}
            </h2>
            <p className="text-stone-600">
              {artist?.full_name || track.artist_email}
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
              max={track.duration_seconds}
              step={0.1}
              onValueChange={handleSeek}
              className="mb-2"
            />
            <div className="flex justify-between text-xs text-stone-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(track.duration_seconds)}</span>
            </div>
          </div>

          {/* Play Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 flex-1">
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
                className="w-24"
              />
            </div>

            <Button
              size="icon"
              onClick={togglePlay}
              disabled={!audioUrl}
              className="w-14 h-14 rounded-full"
              style={{ backgroundColor: '#d9ca9c' }}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </Button>

            <div className="flex-1" />
          </div>

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
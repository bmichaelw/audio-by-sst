import React from 'react';
import { useAudioPlayer } from './AudioPlayerContext';
import { Play, Pause, X, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function formatTime(seconds) {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function PersistentPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isLoading,
    togglePlay,
    seek,
    setVolume,
    closePlayer,
  } = useAudioPlayer();

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-stone-950/95 backdrop-blur-xl border-t border-stone-800/50 safe-area-bottom">
      {/* Progress bar - clickable */}
      <div 
        className="absolute top-0 left-0 right-0 h-1 bg-stone-800 cursor-pointer group"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const percent = (e.clientX - rect.left) / rect.width;
          seek(percent * duration);
        }}
      >
        <div 
          className="h-full bg-gradient-to-r from-amber-600 to-amber-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-amber-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
        />
      </div>

      <div className="px-4 py-3 md:py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {currentTrack.cover_image_url ? (
              <img
                src={currentTrack.cover_image_url}
                alt={currentTrack.title}
                className="w-12 h-12 md:w-14 md:h-14 rounded-lg object-cover shadow-lg"
              />
            ) : (
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-gradient-to-br from-amber-600/20 to-stone-800 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-amber-600/50" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-white font-medium text-sm md:text-base truncate">
                {currentTrack.title}
              </p>
              {currentTrack.intention && (
                <p className="text-stone-400 text-xs md:text-sm truncate">
                  {currentTrack.intention}
                </p>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Time - hidden on mobile */}
            <span className="hidden md:block text-stone-400 text-sm font-mono min-w-[4rem] text-right">
              {formatTime(currentTime)}
            </span>

            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              disabled={isLoading}
              className={cn(
                "w-12 h-12 rounded-full transition-all",
                "bg-amber-600 hover:bg-amber-500 text-white",
                "shadow-lg shadow-amber-600/20"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>

            {/* Duration - hidden on mobile */}
            <span className="hidden md:block text-stone-400 text-sm font-mono min-w-[4rem]">
              {formatTime(duration)}
            </span>

            {/* Volume - hidden on mobile */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
                className="text-stone-400 hover:text-white h-8 w-8"
              >
                {volume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <Slider
                value={[volume * 100]}
                max={100}
                step={1}
                onValueChange={([val]) => setVolume(val / 100)}
                className="w-20"
              />
            </div>

            {/* Close */}
            <Button
              variant="ghost"
              size="icon"
              onClick={closePlayer}
              className="text-stone-400 hover:text-white h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAudioPlayer } from './AudioPlayerContext.jsx';
import AudioVisualizer from './AudioVisualizer.jsx';
import QueuePanel from './QueuePanel.jsx';
import { Play, Pause, X, Volume2, VolumeX, Loader2, SkipForward, SkipBack, List } from 'lucide-react';
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
    queue,
    queueIndex,
    isFlowMode,
    isFlowEnding,
    flowEndMessage,
    togglePlay,
    seek,
    setVolume,
    closePlayer,
    playNext,
    playPrevious,
  } = useAudioPlayer();

  const hasTracked90Percent = useRef(false);
  const [showQueue, setShowQueue] = useState(false);

  // Track play/pause analytics
  useEffect(() => {
    if (currentTrack && isPlaying) {
      base44.analytics.track({
        eventName: 'audio_play',
        properties: { track_id: currentTrack.id, track_title: currentTrack.title },
      });
    } else if (currentTrack && !isPlaying && currentTime > 0) {
      base44.analytics.track({
        eventName: 'audio_pause',
        properties: { 
          track_id: currentTrack.id, 
          track_title: currentTrack.title,
          progress_seconds: currentTime 
        },
      });
    }
  }, [isPlaying, currentTrack]);

  // Track 90% completion and log to PlayHistory
  useEffect(() => {
    if (currentTrack && duration > 0 && currentTime > 0) {
      const progressPercent = (currentTime / duration) * 100;
      if (progressPercent >= 90 && !hasTracked90Percent.current) {
        hasTracked90Percent.current = true;
        
        // Track analytics
        base44.analytics.track({
          eventName: 'audio_complete_90_percent',
          properties: { track_id: currentTrack.id, track_title: currentTrack.title },
        });

        // Log to PlayHistory
        base44.auth.me().then(user => {
          if (user) {
            base44.entities.PlayHistory.create({
              user_email: user.email,
              track_id: currentTrack.id,
              played_at: new Date().toISOString(),
              completed: true,
            }).catch(() => {});
          }
        }).catch(() => {});
      }
    }
  }, [currentTime, duration, currentTrack]);

  // Reset tracking when track changes
  useEffect(() => {
    hasTracked90Percent.current = false;
  }, [currentTrack?.id]);

  // Show flow end message
  if (isFlowEnding && flowEndMessage) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t safe-area-bottom"
        style={{ 
          backgroundColor: 'hsl(var(--background) / 0.95)',
          borderColor: 'hsl(var(--border) / 0.3)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse"
              style={{ backgroundColor: 'hsl(var(--accent) / 0.2)' }}
            >
              <div className="w-12 h-12 rounded-full" style={{ backgroundColor: 'hsl(var(--accent) / 0.3)' }} />
            </div>
            <p className="text-lg font-light" 
              style={{ 
                color: 'hsl(var(--text-heading))',
                fontFamily: 'var(--font-heading)',
                letterSpacing: '0.02em'
              }}
            >
              {flowEndMessage}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hasQueue = queue.length > 0;

  return (
    <>
      <QueuePanel isOpen={showQueue} onClose={() => setShowQueue(false)} />
      
      <div className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t safe-area-bottom" style={{ backgroundColor: 'hsl(var(--surface-elevated) / 0.98)', borderColor: 'hsl(var(--border))' }}>
      {/* Progress bar - clickable */}
      <div 
        className="absolute top-0 left-0 right-0 h-1 cursor-pointer group"
        style={{ backgroundColor: 'hsl(var(--muted))' }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const percent = (e.clientX - rect.left) / rect.width;
          seek(percent * duration);
        }}
      >
        <div 
          className="h-full bg-gradient-to-r transition-all duration-100"
          style={{ width: `${progress}%`, background: 'linear-gradient(to right, hsl(var(--accent)), hsl(var(--accent-hover)))' }}
        />
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)', backgroundColor: 'hsl(var(--accent))' }}
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
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm md:text-base truncate" style={{ color: 'hsl(var(--foreground))' }}>
                  {currentTrack.title}
                </p>
                {isFlowMode && (
                  <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ 
                      backgroundColor: 'hsl(var(--accent) / 0.2)',
                      color: 'hsl(var(--accent))'
                    }}
                  >
                    Flow
                  </span>
                )}
              </div>
              {currentTrack.intention && (
                <p className="text-xs md:text-sm truncate" style={{ color: 'hsl(var(--text-muted))' }}>
                  {currentTrack.intention}
                </p>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Visualizer - desktop only */}
            <div className="hidden lg:block">
              <AudioVisualizer width={200} height={40} barCount={40} />
            </div>

            {/* Time - hidden on mobile */}
            <span className="hidden md:block text-sm font-mono min-w-[4rem] text-right" style={{ color: 'hsl(var(--text-muted))' }}>
              {formatTime(currentTime)}
            </span>

            {/* Previous */}
            <Button
              variant="ghost"
              size="icon"
              onClick={playPrevious}
              disabled={queueIndex <= 0 && currentTime < 3}
              className="hidden md:flex h-9 w-9"
              style={{ color: 'hsl(var(--text-muted))' }}
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              disabled={isLoading}
              className="w-12 h-12 rounded-full transition-all shadow-lg"
              style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.25)' }}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>

            {/* Next */}
            <Button
              variant="ghost"
              size="icon"
              onClick={playNext}
              disabled={!isFlowMode && (!hasQueue || queueIndex >= queue.length - 1)}
              className="hidden md:flex h-9 w-9"
              style={{ color: 'hsl(var(--text-muted))' }}
            >
              <SkipForward className="w-4 h-4" />
            </Button>

            {/* Duration - hidden on mobile */}
            <span className="hidden md:block text-sm font-mono min-w-[4rem]" style={{ color: 'hsl(var(--text-muted))' }}>
              {formatTime(duration)}
            </span>

            {/* Volume - hidden on mobile */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
                className="h-8 w-8"
                style={{ color: 'hsl(var(--text-muted))' }}
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

            {/* Queue */}
            {hasQueue && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowQueue(!showQueue)}
                className="h-8 w-8 relative"
                style={{ color: showQueue ? 'hsl(var(--accent))' : 'hsl(var(--text-muted))' }}
              >
                <List className="w-4 h-4" />
                {queue.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 text-xs rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--accent))', color: 'white' }}>
                    {queue.length}
                  </span>
                )}
              </Button>
            )}

            {/* Close */}
            <Button
              variant="ghost"
              size="icon"
              onClick={closePlayer}
              className="h-8 w-8"
              style={{ color: 'hsl(var(--text-muted))' }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Keyboard shortcuts hint */}
      <div className="hidden lg:block absolute bottom-full left-4 mb-2 bg-stone-900/90 backdrop-blur-sm border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-400 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
        <div className="space-y-1">
          <div><kbd className="px-1.5 py-0.5 bg-stone-800 rounded">Space</kbd> Play/Pause</div>
          <div><kbd className="px-1.5 py-0.5 bg-stone-800 rounded">←/→</kbd> Seek ±10s</div>
          <div><kbd className="px-1.5 py-0.5 bg-stone-800 rounded">↑/↓</kbd> Volume</div>
          <div><kbd className="px-1.5 py-0.5 bg-stone-800 rounded">N/P</kbd> Next/Previous</div>
          <div><kbd className="px-1.5 py-0.5 bg-stone-800 rounded">M</kbd> Mute</div>
        </div>
      </div>
    </div>
    </>
  );
}
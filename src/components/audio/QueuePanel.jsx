import React from 'react';
import { useAudioPlayer } from './AudioPlayerContext.jsx';
import { Button } from '@/components/ui/button';
import { X, Music, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function QueuePanel({ isOpen, onClose }) {
  const { queue, queueIndex, currentTrack, removeFromQueue, clearQueue } = useAudioPlayer();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 backdrop-blur-xl border-l z-50 flex flex-col" style={{ backgroundColor: 'hsl(var(--surface-elevated) / 0.98)', borderColor: 'hsl(var(--border))' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'hsl(var(--divider))' }}>
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5" style={{ color: 'hsl(var(--accent))' }} />
          <h2 className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>Queue</h2>
          <span className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>({queue.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearQueue}
              className="h-8 hover:text-red-600"
              style={{ color: 'hsl(var(--text-muted))' }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            style={{ color: 'hsl(var(--text-muted))' }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Current Track */}
      {currentTrack && (
        <div className="p-4 border-b" style={{ borderColor: 'hsl(var(--divider))' }}>
          <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'hsl(var(--text-muted))', letterSpacing: 'var(--letter-spacing-wide)' }}>Now Playing</p>
          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'hsl(var(--muted))' }}>
            {currentTrack.cover_image_url ? (
              <img
                src={currentTrack.cover_image_url}
                alt={currentTrack.title}
                className="w-12 h-12 rounded object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, hsl(var(--accent) / 0.2), hsl(var(--muted)))' }}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--accent) / 0.5)' }} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>{currentTrack.title}</p>
              {currentTrack.intention && (
                <p className="text-xs truncate" style={{ color: 'hsl(var(--text-muted))' }}>{currentTrack.intention}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Music className="w-12 h-12 mb-3" style={{ color: 'hsl(var(--text-subtle))' }} />
            <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>Queue is empty</p>
            <p className="text-xs mt-1" style={{ color: 'hsl(var(--text-subtle))' }}>Add tracks to play next</p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            <p className="text-xs uppercase mb-2" style={{ color: 'hsl(var(--text-muted))', letterSpacing: 'var(--letter-spacing-wide)' }}>Up Next</p>
            {queue.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg transition-all group border"
                style={index === queueIndex ? 
                  { backgroundColor: 'hsl(var(--accent) / 0.1)', borderColor: 'hsl(var(--accent) / 0.3)' } : 
                  { backgroundColor: 'hsl(var(--muted))', borderColor: 'transparent' }}
              >
                {item.track.cover_image_url ? (
                  <img
                    src={item.track.cover_image_url}
                    alt={item.track.title}
                    className="w-10 h-10 rounded object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, hsl(var(--accent) / 0.2), hsl(var(--muted)))' }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--accent) / 0.5)' }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ color: 'hsl(var(--foreground))' }}>{item.track.title}</p>
                  {item.track.intention && (
                    <p className="text-xs truncate" style={{ color: 'hsl(var(--text-muted))' }}>{item.track.intention}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFromQueue(index)}
                  className="opacity-0 group-hover:opacity-100 h-8 w-8 hover:text-red-600"
                  style={{ color: 'hsl(var(--text-muted))' }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import React from 'react';
import { useAudioPlayer } from './AudioPlayerContext.jsx';
import { Button } from '@/components/ui/button';
import { X, Music, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function QueuePanel({ isOpen, onClose }) {
  const { queue, queueIndex, currentTrack, removeFromQueue, clearQueue } = useAudioPlayer();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-stone-900/98 backdrop-blur-xl border-l border-stone-800 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-amber-600" />
          <h2 className="text-white font-medium">Queue</h2>
          <span className="text-stone-400 text-sm">({queue.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearQueue}
              className="text-stone-400 hover:text-red-400 h-8"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-stone-400 hover:text-white h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Current Track */}
      {currentTrack && (
        <div className="p-4 border-b border-stone-800">
          <p className="text-stone-400 text-xs uppercase tracking-wide mb-2">Now Playing</p>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-stone-800/50">
            {currentTrack.cover_image_url ? (
              <img
                src={currentTrack.cover_image_url}
                alt={currentTrack.title}
                className="w-12 h-12 rounded object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded bg-gradient-to-br from-amber-600/20 to-stone-800 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-amber-600/50" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{currentTrack.title}</p>
              {currentTrack.intention && (
                <p className="text-stone-400 text-xs truncate">{currentTrack.intention}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Music className="w-12 h-12 text-stone-700 mb-3" />
            <p className="text-stone-400 text-sm">Queue is empty</p>
            <p className="text-stone-500 text-xs mt-1">Add tracks to play next</p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            <p className="text-stone-400 text-xs uppercase tracking-wide mb-2">Up Next</p>
            {queue.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-all group",
                  index === queueIndex
                    ? "bg-amber-600/20 border border-amber-600/30"
                    : "bg-stone-800/30 hover:bg-stone-800/50"
                )}
              >
                {item.track.cover_image_url ? (
                  <img
                    src={item.track.cover_image_url}
                    alt={item.track.title}
                    className="w-10 h-10 rounded object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-gradient-to-br from-amber-600/20 to-stone-800 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-amber-600/50" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{item.track.title}</p>
                  {item.track.intention && (
                    <p className="text-stone-400 text-xs truncate">{item.track.intention}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFromQueue(index)}
                  className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-400 h-8 w-8"
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
import React from 'react';
import { Play, Pause, Lock, Loader2 } from 'lucide-react';
import { useAudioPlayer } from '../audio/AudioPlayerContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const TIER_HIERARCHY = {
  free: 0,
  member: 1,
  resonance_path: 2,
  collaborations: 3,
};

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const tierLabels = {
  free: 'Free',
  member: 'Member',
  resonance_path: 'ResonancePath',
  collaborations: 'Collaborations',
};

const nervousSystemColors = {
  calming: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  activating: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  balancing: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export default function TrackCard({ track, userTier, onUpgradeClick }) {
  const { currentTrack, isPlaying, isLoading, playTrack } = useAudioPlayer();
  const isCurrentTrack = currentTrack?.id === track.id;
  const canAccess = TIER_HIERARCHY[userTier] >= TIER_HIERARCHY[track.access_tier];
  const isLocked = !canAccess;

  const handlePlay = () => {
    if (isLocked) {
      onUpgradeClick();
      return;
    }
    playTrack(track);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        "group relative bg-stone-900/50 backdrop-blur-sm rounded-2xl overflow-hidden",
        "border border-stone-800/50 hover:border-stone-700/50 transition-all duration-300",
        "hover:shadow-xl hover:shadow-stone-950/50",
        isCurrentTrack && "ring-2 ring-amber-500/50 border-amber-500/30"
      )}
    >
      {/* Cover Image */}
      <div className="relative aspect-square overflow-hidden">
        {track.cover_image_url ? (
          <img
            src={track.cover_image_url}
            alt={track.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600/30 to-stone-700" />
          </div>
        )}

        {/* Overlay */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-transparent",
          "opacity-60 group-hover:opacity-80 transition-opacity duration-300"
        )} />

        {/* Play Button */}
        <button
          onClick={handlePlay}
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "opacity-0 group-hover:opacity-100 transition-all duration-300"
          )}
        >
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center",
            "transition-all duration-300 transform group-hover:scale-100 scale-90",
            isLocked 
              ? "bg-stone-700/80 text-stone-400" 
              : "bg-amber-600 text-white shadow-lg shadow-amber-600/30"
          )}>
            {isLocked ? (
              <Lock className="w-6 h-6" />
            ) : isCurrentTrack && isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isCurrentTrack && isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </div>
        </button>

        {/* Featured Badge */}
        {track.is_featured && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-amber-600/90 text-white border-0 text-xs font-medium">
              Featured
            </Badge>
          </div>
        )}

        {/* Access Tier Badge */}
        {track.access_tier !== 'free' && (
          <div className="absolute top-3 right-3">
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs font-medium border",
                isLocked 
                  ? "bg-stone-800/80 text-stone-300 border-stone-600" 
                  : "bg-amber-600/20 text-amber-400 border-amber-500/30"
              )}
            >
              {tierLabels[track.access_tier]}
            </Badge>
          </div>
        )}

        {/* Duration */}
        <div className="absolute bottom-3 right-3">
          <span className="text-xs text-stone-300 font-mono bg-stone-950/60 px-2 py-1 rounded">
            {formatDuration(track.duration_seconds)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-white font-medium text-base mb-1 line-clamp-1">
          {track.title}
        </h3>
        
        {track.intention && (
          <p className="text-stone-400 text-sm line-clamp-2 mb-3">
            {track.intention}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {track.nervous_system_state && (
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs capitalize",
                nervousSystemColors[track.nervous_system_state] || "bg-stone-800 text-stone-400"
              )}
            >
              {track.nervous_system_state}
            </Badge>
          )}
          {track.voice_present && (
            <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/20">
              Guided
            </Badge>
          )}
          {track.chakra && track.chakra !== 'none' && (
            <Badge variant="outline" className="text-xs bg-stone-800/50 text-stone-400 border-stone-700 capitalize">
              {track.chakra.replace('_', ' ')}
            </Badge>
          )}
        </div>
      </div>

      {/* Now Playing Indicator */}
      {isCurrentTrack && isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 to-amber-400">
          <div className="h-full bg-white/20 animate-pulse" />
        </div>
      )}
    </motion.div>
  );
}
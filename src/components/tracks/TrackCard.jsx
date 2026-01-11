import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAudioPlayer } from '@/components/audio/AudioPlayerContext.jsx';
import { Play, Pause, Lock, Loader2, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TIER_HIERARCHY = {
  free: 0,
  member: 1,
  resonance_path: 2,
  collaborations: 3,
};

const tierLabels = {
  free: 'Free',
  member: 'Member',
  resonance_path: 'ResonancePath',
  collaborations: 'Collaborations',
};

const nervousSystemColors = {
  calming: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  activating: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  balancing: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function TrackCard({ track, userTier = 'free', onUpgradeClick }) {
  const { currentTrack, isPlaying, playTrack, togglePlayPause, isLoading: audioLoading } = useAudioPlayer();
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const isLocked = TIER_HIERARCHY[userTier] < TIER_HIERARCHY[track.access_tier];
  const isCurrentTrack = currentTrack?.id === track.id;
  const isTrackPlaying = isCurrentTrack && isPlaying;

  const handlePlayClick = async () => {
    if (isLocked) {
      onUpgradeClick?.();
      return;
    }

    if (isCurrentTrack) {
      togglePlayPause();
      return;
    }

    setIsLoadingAudio(true);
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: track.audio_file_uri,
        expires_in: 3600,
      });

      // Increment play count
      await base44.entities.Track.update(track.id, {
        play_count: (track.play_count || 0) + 1,
      });

      // Log play to history
      const user = await base44.auth.me();
      if (user) {
        await base44.entities.PlayHistory.create({
          user_email: user.email,
          track_id: track.id,
          played_at: new Date().toISOString(),
          completed: false,
        }).catch(() => {});
      }

      playTrack({ ...track, audioUrl: signed_url });
    } catch (error) {
      console.error('Failed to load track:', error);
      toast.error('Failed to load track');
    } finally {
      setIsLoadingAudio(false);
    }
  };

  return (
    <Card
      className={cn(
        "group overflow-hidden border transition-all duration-300 hover:shadow-xl",
        isCurrentTrack
          ? "border-amber-600/50 bg-stone-900 shadow-lg shadow-amber-600/10"
          : "border-stone-800 bg-stone-900/50 hover:border-stone-700"
      )}
    >
      {/* Cover Image */}
      <div className="relative aspect-square overflow-hidden bg-stone-800">
        {track.cover_image_url ? (
          <img
            src={track.cover_image_url}
            alt={track.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-800 to-stone-900">
            <div className="w-16 h-16 rounded-full bg-stone-700/50" />
          </div>
        )}

        {/* Play Button Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity",
            "opacity-0 group-hover:opacity-100",
            isCurrentTrack && "opacity-100"
          )}
        >
          <button
            onClick={handlePlayClick}
            disabled={isLoadingAudio || audioLoading}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-all transform",
              "hover:scale-110 active:scale-95",
              isLocked
                ? "bg-stone-700 text-stone-400"
                : "bg-amber-600 text-white shadow-lg"
            )}
          >
            {isLoadingAudio || (isCurrentTrack && audioLoading) ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isLocked ? (
              <Lock className="w-6 h-6" />
            ) : isTrackPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </button>
        </div>

        {/* Featured Badge */}
        {track.is_featured && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-amber-600/90 text-white border-0 backdrop-blur-sm">
              <Star className="w-3 h-3 mr-1 fill-white" />
              Featured
            </Badge>
          </div>
        )}

        {/* Duration */}
        <div className="absolute bottom-2 right-2">
          <Badge variant="outline" className="bg-black/60 backdrop-blur-sm border-stone-700 text-white font-mono text-xs">
            {formatDuration(track.duration_seconds)}
          </Badge>
        </div>
      </div>

      {/* Track Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-white font-medium line-clamp-1 mb-1">
            {track.title}
          </h3>
          {track.intention && (
            <p className="text-stone-400 text-sm line-clamp-2">
              {track.intention}
            </p>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {track.nervous_system_state && (
            <Badge
              variant="outline"
              className={cn("text-xs capitalize", nervousSystemColors[track.nervous_system_state])}
            >
              {track.nervous_system_state}
            </Badge>
          )}
          {isLocked && (
            <Badge variant="outline" className="bg-stone-800 border-stone-700 text-stone-400 text-xs">
              <Lock className="w-3 h-3 mr-1" />
              {tierLabels[track.access_tier]}
            </Badge>
          )}
          {track.voice_present && (
            <Badge variant="outline" className="bg-stone-800 border-stone-700 text-stone-400 text-xs">
              Guided
            </Badge>
          )}
        </div>

        {/* Themes */}
        {track.themes && track.themes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {track.themes.slice(0, 3).map((theme) => (
              <span
                key={theme}
                className="text-xs text-stone-500 capitalize"
              >
                #{theme}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
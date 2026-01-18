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
  calming: 'bg-blue-100 text-blue-800 border-blue-200',
  activating: 'bg-rose-100 text-rose-800 border-rose-200',
  balancing: 'bg-purple-100 text-purple-800 border-purple-200',
};

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function TrackCard({ track, userTier = 'free', onUpgradeClick }) {
  const { currentTrack, isPlaying, playTrack, togglePlay, isLoading: audioLoading } = useAudioPlayer();
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
      togglePlay();
      return;
    }

    setIsLoadingAudio(true);
    try {
      console.log('Loading track:', track.title, 'URI:', track.audio_file_uri);
      
      if (!track.audio_file_uri) {
        throw new Error('Track has no audio file');
      }

      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: track.audio_file_uri,
        expires_in: 3600,
      });

      console.log('Got signed URL:', signed_url);

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

      playTrack(track, signed_url);
    } catch (error) {
      console.error('Failed to load track:', error);
      toast.error(`Failed to load track: ${error.message}`);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all duration-500",
        isCurrentTrack && "shadow-xl"
      )}
      style={{ 
        backgroundColor: isCurrentTrack ? 'hsl(var(--surface-elevated))' : 'hsl(var(--card))',
        borderRadius: '1rem',
        border: isCurrentTrack ? '1.5px solid hsl(var(--accent) / 0.4)' : '1px solid hsl(var(--border) / 0.5)',
        boxShadow: isCurrentTrack 
          ? '0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px hsl(var(--accent) / 0.1)' 
          : '0 1px 3px rgba(0, 0, 0, 0.04)'
      }}
    >
      {/* Cover Image */}
      <div className="relative aspect-square overflow-hidden" style={{ backgroundColor: 'hsl(var(--muted))' }}>
        {track.cover_image_url ? (
          <img
            src={track.cover_image_url}
            alt={track.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="w-16 h-16 rounded-full" style={{ backgroundColor: 'hsl(var(--muted))' }} />
          </div>
        )}

        {/* Play Button Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-purple-900/30 flex items-center justify-center transition-opacity",
            "opacity-0 group-hover:opacity-100",
            isCurrentTrack && "opacity-100"
          )}
        >
          <button
            onClick={handlePlayClick}
            disabled={isLoadingAudio || audioLoading}
            className="w-16 h-16 rounded-full flex items-center justify-center transition-all transform hover:scale-110 active:scale-95"
            style={{
              backgroundColor: isLocked ? 'hsl(var(--muted))' : 'hsl(var(--primary))',
              color: isLocked ? 'hsl(var(--text-muted))' : 'hsl(var(--primary-foreground))',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(8px)'
            }}
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
            <Badge className="backdrop-blur-sm border-0" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
              <Star className="w-3 h-3 mr-1 fill-current" />
              Featured
            </Badge>
          </div>
        )}

        {/* Duration */}
        <div className="absolute bottom-2 right-2">
          <Badge variant="outline" className="bg-white/80 backdrop-blur-sm font-mono text-xs" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
            {formatDuration(track.duration_seconds)}
          </Badge>
        </div>
      </div>

      {/* Track Info */}
      <div className="p-5 space-y-3">
        <div>
          <h3 className="font-medium line-clamp-1 mb-1.5" style={{ color: 'hsl(var(--foreground))', fontSize: '1.0625rem', lineHeight: '1.5', fontFamily: 'var(--font-heading)', letterSpacing: '0.015em' }}>
            {track.title}
          </h3>
          {track.intention && (
            <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: 'hsl(var(--text-muted))' }}>
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
            <Badge variant="outline" className="text-xs" style={{ backgroundColor: 'hsl(var(--muted))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--text-muted))' }}>
              <Lock className="w-3 h-3 mr-1" />
              {tierLabels[track.access_tier]}
            </Badge>
          )}
          {track.voice_present && (
            <Badge variant="outline" className="text-xs" style={{ backgroundColor: 'hsl(var(--muted))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--text-muted))' }}>
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
                className="text-xs capitalize"
                style={{ color: 'hsl(var(--text-subtle))' }}
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
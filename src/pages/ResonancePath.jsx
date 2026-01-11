import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAudioPlayer } from '@/components/audio/AudioPlayerContext.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  CheckCircle2,
  Circle,
  Lock,
  Play,
  Pause,
  Loader2,
  Award,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function ResonancePath() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentTrack, isPlaying, playTrack, togglePlayPause, isLoading: audioLoading } = useAudioPlayer();
  const [user, setUser] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Check user access and fetch preferences
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);

        const subscriptions = await base44.entities.UserSubscription.filter({
          user_email: userData.email,
          is_active: true,
        });

        const allowedTiers = ['resonance_path', 'collaborations'];
        const userTier = subscriptions[0]?.tier || 'free';
        setHasAccess(allowedTiers.includes(userTier));
      } catch {
        setHasAccess(false);
      } finally {
        setCheckingAccess(false);
      }
    };
    checkAccess();
  }, []);

  // Fetch user preferences for recommendations
  const { data: preferences } = useQuery({
    queryKey: ['user-preferences', user?.email],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: user.email });
      return prefs[0] || null;
    },
    enabled: hasAccess && !!user,
  });

  // Fetch phases
  const { data: phases = [], isLoading: phasesLoading } = useQuery({
    queryKey: ['phases'],
    queryFn: async () => {
      const allPhases = await base44.entities.Phase.list('sort_order');
      return allPhases.filter(p => p.is_published);
    },
    enabled: hasAccess,
  });

  // Fetch phase tracks
  const { data: phaseTracks = [], isLoading: phaseTracksLoading } = useQuery({
    queryKey: ['phase-tracks'],
    queryFn: () => base44.entities.PhaseTrack.list('sort_order'),
    enabled: hasAccess,
  });

  // Fetch all tracks
  const { data: allTracks = [] } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => base44.entities.Track.list(),
    enabled: hasAccess,
  });

  // Fetch user progress
  const { data: userProgress = [] } = useQuery({
    queryKey: ['user-progress', user?.email],
    queryFn: () =>
      base44.entities.UserProgress.filter({ user_email: user.email }),
    enabled: hasAccess && !!user,
  });

  // Mark complete mutation
  const markCompleteMutation = useMutation({
    mutationFn: async ({ trackId, phaseId }) => {
      const existing = userProgress.find(
        p => p.track_id === trackId && p.phase_id === phaseId
      );
      if (existing) {
        await base44.entities.UserProgress.delete(existing.id);
        return { action: 'uncomplete' };
      } else {
        await base44.entities.UserProgress.create({
          user_email: user.email,
          track_id: trackId,
          phase_id: phaseId,
          completed_at: new Date().toISOString(),
        });
        return { action: 'complete' };
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-progress'] });
      toast.success(data.action === 'complete' ? 'Session completed! 🎉' : 'Marked as incomplete');
    },
  });

  // Organize data
  const phasesWithTracks = useMemo(() => {
    return phases.map(phase => {
      const phaseTrackLinks = phaseTracks
        .filter(pt => pt.phase_id === phase.id)
        .sort((a, b) => a.sort_order - b.sort_order);

      const tracks = phaseTrackLinks
        .map(pt => {
          const track = allTracks.find(t => t.id === pt.track_id);
          if (!track) return null;
          const isCompleted = userProgress.some(
            p => p.track_id === track.id && p.phase_id === phase.id
          );
          return {
            ...track,
            phaseTrackId: pt.id,
            sessionTitle: pt.session_title,
            isCompleted,
          };
        })
        .filter(Boolean);

      const completedCount = tracks.filter(t => t.isCompleted).length;
      const totalCount = tracks.length;
      const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

      return {
        ...phase,
        tracks,
        completedCount,
        totalCount,
        progress,
      };
    });
  }, [phases, phaseTracks, allTracks, userProgress]);

  const totalSessions = phasesWithTracks.reduce((sum, p) => sum + p.totalCount, 0);
  const completedSessions = phasesWithTracks.reduce((sum, p) => sum + p.completedCount, 0);
  const overallProgress = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

  const handlePlayTrack = async (track) => {
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: track.audio_file_uri,
        expires_in: 3600,
      });
      playTrack({ ...track, audioUrl: signed_url });
    } catch {
      toast.error('Failed to load track');
    }
  };

  if (checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <Card className="max-w-md w-full" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'hsl(var(--accent) / 0.15)' }}>
              <Lock className="w-8 h-8" style={{ color: 'hsl(var(--accent))' }} />
            </div>
            <h2 className="text-xl font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>ResonancePath Access Required</h2>
            <p className="mb-6" style={{ color: 'hsl(var(--text-muted))' }}>
              This guided program is exclusively available to ResonancePath members.
            </p>
            <Button
              onClick={() => navigate(createPageUrl('Pricing'))}
              className="mb-3"
              style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            >
              Upgrade to ResonancePath
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl('Home'))}
              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phasesLoading || phaseTracksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: 'hsl(var(--background))' }}>
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-100/20 to-transparent border-b" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Badge className="bg-purple-100 text-purple-900 border-purple-200 mb-4">
              <Award className="w-3 h-3 mr-1" />
              Guided Program
            </Badge>
            <h1 className="text-4xl md:text-5xl font-light mb-4" style={{ color: 'hsl(var(--text-heading))', fontFamily: 'var(--font-heading))' }}>
              ResonancePath
            </h1>
            <p className="text-lg max-w-2xl mx-auto mb-4" style={{ color: 'hsl(var(--text-body))' }}>
              A structured journey through curated sessions designed to deepen your practice
              and support your nervous system regulation.
            </p>

            {/* Personalized Recommendations */}
            {preferences?.resonance_focus_areas?.length > 0 && (
              <div className="mb-8">
                <p className="text-sm mb-2" style={{ color: 'hsl(var(--text-muted))' }}>Based on your focus areas:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {preferences.resonance_focus_areas.map(area => (
                    <Badge key={area} variant="outline" className="border-purple-300" style={{ color: 'hsl(var(--accent))' }}>
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Overall Progress */}
            <div className="rounded-xl p-6 border" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>Overall Progress</span>
                <span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                  {completedSessions} / {totalSessions} sessions
                </span>
              </div>
              <Progress value={overallProgress} className="h-2" />
              <div className="mt-2 text-xs" style={{ color: 'hsl(var(--text-subtle))' }}>
                {Math.round(overallProgress)}% complete
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Phases */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {phasesWithTracks.length === 0 ? (
          <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <CardContent className="pt-6 text-center py-12">
              <TrendingUp className="w-16 h-16 mx-auto mb-4" style={{ color: 'hsl(var(--text-subtle))' }} />
              <p style={{ color: 'hsl(var(--text-muted))' }}>
                The ResonancePath program is being prepared. Check back soon!
              </p>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {phasesWithTracks.map((phase, index) => (
              <AccordionItem
                key={phase.id}
                value={phase.id}
                className="border-0"
              >
                <Card className="overflow-hidden" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                  <AccordionTrigger className="px-6 py-4 hover:no-underline" style={{ ':hover': { backgroundColor: 'hsl(var(--muted))' } }}>
                    <div className="flex items-center gap-4 w-full text-left">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--accent) / 0.15)' }}>
                        <span className="font-medium" style={{ color: 'hsl(var(--accent))' }}>{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                          {phase.name}
                        </h3>
                        {phase.description && (
                          <p className="text-sm line-clamp-1" style={{ color: 'hsl(var(--text-muted))' }}>
                            {phase.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <Progress
                            value={phase.progress}
                            className="h-1.5 flex-1 max-w-xs"
                          />
                          <span className="text-xs whitespace-nowrap" style={{ color: 'hsl(var(--text-subtle))' }}>
                            {phase.completedCount} / {phase.totalCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="px-6 pb-4 space-y-2">
                      {phase.tracks.map((track, trackIndex) => {
                        const isCurrentTrack = currentTrack?.id === track.id;
                        const isTrackPlaying = isCurrentTrack && isPlaying;
                        const isTrackLoading = isCurrentTrack && audioLoading;

                        return (
                          <motion.div
                            key={track.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: trackIndex * 0.05 }}
                            className="flex items-center gap-4 p-4 rounded-lg border transition-all"
                            style={isCurrentTrack ? 
                              { backgroundColor: 'hsl(var(--accent) / 0.08)', borderColor: 'hsl(var(--accent) / 0.3)' } : 
                              { backgroundColor: 'hsl(var(--muted))', borderColor: 'hsl(var(--border))' }}
                          >
                            {/* Completion Status */}
                            <button
                              onClick={() =>
                                markCompleteMutation.mutate({
                                  trackId: track.id,
                                  phaseId: phase.id,
                                })
                              }
                              className="flex-shrink-0"
                            >
                              {track.isCompleted ? (
                                <CheckCircle2 className="w-6 h-6 text-green-600 fill-green-100" />
                              ) : (
                                <Circle className="w-6 h-6" style={{ color: 'hsl(var(--text-subtle))' }} />
                              )}
                            </button>

                            {/* Cover Image */}
                            {track.cover_image_url ? (
                              <img
                                src={track.cover_image_url}
                                alt={track.title}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                                <span className="text-sm" style={{ color: 'hsl(var(--text-subtle))' }}>
                                  {trackIndex + 1}
                                </span>
                              </div>
                            )}

                            {/* Track Info */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                                {track.sessionTitle || track.title}
                              </h4>
                              {track.intention && (
                                <p className="text-sm line-clamp-1" style={{ color: 'hsl(var(--text-muted))' }}>
                                  {track.intention}
                                </p>
                              )}
                            </div>

                            {/* Duration */}
                            <span className="text-sm font-mono" style={{ color: 'hsl(var(--text-muted))' }}>
                              {formatDuration(track.duration_seconds)}
                            </span>

                            {/* Play Button */}
                            <Button
                              size="icon"
                              variant={isCurrentTrack ? "default" : "ghost"}
                              onClick={() =>
                                isCurrentTrack
                                  ? togglePlayPause()
                                  : handlePlayTrack(track)
                              }
                              disabled={isTrackLoading}
                              style={isCurrentTrack ? 
                                { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' } : 
                                {}}
                            >
                              {isTrackLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : isTrackPlaying ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </Button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}
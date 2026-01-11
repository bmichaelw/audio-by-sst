import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Crown,
  TrendingUp,
  Clock,
  Music,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch {
        navigate(createPageUrl('Home'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const { data: subscription } = useQuery({
    queryKey: ['user-subscription', user?.email],
    queryFn: async () => {
      const subs = await base44.entities.UserSubscription.filter({
        user_email: user.email,
        is_active: true,
      });
      return subs[0] || null;
    },
    enabled: !!user,
  });

  const { data: phases = [] } = useQuery({
    queryKey: ['phases'],
    queryFn: async () => {
      const allPhases = await base44.entities.Phase.list('sort_order');
      return allPhases.filter(p => p.is_published);
    },
    enabled: !!user,
  });

  const { data: phaseTracks = [] } = useQuery({
    queryKey: ['phase-tracks'],
    queryFn: () => base44.entities.PhaseTrack.list('sort_order'),
    enabled: !!user,
  });

  const { data: userProgress = [] } = useQuery({
    queryKey: ['user-progress', user?.email],
    queryFn: () => base44.entities.UserProgress.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const { data: playHistory = [] } = useQuery({
    queryKey: ['play-history', user?.email],
    queryFn: async () => {
      const history = await base44.entities.PlayHistory.filter({
        user_email: user.email,
      });
      return history.sort((a, b) => new Date(b.played_at) - new Date(a.played_at)).slice(0, 20);
    },
    enabled: !!user,
  });

  const { data: allTracks = [] } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => base44.entities.Track.list(),
    enabled: !!user,
  });

  // Calculate stats
  const totalSessions = phaseTracks.length;
  const completedSessions = userProgress.length;
  const overallProgress = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

  const tierLabels = {
    free: 'Free',
    member: 'Member',
    resonance_path: 'ResonancePath',
    collaborations: 'Collaborations',
  };

  const tierColors = {
    free: 'bg-stone-600',
    member: 'bg-blue-600',
    resonance_path: 'bg-amber-600',
    collaborations: 'bg-purple-600',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-b from-stone-900 to-stone-950 border-b border-stone-800/50">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-6"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white text-2xl font-medium">
              {user?.full_name?.[0] || user?.email?.[0] || 'U'}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-light text-white mb-2">
                {user?.full_name || 'User Profile'}
              </h1>
              <p className="text-stone-400">{user?.email}</p>
              <div className="flex items-center gap-3 mt-4">
                <Badge className={cn(tierColors[subscription?.tier || 'free'], 'text-white')}>
                  {tierLabels[subscription?.tier || 'free']}
                </Badge>
                {user?.role === 'admin' && (
                  <Badge variant="outline" className="text-amber-400 border-amber-600">
                    <Crown className="w-3 h-3 mr-1" />
                    Admin
                  </Badge>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-stone-900/50 border border-stone-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="progress">ResonancePath Progress</TabsTrigger>
            <TabsTrigger value="history">Listening History</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Subscription Card */}
            <Card className="bg-stone-900/50 border-stone-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subscription ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-stone-400 text-sm">Current Plan</p>
                        <p className="text-white text-xl font-medium">
                          {tierLabels[subscription.tier]}
                        </p>
                      </div>
                      {subscription.expires_at && (
                        <div className="text-right">
                          <p className="text-stone-400 text-sm">Renews</p>
                          <p className="text-white">{formatDate(subscription.expires_at)}</p>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => navigate(createPageUrl('Pricing'))}
                      variant="outline"
                      className="w-full border-stone-700 text-stone-300 hover:bg-stone-800"
                    >
                      Manage Subscription
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-stone-400 mb-4">
                      You're currently on the free plan
                    </p>
                    <Button
                      onClick={() => navigate(createPageUrl('Pricing'))}
                      className="bg-amber-600 hover:bg-amber-500"
                    >
                      Upgrade Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-stone-900/50 border-stone-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center">
                      <Music className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-stone-400 text-sm">Tracks Played</p>
                      <p className="text-2xl font-medium text-white">{playHistory.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-stone-900/50 border-stone-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-600/10 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-stone-400 text-sm">Sessions Complete</p>
                      <p className="text-2xl font-medium text-white">{completedSessions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-stone-900/50 border-stone-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-600/10 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-stone-400 text-sm">Progress</p>
                      <p className="text-2xl font-medium text-white">
                        {Math.round(overallProgress)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            {phases.length === 0 ? (
              <Card className="bg-stone-900/50 border-stone-800">
                <CardContent className="pt-6 text-center py-12">
                  <TrendingUp className="w-16 h-16 text-stone-600 mx-auto mb-4" />
                  <p className="text-stone-400">
                    ResonancePath program not yet available.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="bg-stone-900/50 border-stone-800">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-stone-400 text-sm">Overall Progress</span>
                      <span className="text-white font-medium">
                        {completedSessions} / {totalSessions} sessions
                      </span>
                    </div>
                    <Progress value={overallProgress} className="h-2 bg-stone-800" />
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {phases.map((phase) => {
                    const phaseTrackIds = phaseTracks
                      .filter(pt => pt.phase_id === phase.id)
                      .map(pt => pt.track_id);
                    const phaseCompleted = userProgress.filter(
                      p => p.phase_id === phase.id
                    ).length;
                    const phaseTotal = phaseTrackIds.length;
                    const phaseProgress = phaseTotal > 0 ? (phaseCompleted / phaseTotal) * 100 : 0;

                    return (
                      <Card key={phase.id} className="bg-stone-900/50 border-stone-800">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-white font-medium">{phase.name}</h3>
                            <span className="text-stone-400 text-sm">
                              {phaseCompleted} / {phaseTotal}
                            </span>
                          </div>
                          <Progress value={phaseProgress} className="h-1.5 bg-stone-800 mb-2" />
                          {phase.description && (
                            <p className="text-stone-500 text-sm">{phase.description}</p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <Button
                  onClick={() => navigate(createPageUrl('ResonancePath'))}
                  className="w-full bg-amber-600 hover:bg-amber-500"
                >
                  Continue Program
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            {playHistory.length === 0 ? (
              <Card className="bg-stone-900/50 border-stone-800">
                <CardContent className="pt-6 text-center py-12">
                  <Clock className="w-16 h-16 text-stone-600 mx-auto mb-4" />
                  <p className="text-stone-400 mb-4">No listening history yet</p>
                  <Button
                    onClick={() => navigate(createPageUrl('Library'))}
                    className="bg-amber-600 hover:bg-amber-500"
                  >
                    Explore Library
                  </Button>
                </CardContent>
              </Card>
            ) : (
              playHistory.map((history) => {
                const track = allTracks.find(t => t.id === history.track_id);
                if (!track) return null;

                return (
                  <Card key={history.id} className="bg-stone-900/50 border-stone-800">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        {track.cover_image_url ? (
                          <img
                            src={track.cover_image_url}
                            alt={track.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-stone-800 flex items-center justify-center">
                            <Music className="w-6 h-6 text-stone-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium mb-1">{track.title}</h4>
                          <div className="flex items-center gap-3 text-sm text-stone-400">
                            <span>{formatDuration(track.duration_seconds)}</span>
                            <span>•</span>
                            <span>{formatDate(history.played_at)}</span>
                          </div>
                        </div>
                        {history.completed && (
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
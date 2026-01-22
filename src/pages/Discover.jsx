import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import TrackCard from '@/components/tracks/TrackCard.jsx';
import SessionCard from '@/components/live/SessionCard.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Music, Radio, Loader2, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Discover() {
  const [user, setUser] = useState(null);
  const [userTier, setUserTier] = useState('free');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedMood, setSelectedMood] = useState('all');
  const [selectedArtist, setSelectedArtist] = useState('all');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);

        const sub = await base44.entities.UserSubscription.filter({
          user_email: userData.email,
          is_active: true,
        });
        if (sub.length > 0) {
          setUserTier(sub[0].tier);
        }
      } catch {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  const { data: tracks = [], isLoading: tracksLoading } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => base44.entities.Track.filter({ is_archived: false }),
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['live-sessions'],
    queryFn: () => base44.entities.LiveSession.filter({ is_archived: false }),
  });

  const { data: playHistory = [] } = useQuery({
    queryKey: ['play-history', user?.email],
    queryFn: () => user ? base44.entities.PlayHistory.filter({ user_email: user.email }) : [],
    enabled: !!user,
  });

  const { data: artists = [] } = useQuery({
    queryKey: ['artists'],
    queryFn: async () => {
      const allUsers = await base44.entities.User.list();
      return allUsers.filter(u => u.is_artist && u.artist_approved);
    },
  });

  // Get unique themes and moods from tracks
  const allThemes = [...new Set(tracks.flatMap(t => t.themes || []))];
  const allMoods = [...new Set(tracks.map(t => t.nervous_system_state).filter(Boolean))];

  // Get recently played track IDs
  const recentlyPlayedTrackIds = playHistory.slice(0, 10).map(h => h.track_id);
  
  // Get subscribed artists
  const subscribedArtistEmails = user?.subscribed_artists || [];

  // Filter tracks
  let filteredTracks = tracks.filter(track => {
    if (selectedGenre !== 'all' && !track.themes?.includes(selectedGenre)) return false;
    if (selectedMood !== 'all' && track.nervous_system_state !== selectedMood) return false;
    if (selectedArtist !== 'all' && track.created_by !== selectedArtist) return false;
    return true;
  });

  // Personalized recommendations based on listening history and subscriptions
  const recommendedTracks = filteredTracks
    .filter(track => {
      // Prioritize tracks from subscribed artists
      if (subscribedArtistEmails.includes(track.created_by)) return true;
      
      // Prioritize tracks with similar themes to recently played
      const recentTrack = tracks.find(t => recentlyPlayedTrackIds.includes(t.id));
      if (recentTrack && track.themes?.some(theme => recentTrack.themes?.includes(theme))) return true;
      
      return true;
    })
    .sort((a, b) => {
      // Sort by: subscribed artists first, then featured, then newest
      const aFromSubscribed = subscribedArtistEmails.includes(a.created_by) ? 1 : 0;
      const bFromSubscribed = subscribedArtistEmails.includes(b.created_by) ? 1 : 0;
      if (aFromSubscribed !== bFromSubscribed) return bFromSubscribed - aFromSubscribed;
      
      if (a.is_featured !== b.is_featured) return b.is_featured ? 1 : -1;
      
      return new Date(b.created_date) - new Date(a.created_date);
    });

  // Filter sessions
  const upcomingSessions = sessions
    .filter(s => new Date(s.scheduled_time) > new Date() && !s.is_live)
    .filter(session => {
      if (selectedArtist !== 'all' && session.created_by !== selectedArtist) return false;
      return true;
    })
    .sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time));

  if (tracksLoading || sessionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <div className="bg-gradient-to-b from-purple-50/50 to-transparent border-b" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-8 h-8" style={{ color: 'hsl(var(--accent))' }} />
            <h1 className="text-4xl font-light" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.03em', color: 'hsl(var(--foreground))' }}>
              Discover
            </h1>
          </div>
          <div className="h-px w-32 mb-4" style={{ background: 'linear-gradient(to right, hsl(var(--accent)), transparent)' }} />
          <p className="text-lg" style={{ color: 'hsl(var(--text-muted))' }}>
            Personalized recommendations based on your listening journey
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="mb-8" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm mb-2 block" style={{ color: 'hsl(var(--text-muted))' }}>Genre/Theme</label>
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genres</SelectItem>
                    {allThemes.map(theme => (
                      <SelectItem key={theme} value={theme}>{theme}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm mb-2 block" style={{ color: 'hsl(var(--text-muted))' }}>Mood/Effect</label>
                <Select value={selectedMood} onValueChange={setSelectedMood}>
                  <SelectTrigger style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Moods</SelectItem>
                    {allMoods.map(mood => (
                      <SelectItem key={mood} value={mood}>{mood}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm mb-2 block" style={{ color: 'hsl(var(--text-muted))' }}>Artist</label>
                <Select value={selectedArtist} onValueChange={setSelectedArtist}>
                  <SelectTrigger style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Artists</SelectItem>
                    {artists.map(artist => (
                      <SelectItem key={artist.email} value={artist.email}>
                        {artist.full_name || artist.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(selectedGenre !== 'all' || selectedMood !== 'all' || selectedArtist !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedGenre('all');
                  setSelectedMood('all');
                  setSelectedArtist('all');
                }}
                className="mt-4"
                style={{ borderColor: 'hsl(var(--border))' }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="tracks" className="space-y-8">
          <TabsList style={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))' }}>
            <TabsTrigger value="tracks">
              <Music className="w-4 h-4 mr-2" />
              Tracks ({recommendedTracks.length})
            </TabsTrigger>
            <TabsTrigger value="sessions">
              <Radio className="w-4 h-4 mr-2" />
              Upcoming Sessions ({upcomingSessions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracks">
            {recommendedTracks.length === 0 ? (
              <div className="text-center py-20">
                <Music className="w-16 h-16 mx-auto mb-4" style={{ color: 'hsl(var(--text-subtle))' }} />
                <p style={{ color: 'hsl(var(--text-muted))' }}>No tracks found matching your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedTracks.map((track, index) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <TrackCard track={track} userTier={userTier} />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sessions">
            {upcomingSessions.length === 0 ? (
              <div className="text-center py-20">
                <Radio className="w-16 h-16 mx-auto mb-4" style={{ color: 'hsl(var(--text-subtle))' }} />
                <p style={{ color: 'hsl(var(--text-muted))' }}>No upcoming sessions found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingSessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <SessionCard session={session} userTier={userTier} />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
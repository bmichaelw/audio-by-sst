import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Music, Clock, Heart, Sparkles, Play, User } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAudioPlayer } from '@/components/audio/AudioPlayerContext.jsx';

export default function ListenerProfile() {
  const queryClient = useQueryClient();
  const { playTrack } = useAudioPlayer();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (error) {
        toast.error('Please log in to view your profile');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Fetch listening history
  const { data: playHistory = [] } = useQuery({
    queryKey: ['play-history', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.PlayHistory.filter({ user_email: user.email }, '-played_at', 50);
    },
    enabled: !!user
  });

  // Fetch playlists (flows)
  const { data: userPlaylists = [] } = useQuery({
    queryKey: ['user-playlists', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Playlist.filter({ user_email: user.email }, '-created_date');
    },
    enabled: !!user
  });

  // Fetch subscription
  const { data: subscription = null } = useQuery({
    queryKey: ['user-subscription', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const subs = await base44.entities.UserSubscription.filter({ 
        user_email: user.email,
        is_active: true 
      });
      return subs[0] || null;
    },
    enabled: !!user
  });

  // Fetch favorite artists
  const { data: favoriteArtists = [] } = useQuery({
    queryKey: ['favorite-artists', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const favorites = await base44.entities.FavoriteArtist.filter({ user_email: user.email });
      const artistEmails = favorites.map(f => f.artist_email);
      if (artistEmails.length === 0) return [];
      
      const artists = await base44.entities.User.list();
      return artists.filter(a => artistEmails.includes(a.email));
    },
    enabled: !!user
  });

  // Fetch tracks for history
  const { data: tracks = [] } = useQuery({
    queryKey: ['tracks-for-history'],
    queryFn: async () => {
      const trackIds = [...new Set(playHistory.map(ph => ph.track_id))];
      if (trackIds.length === 0) return [];
      const allTracks = await base44.entities.Track.list();
      return allTracks.filter(t => trackIds.includes(t.id));
    },
    enabled: playHistory.length > 0
  });

  const handlePlayTrack = async (track) => {
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: track.audio_file_uri,
        expires_in: 3600
      });
      playTrack(track, signed_url);
    } catch (error) {
      toast.error('Failed to play track');
    }
  };

  const toggleFavoriteArtist = async (artistEmail) => {
    try {
      const existing = await base44.entities.FavoriteArtist.filter({
        user_email: user.email,
        artist_email: artistEmail
      });

      if (existing.length > 0) {
        await base44.entities.FavoriteArtist.delete(existing[0].id);
        toast.success('Artist removed from favorites');
      } else {
        await base44.entities.FavoriteArtist.create({
          user_email: user.email,
          artist_email: artistEmail
        });
        toast.success('Artist added to favorites');
      }
      queryClient.invalidateQueries(['favorite-artists', user.email]);
    } catch (error) {
      toast.error('Failed to update favorites');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(var(--accent))' }} />
      </div>
    );
  }

  // Get recent play history with track details
  const recentPlays = playHistory.slice(0, 20).map(ph => ({
    ...ph,
    track: tracks.find(t => t.id === ph.track_id)
  })).filter(ph => ph.track);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback style={{ backgroundColor: 'hsl(var(--accent) / 0.2)', color: 'hsl(var(--accent))' }}>
                {user?.full_name?.substring(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-light" style={{ color: 'hsl(var(--text-heading))', fontFamily: 'var(--font-heading)' }}>
                {user?.full_name}
              </h1>
              <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>
                {user?.email}
              </p>
            </div>
          </div>
          
          {subscription && (
            <Badge className="mt-2" style={{ backgroundColor: 'hsl(var(--accent) / 0.2)', color: 'hsl(var(--accent))' }}>
              <Sparkles className="w-3 h-3 mr-1" />
              {subscription.subscription_type === 'all_access' ? 'All-Access Member' : 'Artist Member'}
            </Badge>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="listening" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="listening">Listening</TabsTrigger>
            <TabsTrigger value="flows">Flows</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          </TabsList>

          {/* Listening History */}
          <TabsContent value="listening" className="space-y-4">
            <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
                  <Clock className="w-5 h-5" />
                  Recent Listening History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentPlays.length === 0 ? (
                  <div className="text-center py-12">
                    <Music className="w-12 h-12 mx-auto mb-3 opacity-40" style={{ color: 'hsl(var(--text-muted))' }} />
                    <p style={{ color: 'hsl(var(--text-muted))' }}>No listening history yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentPlays.map((play) => (
                      <div
                        key={play.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/5 transition-colors cursor-pointer"
                        onClick={() => handlePlayTrack(play.track)}
                      >
                        {play.track.cover_image_url ? (
                          <img src={play.track.cover_image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                            <Music className="w-6 h-6" style={{ color: 'hsl(var(--text-muted))' }} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>{play.track.title}</p>
                          <p className="text-sm truncate" style={{ color: 'hsl(var(--text-muted))' }}>
                            {new Date(play.played_at).toLocaleDateString()} at {new Date(play.played_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {play.completed && (
                          <Badge variant="outline" className="text-xs">Completed</Badge>
                        )}
                        <Play className="w-5 h-5 flex-shrink-0" style={{ color: 'hsl(var(--accent))' }} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Flows (Playlists) */}
          <TabsContent value="flows" className="space-y-4">
            <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
                    <Music className="w-5 h-5" />
                    Your Flows
                  </CardTitle>
                  <Link to={createPageUrl('Playlists')}>
                    <Button size="sm">Create New Flow</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {userPlaylists.length === 0 ? (
                  <div className="text-center py-12">
                    <Music className="w-12 h-12 mx-auto mb-3 opacity-40" style={{ color: 'hsl(var(--text-muted))' }} />
                    <p style={{ color: 'hsl(var(--text-muted))' }}>No flows created yet</p>
                    <Link to={createPageUrl('Playlists')}>
                      <Button variant="outline" size="sm" className="mt-4">Create Your First Flow</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userPlaylists.map((playlist) => (
                      <Link key={playlist.id} to={createPageUrl('Playlists') + '?id=' + playlist.id}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer" style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              {playlist.cover_image_url ? (
                                <img src={playlist.cover_image_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                              ) : (
                                <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                                  <Music className="w-8 h-8" style={{ color: 'hsl(var(--text-muted))' }} />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>{playlist.name}</p>
                                <p className="text-sm truncate" style={{ color: 'hsl(var(--text-muted))' }}>
                                  {playlist.description || 'No description'}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Favorite Artists */}
          <TabsContent value="favorites" className="space-y-4">
            <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
                  <Heart className="w-5 h-5" />
                  Favorite Artists
                </CardTitle>
              </CardHeader>
              <CardContent>
                {favoriteArtists.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-12 h-12 mx-auto mb-3 opacity-40" style={{ color: 'hsl(var(--text-muted))' }} />
                    <p style={{ color: 'hsl(var(--text-muted))' }}>No favorite artists yet</p>
                    <p className="text-sm mt-2" style={{ color: 'hsl(var(--text-subtle))' }}>
                      Visit artist pages to add them to your favorites
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {favoriteArtists.map((artist) => (
                      <Card key={artist.id} className="hover:shadow-md transition-shadow" style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <Link to={createPageUrl('ArtistProfile') + '?email=' + artist.email} className="flex items-center gap-3 flex-1 min-w-0">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={artist.avatar_url} />
                                <AvatarFallback style={{ backgroundColor: 'hsl(var(--accent) / 0.2)' }}>
                                  {artist.full_name?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>{artist.full_name}</p>
                                <p className="text-sm truncate" style={{ color: 'hsl(var(--text-muted))' }}>{artist.tagline || 'Artist'}</p>
                              </div>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleFavoriteArtist(artist.email)}
                            >
                              <Heart className="w-5 h-5 fill-current" style={{ color: 'hsl(var(--accent))' }} />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription */}
          <TabsContent value="subscription" className="space-y-4">
            <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
                  <Sparkles className="w-5 h-5" />
                  Subscription Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subscription ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'hsl(var(--accent) / 0.1)', borderColor: 'hsl(var(--accent) / 0.3)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                          {subscription.subscription_type === 'all_access' ? 'All-Access Membership' : 'Artist Membership'}
                        </p>
                        <Badge style={{ backgroundColor: 'hsl(var(--accent) / 0.2)', color: 'hsl(var(--accent))' }}>Active</Badge>
                      </div>
                      {subscription.expires_at && (
                        <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>
                          Renews on {new Date(subscription.expires_at).toLocaleDateString()}
                        </p>
                      )}
                      {subscription.artist_email && (
                        <p className="text-sm mt-2" style={{ color: 'hsl(var(--text-body))' }}>
                          Supporting: {subscription.artist_email}
                        </p>
                      )}
                    </div>
                    <Link to={createPageUrl('Pricing')}>
                      <Button variant="outline" className="w-full">Manage Subscription</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-40" style={{ color: 'hsl(var(--text-muted))' }} />
                    <p style={{ color: 'hsl(var(--text-muted))' }}>No active subscription</p>
                    <Link to={createPageUrl('Pricing')}>
                      <Button className="mt-4">Explore Membership Options</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
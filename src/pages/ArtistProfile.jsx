import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import TrackCard from '@/components/tracks/TrackCard.jsx';
import { Music, Edit, Loader2, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAudioPlayer } from '@/components/audio/AudioPlayerContext.jsx';
import { toast } from 'sonner';

export default function ArtistProfile() {
  const navigate = useNavigate();
  const { startFlow } = useAudioPlayer();
  const [currentUser, setCurrentUser] = useState(null);
  const [artistEmail, setArtistEmail] = useState(null);
  const [userTier, setUserTier] = useState('free');

  // Get artist email from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    setArtistEmail(email);
  }, []);

  // Fetch current user and subscription
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await base44.auth.me();
        setCurrentUser(userData);
        
        const subscriptions = await base44.entities.UserSubscription.filter({
          user_email: userData.email,
          is_active: true
        });
        
        if (subscriptions.length > 0) {
          setUserTier(subscriptions[0].subscription_type);
        }
      } catch {
        setCurrentUser(null);
      }
    };
    fetchUser();
  }, []);

  // Fetch artist data
  const { data: artist, isLoading: artistLoading } = useQuery({
    queryKey: ['artist', artistEmail],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ email: artistEmail });
      return users[0] || null;
    },
    enabled: !!artistEmail,
  });

  // Fetch artist's tracks
  const { data: tracks = [], isLoading: tracksLoading } = useQuery({
    queryKey: ['artist-tracks', artistEmail],
    queryFn: async () => {
      const allTracks = await base44.entities.Track.filter({ artist_email: artistEmail });
      return allTracks.filter(t => !t.is_archived);
    },
    enabled: !!artistEmail,
  });

  // Fetch artist's playlists/collections
  const { data: collections = [] } = useQuery({
    queryKey: ['artist-collections', artistEmail],
    queryFn: async () => {
      return await base44.entities.Playlist.filter({
        user_email: artistEmail,
        collection_type: 'artist_collection',
      });
    },
    enabled: !!artistEmail,
  });

  // Filter accessible tracks based on subscription
  const accessibleTracks = tracks.filter(track => {
    if (track.access_eligibility === 'all_access') {
      return userTier === 'all_access';
    }
    if (track.access_eligibility === 'artist_membership') {
      return userTier === 'all_access' || userTier === 'artist_membership';
    }
    return false;
  });

  // Fetch compatible all-access tracks for flow expansion
  const { data: allAccessTracks = [] } = useQuery({
    queryKey: ['all-access-tracks'],
    queryFn: async () => {
      const allTracks = await base44.entities.Track.filter({ 
        access_eligibility: 'all_access',
        is_archived: false 
      });
      return allTracks.filter(t => t.artist_email !== artistEmail);
    },
    enabled: userTier === 'all_access',
  });

  // Enter the Flow handler
  const handleEnterFlow = async () => {
    if (!currentUser) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    if (accessibleTracks.length === 0) {
      toast.error('No accessible tracks. Please subscribe to this artist.');
      return;
    }

    // Start intelligent flow with this artist
    toast.success('Entering the flow...');
    await startFlow(accessibleTracks[0], artistEmail);
  };

  // Toggle favorite
  const toggleFavorite = async () => {
    if (!currentUser) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    try {
      if (isFavorited) {
        const favorites = await base44.entities.FavoriteArtist.filter({
          user_email: currentUser.email,
          artist_email: artistEmail
        });
        if (favorites.length > 0) {
          await base44.entities.FavoriteArtist.delete(favorites[0].id);
        }
        setIsFavorited(false);
        toast.success('Removed from favorites');
      } else {
        await base44.entities.FavoriteArtist.create({
          user_email: currentUser.email,
          artist_email: artistEmail
        });
        setIsFavorited(true);
        toast.success('Added to favorites');
      }
    } catch (error) {
      toast.error('Failed to update favorites');
    }
  };

  if (artistLoading || !artist) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
      </div>
    );
  }

  const isOwnProfile = currentUser?.email === artist.email;
  const initials = artist.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'A';

  return (
    <div className="min-h-screen pb-12" style={{ backgroundColor: 'hsl(var(--background))' }}>
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--accent))]/10 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            {/* Avatar */}
            <Avatar className="w-32 h-32 border-4 shadow-lg" style={{ borderColor: 'hsl(var(--accent))' }}>
              <AvatarImage src={artist.artist_avatar_url} />
              <AvatarFallback className="text-3xl" style={{ backgroundColor: 'hsl(var(--accent) / 0.2)', color: 'hsl(var(--accent))' }}>
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Artist Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-light" style={{ color: 'hsl(var(--text-heading))', fontFamily: 'var(--font-heading)' }}>
                  {artist.full_name}
                </h1>
                {artist.artist_approved && (
                  <Badge style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
                    Verified Artist
                  </Badge>
                )}
              </div>

              {/* Artist Tagline */}
              <p className="text-xl mb-4" style={{ color: 'hsl(var(--text-muted))', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
                {artist.artist_tagline || 'Healing through sound'}
              </p>

              {/* Artist Bio */}
              {artist.artist_bio && (
                <p className="mb-6 max-w-2xl leading-relaxed" style={{ color: 'hsl(var(--text-body))' }}>
                  {artist.artist_bio}
                </p>
              )}

              {/* Primary CTA */}
              <div className="flex gap-3 items-center">
                <Button
                  size="lg"
                  onClick={handleEnterFlow}
                  disabled={!currentUser || accessibleTracks.length === 0}
                  className="px-8"
                  style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Enter the Flow
                </Button>

                {/* Edit Profile Button */}
                {isOwnProfile && (
                  <Button
                    variant="outline"
                    onClick={() => navigate('/settings')}
                    style={{ borderColor: 'hsl(var(--border))' }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>

              {!currentUser && (
                <p className="text-sm mt-3" style={{ color: 'hsl(var(--text-muted))' }}>
                  Sign in to enter the flow
                </p>
              )}

              {currentUser && accessibleTracks.length === 0 && (
                <p className="text-sm mt-3" style={{ color: 'hsl(var(--text-muted))' }}>
                  Subscribe to access this artist's content
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Collections Section */}
        {collections.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-light mb-6" style={{ color: 'hsl(var(--text-heading))', fontFamily: 'var(--font-heading)' }}>
              Collections & Albums
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <Card key={collection.id} className="hover:shadow-lg transition-all cursor-pointer group" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                  {collection.cover_image_url && (
                    <div className="relative aspect-video overflow-hidden">
                      <img 
                        src={collection.cover_image_url} 
                        alt={collection.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="font-medium mb-2 text-lg" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                      {collection.name}
                    </h3>
                    {collection.description && (
                      <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--text-muted))' }}>
                        {collection.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Tracks Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-light mb-6" style={{ color: 'hsl(var(--text-heading))', fontFamily: 'var(--font-heading)' }}>
            All Tracks
          </h2>
          {tracksLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: 'hsl(var(--primary))' }} />
            </div>
          ) : tracks.length === 0 ? (
            <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <CardContent className="p-8 text-center">
                <Music className="w-12 h-12 mx-auto mb-3 opacity-40" style={{ color: 'hsl(var(--text-muted))' }} />
                <p style={{ color: 'hsl(var(--text-muted))' }}>No tracks yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tracks.map((track) => (
                <TrackCard key={track.id} track={track} />
              ))}
            </div>
          )}
        </section>


      </div>
    </div>
  );
}
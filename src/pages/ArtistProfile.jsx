import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import TrackCard from '@/components/tracks/TrackCard.jsx';
import { Music, Calendar, Users, Edit, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ArtistProfile() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [artistEmail, setArtistEmail] = useState(null);

  // Get artist email from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    setArtistEmail(email);
  }, []);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await base44.auth.me();
        setCurrentUser(userData);
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
      const allTracks = await base44.entities.Track.filter({ created_by: artistEmail });
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
        is_public: true,
      });
    },
    enabled: !!artistEmail,
  });

  // Fetch artist's upcoming sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ['artist-sessions', artistEmail],
    queryFn: async () => {
      const allSessions = await base44.entities.LiveSession.list('-scheduled_time');
      return allSessions.filter(s => s.created_by === artistEmail && !s.is_archived && new Date(s.scheduled_time) > new Date());
    },
    enabled: !!artistEmail,
  });

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
        <div className="absolute inset-0 bg-gradient-to-b from-purple-100/30 to-transparent" />
        
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
                <p className="mb-4 max-w-2xl" style={{ color: 'hsl(var(--text-body))' }}>
                  {artist.artist_bio}
                </p>
              )}

              {/* Stats */}
              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4" style={{ color: 'hsl(var(--text-muted))' }} />
                  <span style={{ color: 'hsl(var(--foreground))' }}>{tracks.length} tracks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" style={{ color: 'hsl(var(--text-muted))' }} />
                  <span style={{ color: 'hsl(var(--foreground))' }}>{sessions.length} upcoming sessions</span>
                </div>
              </div>

              {/* Edit Profile Button */}
              {isOwnProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/settings')}
                  className="mt-4"
                  style={{ borderColor: 'hsl(var(--border))' }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tracks Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-light mb-6" style={{ color: 'hsl(var(--text-heading))', fontFamily: 'var(--font-heading)' }}>
            Tracks
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

        {/* Collections Section */}
        {collections.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-light mb-6" style={{ color: 'hsl(var(--text-heading))', fontFamily: 'var(--font-heading)' }}>
              Collections
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map((collection) => (
                <Card key={collection.id} className="hover:shadow-md transition-shadow cursor-pointer" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                  <CardContent className="p-6">
                    <h3 className="font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                      {collection.name}
                    </h3>
                    <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>
                      {collection.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Sessions */}
        {sessions.length > 0 && (
          <section>
            <h2 className="text-2xl font-light mb-6" style={{ color: 'hsl(var(--text-heading))', fontFamily: 'var(--font-heading)' }}>
              Upcoming Live Sessions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session) => (
                <Card key={session.id} className="hover:shadow-md transition-shadow" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                  <CardContent className="p-6">
                    <h3 className="font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                      {session.title}
                    </h3>
                    <p className="text-sm mb-3" style={{ color: 'hsl(var(--text-muted))' }}>
                      {new Date(session.scheduled_time).toLocaleDateString()} at {new Date(session.scheduled_time).toLocaleTimeString()}
                    </p>
                    <Button size="sm" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                      Learn More
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import FlowPlayerEmbed from '@/components/embed/FlowPlayerEmbed.jsx';
import { Loader2, AlertCircle } from 'lucide-react';

export default function EmbedFlowPlayer() {
  const [user, setUser] = useState(null);
  const [userTier, setUserTier] = useState('free');
  const [playlistId, setPlaylistId] = useState(null);

  // Get playlist ID from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPlaylistId(params.get('playlist_id'));
  }, []);

  // Fetch user and subscription
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        const subscriptions = await base44.entities.UserSubscription.filter({
          user_email: userData.email,
          is_active: true
        });
        
        if (subscriptions.length > 0) {
          setUserTier(subscriptions[0].subscription_type);
        }
      } catch {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  // Fetch playlist details
  const { data: playlist, isLoading: playlistLoading } = useQuery({
    queryKey: ['playlist', playlistId],
    queryFn: async () => {
      const playlists = await base44.entities.Playlist.filter({ id: playlistId });
      return playlists[0];
    },
    enabled: !!playlistId
  });

  // Fetch playlist tracks
  const { data: playlistTracks = [] } = useQuery({
    queryKey: ['playlist-tracks', playlistId],
    queryFn: async () => {
      return await base44.entities.PlaylistTrack.filter({ playlist_id: playlistId });
    },
    enabled: !!playlistId
  });

  // Fetch all tracks in playlist
  const { data: tracks = [] } = useQuery({
    queryKey: ['tracks', playlistTracks],
    queryFn: async () => {
      const trackIds = playlistTracks.map(pt => pt.track_id);
      if (trackIds.length === 0) return [];
      
      const allTracks = await base44.entities.Track.list();
      return allTracks
        .filter(t => trackIds.includes(t.id))
        .sort((a, b) => {
          const aOrder = playlistTracks.find(pt => pt.track_id === a.id)?.sort_order || 0;
          const bOrder = playlistTracks.find(pt => pt.track_id === b.id)?.sort_order || 0;
          return aOrder - bOrder;
        });
    },
    enabled: playlistTracks.length > 0
  });

  // Fetch artist info for creator
  const { data: artist } = useQuery({
    queryKey: ['artist', playlist?.user_email],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ email: playlist.user_email });
      return users[0];
    },
    enabled: !!playlist?.user_email
  });

  // Filter tracks by access
  const accessibleTracks = tracks.filter(track => {
    if (track.access_eligibility === 'all_access') {
      return userTier === 'all_access';
    }
    
    if (track.access_eligibility === 'artist_membership') {
      return userTier === 'all_access' || 
             (userTier === 'artist_membership' && user?.artist_email === track.artist_email);
    }
    
    return false;
  });

  if (!playlistId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-stone-400" />
          <p className="text-stone-600">No playlist specified</p>
        </div>
      </div>
    );
  }

  if (playlistLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-stone-400" />
          <p className="text-stone-600">Playlist not found</p>
        </div>
      </div>
    );
  }

  if (accessibleTracks.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-600" />
          <h2 className="text-xl font-light mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Subscription Required
          </h2>
          <p className="text-stone-600 mb-6">
            This flow requires a subscription to access.
          </p>
          <a 
            href={window.location.origin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-[#d9ca9c] text-white rounded-lg hover:bg-[#c9ba8c] transition-colors"
          >
            Subscribe on Au'Dio
          </a>
        </div>
      </div>
    );
  }

  return (
    <FlowPlayerEmbed
      playlist={playlist}
      tracks={accessibleTracks}
      artist={artist}
      user={user}
    />
  );
}
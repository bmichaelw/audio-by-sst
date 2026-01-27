import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import SingleTrackEmbed from '@/components/embed/SingleTrackEmbed.jsx';
import { Loader2, AlertCircle } from 'lucide-react';

export default function EmbedSingleTrack() {
  const [user, setUser] = useState(null);
  const [userTier, setUserTier] = useState('free');
  const [trackId, setTrackId] = useState(null);

  // Get track ID from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setTrackId(params.get('track_id'));
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

  // Fetch track details
  const { data: track, isLoading: trackLoading } = useQuery({
    queryKey: ['track', trackId],
    queryFn: async () => {
      const tracks = await base44.entities.Track.filter({ id: trackId });
      return tracks[0];
    },
    enabled: !!trackId
  });

  // Fetch artist info
  const { data: artist } = useQuery({
    queryKey: ['artist', track?.artist_email],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ email: track.artist_email });
      return users[0];
    },
    enabled: !!track?.artist_email
  });

  // Check access eligibility
  const hasAccess = () => {
    if (!track) return false;
    
    if (track.access_eligibility === 'all_access') {
      return userTier === 'all_access';
    }
    
    if (track.access_eligibility === 'artist_membership') {
      return userTier === 'all_access' || 
             (userTier === 'artist_membership' && user?.artist_email === track.artist_email);
    }
    
    return false;
  };

  if (!trackId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-stone-400" />
          <p className="text-stone-600">No track specified</p>
        </div>
      </div>
    );
  }

  if (trackLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!track) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-stone-400" />
          <p className="text-stone-600">Track not found</p>
        </div>
      </div>
    );
  }

  if (!hasAccess()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-600" />
          <h2 className="text-xl font-light mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Subscription Required
          </h2>
          <p className="text-stone-600 mb-6">
            This track requires a subscription to access.
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
    <SingleTrackEmbed
      track={track}
      artist={artist}
      user={user}
    />
  );
}
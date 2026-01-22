import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import TrackList from '@/components/tracks/TrackList.jsx';
import TrackFilters from '@/components/tracks/TrackFilters.jsx';
import UpgradeModal from '@/components/subscription/UpgradeModal.jsx';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const [userTier, setUserTier] = useState('free');
  const [userEmail, setUserEmail] = useState(null);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    theme: 'all',
    nervousSystem: 'all',
    chakra: 'all',
    difficulty: 'all',
    voicePresent: 'all',
    accessTier: 'all'
  });

  // Fetch user and subscription
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          setUserEmail(user.email);
          const subscriptions = await base44.entities.UserSubscription.filter({
            user_email: user.email,
            is_active: true
          });
          if (subscriptions.length > 0) {
            setUserTier(subscriptions[0].tier);
          }
        }
      } catch {


        // User not logged in, default to free tier
      }};fetchUserData();
  }, []);

  // Fetch user preferences
  const { data: preferences } = useQuery({
    queryKey: ['user-preferences', userEmail],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: userEmail });
      return prefs[0] || null;
    },
    enabled: !!userEmail
  });

  // Fetch user's recent playlists
  const { data: recentPlaylists = [] } = useQuery({
    queryKey: ['recent-playlists', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      const playlists = await base44.entities.Playlist.filter({ user_email: userEmail });
      return playlists.slice(0, 4);
    },
    enabled: !!userEmail
  });

  // Fetch play history for stats
  const { data: playHistory = [] } = useQuery({
    queryKey: ['play-history', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      return await base44.entities.PlayHistory.filter({ user_email: userEmail });
    },
    enabled: !!userEmail
  });

  // Calculate stats
  const stats = useMemo(() => {
    const totalListens = playHistory.length;
    const totalMinutes = Math.floor(playHistory.reduce((sum, ph) => {
      return sum + (ph.completed ? 5 : 0); // Rough estimate
    }, 0));
    return {
      totalListens,
      totalMinutes,
      playlistCount: recentPlaylists.length
    };
  }, [playHistory, recentPlaylists]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-100/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-200/20 via-transparent to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto">

<div className="flex justify-center mb-6">
  <Badge className="inline-flex items-center bg-purple-100 text-purple-900 border-purple-200">
    <Sparkles className="w-3 h-3 mr-1" />
    Healing Through Vocal Resonance™
  </Badge>
</div>
            
            {/* Title with Logo Sigil */}
            <div className="relative inline-block mb-4">
              {/* Sacred Logo Sigil - Behind Title Only */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '-20%', height: '140%' }}>
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6963e3baba38fec6b46ac249/c1e96d6f5_AuDiosanguinelogosquare.png" 
                  alt="" 
                  className="w-[280px] h-[280px] md:w-[380px] md:h-[380px] object-contain opacity-15"
                />
              </div>
              
              {/* Title Text */}
              <h1 className="relative text-4xl md:text-6xl font-light" style={{ color: 'hsl(var(--text-heading))', fontFamily: 'var(--font-heading)', letterSpacing: '0.03em' }}>
                Au'Dio
                <span className="block text-xl md:text-2xl mt-3 font-light" style={{ color: 'hsl(var(--text-muted))', fontFamily: 'var(--font-body)', letterSpacing: '0.05em' }}>
                  by Sanguine Sound Therapy
                </span>
              </h1>
            </div>
            <div className="h-px w-32 mx-auto my-6" style={{ background: 'linear-gradient(to right, transparent, hsl(var(--accent)), transparent)' }} />
            <p className="text-xl md:text-2xl font-light mb-2" style={{ color: 'hsl(var(--text-heading))', fontFamily: 'var(--font-heading)', letterSpacing: '0.02em' }}>
              Ancient sound. Modern healing.
            </p>
            <p className="text-lg mb-8 max-w-2xl mx-auto leading-relaxed" style={{ color: 'hsl(var(--text-body))' }}>A curated collection of therapeutic audio designed to help you reprogram, support your nervous system, deepen your practice, and guide you toward inner peace.


            </p>
            
            {userTier === 'free' &&
            <div className="flex flex-wrap justify-center gap-4">
                <Button
                onClick={() => setIsUpgradeOpen(true)}
                className="px-8 py-6 text-base"
                style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>

                  <Heart className="w-4 h-4 mr-2" />
                  Begin Your Journey
                </Button>
                <Link to={createPageUrl('Library')}>
                  <Button variant="outline" className="px-8 py-6 text-base border-purple-300 text-purple-900 hover:bg-purple-50">
                    Explore Sample Tracks
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            }
          </motion.div>
        </div>
      </section>

      {/* Recommended/Featured Tracks */}
      {heroTracks.length > 0 &&
      <section className="max-w-7xl mx-auto px-4 pb-16">
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}>

            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-light mb-2" style={{ color: 'hsl(var(--text-heading))', fontFamily: 'var(--font-heading)', letterSpacing: '0.025em' }}>
                  {recommendedTracks.length > 0 ? 'Recommended for You' : 'Featured Sessions'}
                </h2>
                <div className="h-px w-20 mb-2" style={{ background: 'linear-gradient(to right, hsl(var(--accent)), transparent)' }} />
                {recommendedTracks.length > 0 &&
              <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>Based on your preferences</p>
              }
              </div>
              <Link
              to={createPageUrl('Library')}
              className="text-sm flex items-center gap-1 transition-colors"
              style={{ color: 'hsl(var(--accent))', hover: { color: 'hsl(var(--accent-hover))' } }}>

                View all
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <TrackList
            tracks={heroTracks}
            isLoading={false}
            userTier={userTier}
            onUpgradeClick={() => setIsUpgradeOpen(true)} />

          </motion.div>
        </section>
      }

      {/* All Tracks with Filters */}
      <section className="max-w-7xl mx-auto px-4 pb-32">
        <div className="mb-8">
          <h2 className="text-2xl font-light mb-6" style={{ color: 'hsl(var(--text-heading))', fontFamily: 'var(--font-heading))' }}>Sound Library</h2>
          <TrackFilters
            filters={filters}
            onFilterChange={setFilters}
            themes={themeNames}
            activeFiltersCount={activeFiltersCount} />

        </div>

        <TrackList
          tracks={filteredTracks}
          isLoading={isLoading}
          userTier={userTier}
          onUpgradeClick={() => setIsUpgradeOpen(true)} />

      </section>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        currentTier={userTier} />

    </div>);

}
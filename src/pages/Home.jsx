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
    accessTier: 'all',
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
            is_active: true,
          });
          if (subscriptions.length > 0) {
            setUserTier(subscriptions[0].tier);
          }
        }
      } catch {
        // User not logged in, default to free tier
      }
    };
    fetchUserData();
  }, []);

  // Fetch user preferences
  const { data: preferences } = useQuery({
    queryKey: ['user-preferences', userEmail],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: userEmail });
      return prefs[0] || null;
    },
    enabled: !!userEmail,
  });

  // Fetch tracks
  const { data: tracks = [], isLoading } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => base44.entities.Track.list('-created_date'),
  });

  // Fetch themes for filter options
  const { data: themesData = [] } = useQuery({
    queryKey: ['themes'],
    queryFn: () => base44.entities.Theme.list('sort_order'),
  });

  const themeNames = useMemo(() => themesData.map((t) => t.name), [themesData]);

  // Filter tracks
  const filteredTracks = useMemo(() => {
    return tracks.filter((track) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          track.title?.toLowerCase().includes(searchLower) ||
          track.description?.toLowerCase().includes(searchLower) ||
          track.intention?.toLowerCase().includes(searchLower) ||
          track.themes?.some((t) => t.toLowerCase().includes(searchLower)) ||
          track.tags?.some((t) => t.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Theme filter
      if (filters.theme !== 'all' && !track.themes?.includes(filters.theme)) {
        return false;
      }

      // Nervous system filter
      if (filters.nervousSystem !== 'all' && track.nervous_system_state !== filters.nervousSystem) {
        return false;
      }

      // Chakra filter
      if (filters.chakra !== 'all' && track.chakra !== filters.chakra) {
        return false;
      }

      // Difficulty filter
      if (filters.difficulty !== 'all' && track.difficulty_level !== filters.difficulty) {
        return false;
      }

      // Voice filter
      if (filters.voicePresent !== 'all') {
        const hasVoice = filters.voicePresent === 'true';
        if (track.voice_present !== hasVoice) return false;
      }

      // Access tier filter
      if (filters.accessTier !== 'all' && track.access_tier !== filters.accessTier) {
        return false;
      }

      return true;
    });
  }, [tracks, filters]);

  // Personalized recommendations based on preferences
  const recommendedTracks = useMemo(() => {
    if (!preferences || tracks.length === 0) return [];

    const scored = tracks.map(track => {
      let score = 0;

      // Match preferred themes
      if (preferences.preferred_themes?.length > 0) {
        const themeMatch = track.themes?.some(t => preferences.preferred_themes.includes(t));
        if (themeMatch) score += 3;
      }

      // Match preferred chakras
      if (preferences.preferred_chakras?.length > 0 && track.chakra) {
        if (preferences.preferred_chakras.includes(track.chakra)) score += 2;
      }

      // Match nervous system preferences
      if (preferences.preferred_nervous_system_states?.length > 0 && track.nervous_system_state) {
        if (preferences.preferred_nervous_system_states.includes(track.nervous_system_state)) score += 2;
      }

      // Match difficulty level
      if (preferences.difficulty_level && track.difficulty_level === preferences.difficulty_level) {
        score += 1;
      }

      // Match voice preference
      if (preferences.voice_preference === 'with_voice' && track.voice_present) score += 1;
      if (preferences.voice_preference === 'without_voice' && !track.voice_present) score += 1;

      // Match session duration
      if (preferences.session_duration_preference && track.duration_seconds) {
        const minutes = track.duration_seconds / 60;
        if (preferences.session_duration_preference === 'short' && minutes < 15) score += 1;
        if (preferences.session_duration_preference === 'medium' && minutes >= 15 && minutes <= 30) score += 1;
        if (preferences.session_duration_preference === 'long' && minutes > 30) score += 1;
      }

      return { track, score };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(item => item.track);
  }, [tracks, preferences]);

  // Featured tracks
  const featuredTracks = useMemo(() => {
    return tracks.filter((t) => t.is_featured).slice(0, 4);
  }, [tracks]);

  // Display personalized tracks if available, otherwise featured
  const heroTracks = recommendedTracks.length > 0 ? recommendedTracks : featuredTracks;

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.theme !== 'all') count++;
    if (filters.nervousSystem !== 'all') count++;
    if (filters.chakra !== 'all') count++;
    if (filters.difficulty !== 'all') count++;
    if (filters.voicePresent !== 'all') count++;
    if (filters.accessTier !== 'all') count++;
    return count;
  }, [filters]);

  return (
    <div className="min-h-screen bg-stone-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 via-stone-950 to-stone-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/5 via-transparent to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <Badge className="bg-amber-600/10 text-amber-400 border-amber-600/20 mb-6">
              <Sparkles className="w-3 h-3 mr-1" />
              Therapeutic Sound Library
            </Badge>
            <h1 className="text-4xl md:text-6xl font-light text-white mb-6 tracking-tight">
              Sounds for your
              <span className="block text-amber-500">healing journey</span>
            </h1>
            <p className="text-lg text-stone-400 mb-8 max-w-2xl mx-auto leading-relaxed">
              A curated collection of therapeutic audio designed to support your nervous system, 
              deepen your practice, and guide you toward inner peace.
            </p>
            
            {userTier === 'free' && (
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  onClick={() => setIsUpgradeOpen(true)}
                  className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-6 text-base"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Start Your Journey
                </Button>
                <Link to={createPageUrl('Library')}>
                  <Button variant="outline" className="border-stone-700 text-stone-300 hover:bg-stone-800 px-8 py-6 text-base">
                    Explore Free Tracks
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Recommended/Featured Tracks */}
      {heroTracks.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-light text-white">
                  {recommendedTracks.length > 0 ? 'Recommended for You' : 'Featured'}
                </h2>
                {recommendedTracks.length > 0 && (
                  <p className="text-stone-400 text-sm mt-1">Based on your preferences</p>
                )}
              </div>
              <Link
                to={createPageUrl('Library')}
                className="text-amber-500 hover:text-amber-400 text-sm flex items-center gap-1"
              >
                View all
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <TrackList
              tracks={heroTracks}
              isLoading={false}
              userTier={userTier}
              onUpgradeClick={() => setIsUpgradeOpen(true)}
            />
          </motion.div>
        </section>
      )}

      {/* All Tracks with Filters */}
      <section className="max-w-7xl mx-auto px-4 pb-32">
        <div className="mb-8">
          <h2 className="text-2xl font-light text-white mb-6">Sound Library</h2>
          <TrackFilters
            filters={filters}
            onFilterChange={setFilters}
            themes={themeNames}
            activeFiltersCount={activeFiltersCount}
          />
        </div>

        <TrackList
          tracks={filteredTracks}
          isLoading={isLoading}
          userTier={userTier}
          onUpgradeClick={() => setIsUpgradeOpen(true)}
        />
      </section>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        currentTier={userTier}
      />
    </div>
  );
}
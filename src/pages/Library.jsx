import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import TrackList from '@/components/tracks/TrackList.jsx';
import TrackFilters from '@/components/tracks/TrackFilters.jsx';
import UpgradeModal from '@/components/subscription/UpgradeModal.jsx';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';

export default function Library() {
  const [userTier, setUserTier] = useState('free');
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
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
          const subscriptions = await base44.entities.UserSubscription.filter({
            user_email: user.email,
            is_active: true,
          });
          if (subscriptions.length > 0) {
            setUserTier(subscriptions[0].tier);
          }
        }
      } catch {
        // User not logged in
      }
    };
    fetchUserData();
  }, []);

  // Fetch tracks
  const { data: tracks = [], isLoading } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => base44.entities.Track.list('-created_date'),
  });

  // Fetch themes
  const { data: themesData = [] } = useQuery({
    queryKey: ['themes'],
    queryFn: () => base44.entities.Theme.list('sort_order'),
  });

  const themeNames = useMemo(() => themesData.map((t) => t.name), [themesData]);

  // Filter tracks based on all criteria
  const filteredTracks = useMemo(() => {
    return tracks.filter((track) => {
      // Tab filter (access tier)
      if (activeTab === 'free' && track.access_tier !== 'free') return false;
      if (activeTab === 'member' && track.access_tier !== 'member') return false;
      if (activeTab === 'resonance' && track.access_tier !== 'resonance_path') return false;

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

      // Access tier filter from filters
      if (filters.accessTier !== 'all' && track.access_tier !== filters.accessTier) {
        return false;
      }

      return true;
    });
  }, [tracks, filters, activeTab]);

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
    <div className="min-h-screen bg-stone-950 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-b from-stone-900 to-stone-950 border-b border-stone-800/50">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-light text-white mb-2">
              Sound Library
            </h1>
            <p className="text-stone-400">
              {tracks.length} tracks available for your practice
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tier Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-stone-900/50 border border-stone-800">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-stone-800 data-[state=active]:text-white"
            >
              All Tracks
            </TabsTrigger>
            <TabsTrigger
              value="free"
              className="data-[state=active]:bg-stone-800 data-[state=active]:text-white"
            >
              Sample Library
            </TabsTrigger>
            <TabsTrigger
              value="member"
              className="data-[state=active]:bg-stone-800 data-[state=active]:text-white"
            >
              Member
            </TabsTrigger>
            <TabsTrigger
              value="resonance"
              className="data-[state=active]:bg-stone-800 data-[state=active]:text-white"
            >
              ResonancePath
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <div className="mb-8">
          <TrackFilters
            filters={filters}
            onFilterChange={setFilters}
            themes={themeNames}
            activeFiltersCount={activeFiltersCount}
          />
        </div>

        {/* Track List */}
        <TrackList
          tracks={filteredTracks}
          isLoading={isLoading}
          userTier={userTier}
          onUpgradeClick={() => setIsUpgradeOpen(true)}
          emptyMessage={
            activeTab === 'free'
              ? "No free sample tracks available at the moment."
              : "No tracks found matching your criteria."
          }
        />
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        currentTier={userTier}
      />
    </div>
  );
}
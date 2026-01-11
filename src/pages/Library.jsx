import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import TrackList from '@/components/tracks/TrackList.jsx';
import TrackFilters from '@/components/tracks/TrackFilters.jsx';
import UpgradeModal from '@/components/subscription/UpgradeModal.jsx';
import { FiltersSkeleton, TrackListSkeleton } from '@/components/LoadingSkeleton.jsx';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Library() {
  const [userTier, setUserTier] = useState('free');
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    theme: 'all',
    intention: '',
    nervousSystem: 'all',
    chakra: 'all',
    difficulty: 'all',
    voicePresent: 'all',
    accessTier: 'all',
  });

  const TRACKS_PER_PAGE = 12;

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

  // Fetch tracks with caching
  const { data: allTracks = [], isLoading } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => base44.entities.Track.list('-created_date'),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch themes
  const { data: themesData = [] } = useQuery({
    queryKey: ['themes'],
    queryFn: () => base44.entities.Theme.list('sort_order'),
  });

  const themeNames = useMemo(() => themesData.map((t) => t.name), [themesData]);

  // Filter and sort tracks
  const filteredAndSortedTracks = useMemo(() => {
    let result = allTracks.filter((track) => {
      // Tab filter (access tier)
      if (activeTab === 'free' && track.access_tier !== 'free') return false;
      if (activeTab === 'member' && track.access_tier !== 'member') return false;
      if (activeTab === 'resonance' && track.access_tier !== 'resonance_path') return false;

      // Search filter - searches across multiple fields
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

      // Intention filter (text search)
      if (filters.intention && !track.intention?.toLowerCase().includes(filters.intention.toLowerCase())) {
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

    // Apply sorting
    switch (sortBy) {
      case 'featured':
        result.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        break;
      case 'duration_short':
        result.sort((a, b) => a.duration_seconds - b.duration_seconds);
        break;
      case 'duration_long':
        result.sort((a, b) => b.duration_seconds - a.duration_seconds);
        break;
      default:
        // Keep original order
    }

    return result;
  }, [allTracks, filters, activeTab, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTracks.length / TRACKS_PER_PAGE);
  const paginatedTracks = useMemo(() => {
    const startIndex = (currentPage - 1) * TRACKS_PER_PAGE;
    return filteredAndSortedTracks.slice(startIndex, startIndex + TRACKS_PER_PAGE);
  }, [filteredAndSortedTracks, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, activeTab, sortBy]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.theme !== 'all') count++;
    if (filters.intention) count++;
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

        {/* Filters and Sort */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <TrackFilters
            filters={filters}
            onFilterChange={setFilters}
            themes={themeNames}
            activeFiltersCount={activeFiltersCount}
          />

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-stone-400 text-sm whitespace-nowrap">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-stone-900/50 border-stone-800 text-white w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-stone-800 border-stone-700">
                <SelectItem value="featured">Featured First</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="duration_short">Shortest First</SelectItem>
                <SelectItem value="duration_long">Longest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4 text-stone-400 text-sm">
          Showing {paginatedTracks.length} of {filteredAndSortedTracks.length} tracks
        </div>

        {/* Track List */}
        <TrackList
          tracks={paginatedTracks}
          isLoading={isLoading}
          userTier={userTier}
          onUpgradeClick={() => setIsUpgradeOpen(true)}
          emptyMessage={
            activeTab === 'free'
              ? "No free sample tracks available at the moment."
              : "No tracks found matching your criteria."
          }
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={
                      currentPage === pageNum
                        ? "bg-amber-600 hover:bg-amber-500 text-white"
                        : "border-stone-700 text-stone-300 hover:bg-stone-800"
                    }
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
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
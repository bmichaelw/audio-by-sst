import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import UpgradeModal from '@/components/subscription/UpgradeModal.jsx';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sparkles, ArrowRight, Heart, Search, Music, Clock, List, Play } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userTier, setUserTier] = useState('free');
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch user and subscription
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        if (userData) {
          const subscriptions = await base44.entities.UserSubscription.filter({
            user_email: userData.email,
            is_active: true
          });
          if (subscriptions.length > 0) {
            setUserTier(subscriptions[0].tier);
          }
        }
      } catch {
        setUser(null);
      }
    };
    fetchUserData();
  }, []);

  // Fetch user's recent playlists
  const { data: recentPlaylists = [] } = useQuery({
    queryKey: ['recent-playlists', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const playlists = await base44.entities.Playlist.filter({ user_email: user.email });
      return playlists.slice(0, 6);
    },
    enabled: !!user
  });

  // Fetch play history for stats
  const { data: playHistory = [] } = useQuery({
    queryKey: ['play-history', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.PlayHistory.filter({ user_email: user.email });
    },
    enabled: !!user
  });

  // Calculate stats
  const stats = useMemo(() => {
    const totalListens = playHistory.length;
    const completedListens = playHistory.filter(ph => ph.completed).length;
    return {
      totalListens,
      completedListens,
      playlistCount: recentPlaylists.length
    };
  }, [playHistory, recentPlaylists]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(createPageUrl('Library') + '?search=' + encodeURIComponent(searchQuery));
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--accent))]/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[hsl(var(--accent))]/5 via-transparent to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto">

            <div className="flex justify-center mb-6">
              <Badge className="inline-flex items-center" style={{ backgroundColor: 'hsl(var(--accent) / 0.15)', color: 'hsl(var(--text-heading))', borderColor: 'hsl(var(--accent) / 0.3)' }}>
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
            <p className="text-lg mb-8 max-w-2xl mx-auto leading-relaxed" style={{ color: 'hsl(var(--text-body))' }}>
              A sacred audio platform for spiritual and intentional listening.
            </p>
            
            {!user && (
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  onClick={() => base44.auth.redirectToLogin(window.location.href)}
                  className="px-8 py-6 text-base"
                  style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                  <Heart className="w-4 h-4 mr-2" />
                  Begin Your Journey
                </Button>
                <Link to={createPageUrl('Library')}>
                  <Button variant="outline" className="px-8 py-6 text-base" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
                    Explore Library
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Search Section */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'hsl(var(--text-muted))' }} />
                  <Input
                    type="text"
                    placeholder="Search tracks, themes, or intentions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))' }}
                  />
                </div>
                <Button type="submit" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                  Search
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Dashboard for logged-in users */}
      {user && (
        <section className="max-w-7xl mx-auto px-4 pb-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl font-light mb-6" style={{ color: 'hsl(var(--text-heading))', fontFamily: 'var(--font-heading)', letterSpacing: '0.025em' }}>
              Your Dashboard
            </h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--accent) / 0.2)' }}>
                      <Music className="w-6 h-6" style={{ color: 'hsl(var(--accent))' }} />
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>Total Listens</p>
                      <p className="text-2xl font-light" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                        {stats.totalListens}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--accent) / 0.2)' }}>
                      <Clock className="w-6 h-6" style={{ color: 'hsl(var(--accent))' }} />
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>Completed Sessions</p>
                      <p className="text-2xl font-light" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                        {stats.completedListens}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--accent) / 0.2)' }}>
                      <List className="w-6 h-6" style={{ color: 'hsl(var(--accent))' }} />
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>Your Playlists</p>
                      <p className="text-2xl font-light" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                        {stats.playlistCount}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Playlists */}
            <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                    Recent Playlists
                  </CardTitle>
                  <Link to={createPageUrl('Playlists')}>
                    <Button variant="ghost" size="sm" style={{ color: 'hsl(var(--accent))' }}>
                      View All <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {recentPlaylists.length === 0 ? (
                  <div className="text-center py-8">
                    <List className="w-12 h-12 mx-auto mb-3 opacity-40" style={{ color: 'hsl(var(--text-muted))' }} />
                    <p style={{ color: 'hsl(var(--text-muted))' }}>No playlists yet</p>
                    <Link to={createPageUrl('Playlists')}>
                      <Button variant="outline" size="sm" className="mt-4">
                        Create Your First Playlist
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentPlaylists.map((playlist) => (
                      <Link key={playlist.id} to={createPageUrl('Playlists') + '?id=' + playlist.id}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer" style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              {playlist.cover_image_url ? (
                                <img src={playlist.cover_image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                              ) : (
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                                  <Music className="w-6 h-6" style={{ color: 'hsl(var(--text-muted))' }} />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>{playlist.name}</p>
                                <p className="text-sm truncate" style={{ color: 'hsl(var(--text-muted))' }}>
                                  {playlist.description || 'No description'}
                                </p>
                              </div>
                              <Play className="w-5 h-5 flex-shrink-0" style={{ color: 'hsl(var(--accent))' }} />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Suggested Artists - Placeholder */}
            <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <CardHeader>
                <CardTitle style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                  Suggested Artists
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-40" style={{ color: 'hsl(var(--text-muted))' }} />
                  <p style={{ color: 'hsl(var(--text-muted))' }}>Artist suggestions coming soon</p>
                  <p className="text-sm mt-2" style={{ color: 'hsl(var(--text-subtle))' }}>
                    We'll recommend artists based on your listening preferences
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>
      )}

      {/* CTA for non-logged in users */}
      {!user && (
        <section className="max-w-4xl mx-auto px-4 pb-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card style={{ backgroundColor: 'hsl(var(--accent) / 0.1)', borderColor: 'hsl(var(--accent) / 0.3)' }}>
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-light mb-3" style={{ color: 'hsl(var(--text-heading))', fontFamily: 'var(--font-heading)' }}>
                  Ready to begin your healing journey?
                </h3>
                <p className="mb-6" style={{ color: 'hsl(var(--text-body))' }}>
                  Sign in to access your personalized dashboard and start creating playlists
                </p>
                <Button
                  onClick={() => base44.auth.redirectToLogin(window.location.href)}
                  style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Get Started
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </section>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        currentTier={userTier}
      />
    </div>
  );
}
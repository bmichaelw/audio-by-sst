import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Users, Music, Play, Calendar } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

export default function ArtistAnalytics() {
  const [user, setUser] = useState(null);
  const [dateRange, setDateRange] = useState('30'); // days

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  // Fetch artist's tracks
  const { data: tracks = [], isLoading: tracksLoading } = useQuery({
    queryKey: ['artist-tracks', user?.email],
    queryFn: async () => {
      const allTracks = await base44.entities.Track.filter({ created_by: user.email });
      return allTracks.filter(t => !t.is_archived);
    },
    enabled: !!user?.email,
  });

  // Fetch play history for artist's tracks
  const { data: playHistory = [], isLoading: playsLoading } = useQuery({
    queryKey: ['artist-plays', user?.email],
    queryFn: async () => {
      const allPlays = await base44.entities.PlayHistory.list('-played_at');
      const trackIds = tracks.map(t => t.id);
      return allPlays.filter(play => trackIds.includes(play.track_id));
    },
    enabled: !!user?.email && tracks.length > 0,
  });

  // Fetch subscribers (users who have subscribed to this artist)
  const { data: subscribers = [], isLoading: subsLoading } = useQuery({
    queryKey: ['artist-subscribers', user?.email],
    queryFn: async () => {
      const allUsers = await base44.entities.User.list();
      return allUsers.filter(u => u.subscribed_artists?.includes(user.email));
    },
    enabled: !!user?.email,
  });

  // Calculate date range
  const startDate = useMemo(() => {
    return startOfDay(subDays(new Date(), parseInt(dateRange)));
  }, [dateRange]);

  const endDate = useMemo(() => {
    return endOfDay(new Date());
  }, []);

  // Filter data by date range
  const filteredPlays = useMemo(() => {
    return playHistory.filter(play => {
      const playDate = new Date(play.played_at || play.created_date);
      return isAfter(playDate, startDate) && isBefore(playDate, endDate);
    });
  }, [playHistory, startDate, endDate]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalPlays = filteredPlays.length;
    const uniqueListeners = new Set(filteredPlays.map(p => p.user_email)).size;
    const completedPlays = filteredPlays.filter(p => p.completed).length;
    const completionRate = totalPlays > 0 ? ((completedPlays / totalPlays) * 100).toFixed(1) : 0;

    return {
      totalPlays,
      uniqueListeners,
      completionRate,
      totalTracks: tracks.length,
      totalSubscribers: subscribers.length,
    };
  }, [filteredPlays, tracks, subscribers]);

  // Plays over time (daily)
  const playsOverTime = useMemo(() => {
    const days = parseInt(dateRange);
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'MMM dd');
      const plays = filteredPlays.filter(play => {
        const playDate = new Date(play.played_at || play.created_date);
        return format(playDate, 'MMM dd') === dateStr;
      });
      
      data.push({
        date: dateStr,
        plays: plays.length,
        uniqueListeners: new Set(plays.map(p => p.user_email)).size,
      });
    }
    
    return data;
  }, [filteredPlays, dateRange]);

  // Popular tracks
  const popularTracks = useMemo(() => {
    const trackPlayCounts = {};
    
    filteredPlays.forEach(play => {
      if (!trackPlayCounts[play.track_id]) {
        trackPlayCounts[play.track_id] = {
          count: 0,
          completed: 0,
        };
      }
      trackPlayCounts[play.track_id].count++;
      if (play.completed) {
        trackPlayCounts[play.track_id].completed++;
      }
    });

    return tracks
      .map(track => ({
        ...track,
        playCount: trackPlayCounts[track.id]?.count || 0,
        completionRate: trackPlayCounts[track.id]?.count > 0
          ? ((trackPlayCounts[track.id].completed / trackPlayCounts[track.id].count) * 100).toFixed(1)
          : 0,
      }))
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 10);
  }, [tracks, filteredPlays]);

  // Track tier distribution
  const tierDistribution = useMemo(() => {
    const distribution = {};
    
    filteredPlays.forEach(play => {
      const track = tracks.find(t => t.id === play.track_id);
      if (track) {
        const tier = track.access_tier || 'free';
        distribution[tier] = (distribution[tier] || 0) + 1;
      }
    });

    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [tracks, filteredPlays]);

  const COLORS = {
    free: '#94a3b8',
    member: '#3b82f6',
    resonance_path: '#8b5cf6',
    collaborations: '#f59e0b',
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
      </div>
    );
  }

  if (!user.is_artist || !user.artist_approved) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <Card className="max-w-md w-full" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <CardContent className="p-8 text-center">
            <Music className="w-16 h-16 mx-auto mb-4 opacity-40" style={{ color: 'hsl(var(--text-muted))' }} />
            <h2 className="text-xl font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
              Artist Dashboard Only
            </h2>
            <p style={{ color: 'hsl(var(--text-muted))' }}>
              This page is only accessible to approved artists.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLoading = tracksLoading || playsLoading || subsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-light mb-2" style={{ color: 'hsl(var(--text-heading))', fontFamily: 'var(--font-heading)' }}>
              Artist Analytics
            </h1>
            <p style={{ color: 'hsl(var(--text-muted))' }}>
              Track your performance and audience engagement
            </p>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" style={{ color: 'hsl(var(--text-muted))' }} />
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>Total Plays</span>
                <Play className="w-4 h-4" style={{ color: 'hsl(var(--accent))' }} />
              </div>
              <div className="text-3xl font-light" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                {metrics.totalPlays.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>Unique Listeners</span>
                <Users className="w-4 h-4" style={{ color: 'hsl(var(--accent))' }} />
              </div>
              <div className="text-3xl font-light" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                {metrics.uniqueListeners.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>Completion Rate</span>
                <TrendingUp className="w-4 h-4" style={{ color: 'hsl(var(--accent))' }} />
              </div>
              <div className="text-3xl font-light" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                {metrics.completionRate}%
              </div>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>Subscribers</span>
                <Users className="w-4 h-4" style={{ color: 'hsl(var(--accent))' }} />
              </div>
              <div className="text-3xl font-light" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                {metrics.totalSubscribers.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Plays Over Time */}
          <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <CardHeader>
              <CardTitle style={{ color: 'hsl(var(--foreground))', fontSize: '1.25rem' }}>
                Plays Over Time
              </CardTitle>
              <CardDescription style={{ color: 'hsl(var(--text-muted))' }}>
                Daily track plays and unique listeners
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={playsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--text-muted))" style={{ fontSize: '12px' }} />
                  <YAxis stroke="hsl(var(--text-muted))" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--surface))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Line type="monotone" dataKey="plays" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="uniqueListeners" stroke="hsl(var(--accent))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tier Distribution */}
          <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <CardHeader>
              <CardTitle style={{ color: 'hsl(var(--foreground))', fontSize: '1.25rem' }}>
                Plays by Tier
              </CardTitle>
              <CardDescription style={{ color: 'hsl(var(--text-muted))' }}>
                Distribution of plays across access tiers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={tierDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {tierDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--surface))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Popular Tracks */}
        <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <CardHeader>
            <CardTitle style={{ color: 'hsl(var(--foreground))', fontSize: '1.25rem' }}>
              Top Performing Tracks
            </CardTitle>
            <CardDescription style={{ color: 'hsl(var(--text-muted))' }}>
              Your most played tracks in the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {popularTracks.length === 0 ? (
              <div className="text-center py-8">
                <Music className="w-12 h-12 mx-auto mb-3 opacity-40" style={{ color: 'hsl(var(--text-muted))' }} />
                <p style={{ color: 'hsl(var(--text-muted))' }}>No plays in this period</p>
              </div>
            ) : (
              <div className="space-y-3">
                {popularTracks.map((track, index) => (
                  <div
                    key={track.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                    style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-2xl font-light w-8 text-center" style={{ color: 'hsl(var(--text-muted))' }}>
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <h4 className="font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                          {track.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {track.access_tier}
                          </Badge>
                          <span className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
                            {track.playCount} plays • {track.completionRate}% completion
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-light" style={{ color: 'hsl(var(--foreground))' }}>
                        {track.playCount}
                      </div>
                      <div className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>plays</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Music, TrendingUp, Users, Star, Calendar, Archive } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminStats({ tracks, subscriptions }) {
  const totalTracks = tracks.length;
  const featuredTracks = tracks.filter(t => t.is_featured).length;
  const archivedTracks = tracks.filter(t => t.is_archived).length;
  const activeTracks = tracks.filter(t => !t.is_archived).length;
  const totalPlays = tracks.reduce((sum, t) => sum + (t.play_count || 0), 0);
  const activeSubscribers = subscriptions.length;

  // Get newest tracks (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const newestUploads = tracks.filter(t => new Date(t.created_date) > sevenDaysAgo).length;

  const stats = [
    {
      icon: Music,
      label: 'Total Tracks',
      value: totalTracks,
      color: 'amber',
      subValue: `${activeTracks} active`,
    },
    {
      icon: Star,
      label: 'Featured Tracks',
      value: featuredTracks,
      color: 'yellow',
    },
    {
      icon: Calendar,
      label: 'New This Week',
      value: newestUploads,
      color: 'green',
    },
    {
      icon: TrendingUp,
      label: 'Total Plays',
      value: totalPlays.toLocaleString(),
      color: 'blue',
    },
    {
      icon: Users,
      label: 'Active Subscribers',
      value: activeSubscribers,
      color: 'purple',
    },
    {
      icon: Archive,
      label: 'Archived',
      value: archivedTracks,
      color: 'stone',
    },
  ];

  const colorClasses = {
    amber: { bg: 'hsl(var(--accent) / 0.15)', text: 'hsl(var(--accent))' },
    yellow: { bg: 'hsl(40 80% 90%)', text: 'hsl(40 80% 45%)' },
    green: { bg: 'hsl(140 50% 90%)', text: 'hsl(140 50% 40%)' },
    blue: { bg: 'hsl(220 60% 90%)', text: 'hsl(220 60% 45%)' },
    purple: { bg: 'hsl(280 50% 90%)', text: 'hsl(var(--primary))' },
    stone: { bg: 'hsl(var(--muted))', text: 'hsl(var(--text-muted))' },
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col gap-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: colorClasses[stat.color].bg }}>
                    <Icon className="w-5 h-5" style={{ color: colorClasses[stat.color].text }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>{stat.label}</p>
                    <p className="text-xl font-medium" style={{ color: 'hsl(var(--foreground))' }}>{stat.value}</p>
                    {stat.subValue && (
                      <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--text-subtle))' }}>{stat.subValue}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
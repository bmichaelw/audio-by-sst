import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AdminGuard from '@/components/admin/AdminGuard.jsx';
import TrackUploadForm from '@/components/admin/TrackUploadForm.jsx';
import AdminStats from '@/components/admin/AdminStats.jsx';
import AdminTrackTable from '@/components/admin/AdminTrackTable.jsx';
import LiveSessionManager from '@/components/admin/LiveSessionManager.jsx';
import { StatsSkeleton } from '@/components/LoadingSkeleton.jsx';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  Music,
  Users,
  TrendingUp,
  Tag,
  Loader2,
  ArrowLeft,
  Trash2,
  Radio,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Admin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showTrackForm, setShowTrackForm] = useState(false);
  const [editingTrack, setEditingTrack] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [newTheme, setNewTheme] = useState('');
  const [isAddingTheme, setIsAddingTheme] = useState(false);

  // Fetch data
  const { data: tracks = [], isLoading: tracksLoading } = useQuery({
    queryKey: ['admin-tracks'],
    queryFn: () => base44.entities.Track.list('-created_date'),
  });

  const { data: themes = [], isLoading: themesLoading } = useQuery({
    queryKey: ['themes'],
    queryFn: () => base44.entities.Theme.list('sort_order'),
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => base44.entities.UserSubscription.filter({ is_active: true }),
  });

  const themeNames = themes.map((t) => t.name);

  // Stats
  const totalTracks = tracks.length;
  const totalPlays = tracks.reduce((sum, t) => sum + (t.play_count || 0), 0);
  const activeSubscribers = subscriptions.length;

  // Handlers
  const handleTrackSuccess = () => {
    setShowTrackForm(false);
    setEditingTrack(null);
    queryClient.invalidateQueries({ queryKey: ['admin-tracks'] });
  };

  const handleEditTrack = (track) => {
    setEditingTrack(track);
    setShowTrackForm(true);
  };

  const handleDeleteTrack = async () => {
    if (!deleteConfirmId) return;
    try {
      await base44.entities.Track.delete(deleteConfirmId);
      
      // Log audit action
      const user = await base44.auth.me();
      await base44.entities.AuditLog.create({
        admin_email: user.email,
        action: 'delete_track',
        target_type: 'Track',
        target_id: deleteConfirmId,
      });
      
      toast.success('Track deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-tracks'] });
    } catch {
      toast.error('Failed to delete track');
    }
    setDeleteConfirmId(null);
  };

  const handleAddTheme = async () => {
    if (!newTheme.trim()) return;
    setIsAddingTheme(true);
    try {
      await base44.entities.Theme.create({
        name: newTheme.trim(),
        sort_order: themes.length,
      });
      toast.success('Theme added');
      setNewTheme('');
      queryClient.invalidateQueries({ queryKey: ['themes'] });
    } catch {
      toast.error('Failed to add theme');
    }
    setIsAddingTheme(false);
  };

  const handleDeleteTheme = async (themeId) => {
    try {
      await base44.entities.Theme.delete(themeId);
      toast.success('Theme deleted');
      queryClient.invalidateQueries({ queryKey: ['themes'] });
    } catch {
      toast.error('Failed to delete theme');
    }
  };

  return (
    <AdminGuard>
      <div className="min-h-screen pb-12" style={{ backgroundColor: 'hsl(var(--background))' }}>
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-50/50 to-transparent border-b" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light" style={{ color: 'hsl(var(--text-heading))', fontFamily: 'var(--font-heading)', letterSpacing: '0.03em' }}>Admin Portal</h1>
              <div className="h-px w-24 mt-3 mb-2" style={{ background: 'linear-gradient(to right, hsl(var(--accent)), transparent)' }} />
              <p className="mt-1" style={{ color: 'hsl(var(--text-muted))' }}>Manage your sacred sound library</p>
            </div>
            <Button
              onClick={() => {
                setEditingTrack(null);
                setShowTrackForm(true);
              }}
              style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Track
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="mb-8">
          {tracksLoading ? (
            <StatsSkeleton />
          ) : (
            <AdminStats tracks={tracks} subscriptions={subscriptions} />
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tracks" className="space-y-6">
          <TabsList style={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))' }}>
            <TabsTrigger value="tracks">
              <Music className="w-4 h-4 mr-2" />
              Tracks
            </TabsTrigger>
            <TabsTrigger value="themes">
              <Tag className="w-4 h-4 mr-2" />
              Themes
            </TabsTrigger>
            <TabsTrigger value="live">
              <Radio className="w-4 h-4 mr-2" />
              Live Sessions
            </TabsTrigger>
          </TabsList>

          {/* Tracks Tab */}
          <TabsContent value="tracks">
            {showTrackForm ? (
              <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                <CardHeader>
                  <CardTitle style={{ color: 'hsl(var(--foreground))' }}>
                    {editingTrack ? 'Edit Track' : 'Add New Track'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TrackUploadForm
                    initialData={editingTrack}
                    onSuccess={handleTrackSuccess}
                    onCancel={() => {
                      setShowTrackForm(false);
                      setEditingTrack(null);
                    }}
                    themes={themeNames}
                  />
                </CardContent>
              </Card>
            ) : (
              <AdminTrackTable
                tracks={tracks}
                onEdit={handleEditTrack}
                onDelete={(id) => setDeleteConfirmId(id)}
                onRefresh={() => queryClient.invalidateQueries({ queryKey: ['admin-tracks'] })}
              />
            )}
          </TabsContent>

          {/* Live Sessions Tab */}
          <TabsContent value="live">
            <LiveSessionManager />
          </TabsContent>

          {/* Themes Tab */}
          <TabsContent value="themes">
            <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <CardHeader>
                <CardTitle style={{ color: 'hsl(var(--foreground))' }}>Manage Themes</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Add Theme */}
                <div className="flex gap-2 mb-6">
                  <Input
                    value={newTheme}
                    onChange={(e) => setNewTheme(e.target.value)}
                    placeholder="New theme name"
                    style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTheme()}
                  />
                  <Button
                    onClick={handleAddTheme}
                    disabled={isAddingTheme || !newTheme.trim()}
                    style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                  >
                    {isAddingTheme ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </Button>
                </div>

                {/* Themes List */}
                <div className="space-y-2">
                  {themesLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: 'hsl(var(--primary))' }} />
                    </div>
                  ) : themes.length === 0 ? (
                    <p className="text-center py-8" style={{ color: 'hsl(var(--text-muted))' }}>No themes yet. Add one above.</p>
                  ) : (
                    themes.map((theme) => (
                      <div
                        key={theme.id}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{ backgroundColor: 'hsl(var(--muted))' }}
                      >
                        <span style={{ color: 'hsl(var(--foreground))' }}>{theme.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTheme(theme.id)}
                          className="h-8 w-8 hover:text-red-600"
                          style={{ color: 'hsl(var(--text-muted))' }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'hsl(var(--foreground))' }}>Delete Track</DialogTitle>
            <DialogDescription style={{ color: 'hsl(var(--text-muted))' }}>
              Are you sure you want to delete this track? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} style={{ borderColor: 'hsl(var(--border))' }}>
              Cancel
            </Button>
            <Button onClick={handleDeleteTrack} className="bg-red-600 hover:bg-red-500 text-white">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </AdminGuard>
  );
}
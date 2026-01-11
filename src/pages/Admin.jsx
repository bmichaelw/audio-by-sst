import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AdminGuard from '@/components/admin/AdminGuard.jsx';
import TrackUploadForm from '@/components/admin/TrackUploadForm.jsx';
import AdminStats from '@/components/admin/AdminStats.jsx';
import AdminTrackTable from '@/components/admin/AdminTrackTable.jsx';
import PhaseManager from '@/components/admin/PhaseManager.jsx';
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
  TrendingUp as PathIcon,
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
      <div className="min-h-screen bg-stone-950 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-b from-stone-900 to-stone-950 border-b border-stone-800/50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light text-white">Admin Portal</h1>
              <p className="text-stone-400 mt-1">Manage your sound library</p>
            </div>
            <Button
              onClick={() => {
                setEditingTrack(null);
                setShowTrackForm(true);
              }}
              className="bg-amber-600 hover:bg-amber-500"
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
          <TabsList className="bg-stone-900/50 border border-stone-800">
            <TabsTrigger value="tracks" className="data-[state=active]:bg-stone-800">
              <Music className="w-4 h-4 mr-2" />
              Tracks
            </TabsTrigger>
            <TabsTrigger value="phases" className="data-[state=active]:bg-stone-800">
              <PathIcon className="w-4 h-4 mr-2" />
              ResonancePath
            </TabsTrigger>
            <TabsTrigger value="themes" className="data-[state=active]:bg-stone-800">
              <Tag className="w-4 h-4 mr-2" />
              Themes
            </TabsTrigger>
          </TabsList>

          {/* Tracks Tab */}
          <TabsContent value="tracks">
            {showTrackForm ? (
              <Card className="bg-stone-900/50 border-stone-800">
                <CardHeader>
                  <CardTitle className="text-white">
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

          {/* ResonancePath Tab */}
          <TabsContent value="phases">
            <PhaseManager />
          </TabsContent>

          {/* Themes Tab */}
          <TabsContent value="themes">
            <Card className="bg-stone-900/50 border-stone-800">
              <CardHeader>
                <CardTitle className="text-white">Manage Themes</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Add Theme */}
                <div className="flex gap-2 mb-6">
                  <Input
                    value={newTheme}
                    onChange={(e) => setNewTheme(e.target.value)}
                    placeholder="New theme name"
                    className="bg-stone-800/50 border-stone-700 text-white"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTheme()}
                  />
                  <Button
                    onClick={handleAddTheme}
                    disabled={isAddingTheme || !newTheme.trim()}
                    className="bg-amber-600 hover:bg-amber-500"
                  >
                    {isAddingTheme ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </Button>
                </div>

                {/* Themes List */}
                <div className="space-y-2">
                  {themesLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-6 h-6 text-amber-500 animate-spin mx-auto" />
                    </div>
                  ) : themes.length === 0 ? (
                    <p className="text-stone-400 text-center py-8">No themes yet. Add one above.</p>
                  ) : (
                    themes.map((theme) => (
                      <div
                        key={theme.id}
                        className="flex items-center justify-between p-3 bg-stone-800/30 rounded-lg"
                      >
                        <span className="text-white">{theme.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTheme(theme.id)}
                          className="text-stone-400 hover:text-red-400 h-8 w-8"
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
        <DialogContent className="bg-stone-900 border-stone-800">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Track</DialogTitle>
            <DialogDescription className="text-stone-400">
              Are you sure you want to delete this track? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="border-stone-700">
              Cancel
            </Button>
            <Button onClick={handleDeleteTrack} className="bg-red-600 hover:bg-red-500">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </AdminGuard>
  );
}
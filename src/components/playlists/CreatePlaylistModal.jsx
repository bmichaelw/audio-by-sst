import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CreatePlaylistModal({ isOpen, onClose, user }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: false,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Playlist.create({
      ...data,
      user_email: user.email,
      likes_count: 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-playlists'] });
      toast.success('Playlist created!');
      onClose();
      setFormData({ name: '', description: '', is_public: false });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter a playlist name');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-stone-900 border-stone-800">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Playlist</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-stone-300">Playlist Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="My Favorite Tracks"
              className="bg-stone-800 border-stone-700 mt-1"
            />
          </div>

          <div>
            <Label className="text-stone-300">Description (optional)</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="A collection of calming sounds for..."
              className="bg-stone-800 border-stone-700 mt-1"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <Label className="text-stone-300">Make Public</Label>
              <p className="text-stone-500 text-sm">Share with the community</p>
            </div>
            <Switch
              checked={formData.is_public}
              onCheckedChange={(val) => setFormData(prev => ({ ...prev, is_public: val }))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="border-stone-700">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-amber-600 hover:bg-amber-500"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
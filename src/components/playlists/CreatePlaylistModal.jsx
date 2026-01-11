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
      <DialogContent style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'hsl(var(--foreground))' }}>Create New Playlist</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label style={{ color: 'hsl(var(--text-body))' }}>Playlist Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="My Favorite Tracks"
              className="mt-1"
              style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))' }}
            />
          </div>

          <div>
            <Label style={{ color: 'hsl(var(--text-body))' }}>Description (optional)</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="A collection of calming sounds for..."
              className="mt-1"
              style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))' }}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <Label style={{ color: 'hsl(var(--text-body))' }}>Make Public</Label>
              <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>Share with the community</p>
            </div>
            <Switch
              checked={formData.is_public}
              onCheckedChange={(val) => setFormData(prev => ({ ...prev, is_public: val }))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} style={{ borderColor: 'hsl(var(--border))' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
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
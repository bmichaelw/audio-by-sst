import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CreatePostModal({ isOpen, onClose, user }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DiscussionPost.create({
      ...data,
      author_email: user.email,
      upvotes: 0,
      view_count: 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussion-posts'] });
      toast.success('Post created!');
      onClose();
      setFormData({ title: '', content: '', category: 'general' });
    },
    onError: () => {
      toast.error('Failed to create post');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'hsl(var(--foreground))' }}>Create New Post</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label style={{ color: 'hsl(var(--text-body))' }}>Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="What's on your mind?"
              className="mt-1"
              style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))' }}
            />
          </div>

          <div>
            <Label style={{ color: 'hsl(var(--text-body))' }}>Category</Label>
            <Select value={formData.category} onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}>
              <SelectTrigger className="mt-1" style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="experiences">Experiences</SelectItem>
                <SelectItem value="questions">Questions</SelectItem>
                <SelectItem value="tips">Tips & Advice</SelectItem>
                <SelectItem value="resonance_path">ResonancePath</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label style={{ color: 'hsl(var(--text-body))' }}>Content</Label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Share your thoughts, experiences, or questions..."
              className="mt-1 min-h-[150px]"
              style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))' }}
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
                  Posting...
                </>
              ) : (
                'Create Post'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Radio, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function LiveSessionManager() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_time: '',
    duration_minutes: 60,
    stream_url: '',
    cover_image_url: '',
    access_tier: 'member',
    one_time_price: 0,
    max_attendees: null,
    is_live: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['admin-live-sessions'],
    queryFn: () => base44.entities.LiveSession.list('-scheduled_time'),
  });

  const handleOpenForm = (session = null) => {
    if (session) {
      setEditingSession(session);
      setFormData({
        title: session.title,
        description: session.description || '',
        scheduled_time: session.scheduled_time.substring(0, 16),
        duration_minutes: session.duration_minutes,
        stream_url: session.stream_url || '',
        cover_image_url: session.cover_image_url || '',
        access_tier: session.access_tier,
        one_time_price: session.one_time_price || 0,
        max_attendees: session.max_attendees || null,
        is_live: session.is_live || false,
      });
    } else {
      setEditingSession(null);
      setFormData({
        title: '',
        description: '',
        scheduled_time: '',
        duration_minutes: 60,
        stream_url: '',
        cover_image_url: '',
        access_tier: 'member',
        one_time_price: 0,
        max_attendees: null,
        is_live: false,
      });
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.scheduled_time) {
      toast.error('Title and scheduled time are required');
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        ...formData,
        scheduled_time: new Date(formData.scheduled_time).toISOString(),
        current_attendees: editingSession?.current_attendees || 0,
        is_archived: false,
      };

      if (editingSession) {
        await base44.entities.LiveSession.update(editingSession.id, data);
        toast.success('Session updated');
      } else {
        await base44.entities.LiveSession.create(data);
        toast.success('Session created');
      }

      queryClient.invalidateQueries({ queryKey: ['admin-live-sessions'] });
      setShowForm(false);
    } catch (error) {
      toast.error('Failed to save session');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (sessionId) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      await base44.entities.LiveSession.delete(sessionId);
      toast.success('Session deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-live-sessions'] });
    } catch {
      toast.error('Failed to delete session');
    }
  };

  const toggleLive = async (session) => {
    try {
      await base44.entities.LiveSession.update(session.id, {
        is_live: !session.is_live,
      });
      toast.success(session.is_live ? 'Session ended' : 'Session is now live!');
      queryClient.invalidateQueries({ queryKey: ['admin-live-sessions'] });
    } catch {
      toast.error('Failed to update session');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
          Live Sessions
        </h2>
        <Button onClick={() => handleOpenForm()} style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Session
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
        </div>
      ) : sessions.length === 0 ? (
        <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: 'hsl(var(--text-subtle))' }} />
            <p style={{ color: 'hsl(var(--text-muted))' }}>No live sessions scheduled yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.id} style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                        {session.title}
                      </h3>
                      {session.is_live && (
                        <Badge className="bg-red-600 text-white animate-pulse">
                          <Radio className="w-3 h-3 mr-1" />
                          LIVE
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm mb-3" style={{ color: 'hsl(var(--text-muted))' }}>
                      {format(new Date(session.scheduled_time), 'EEEE, MMM d, yyyy · h:mm a')} · {session.duration_minutes} min
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="outline">{session.access_tier.replace('_', ' ')}</Badge>
                      <Badge variant="outline">{session.current_attendees || 0} registered</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={session.is_live ? 'destructive' : 'default'}
                      onClick={() => toggleLive(session)}
                    >
                      {session.is_live ? 'End Stream' : 'Go Live'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleOpenForm(session)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(session.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl" style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'hsl(var(--foreground))' }}>
              {editingSession ? 'Edit Session' : 'Create New Session'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Session title"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Session description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Scheduled Time</Label>
                <Input
                  type="datetime-local"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                />
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label>Stream URL (YouTube embed, etc.)</Label>
              <Input
                value={formData.stream_url}
                onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
                placeholder="https://youtube.com/embed/..."
              />
            </div>
            <div>
              <Label>Cover Image URL</Label>
              <Input
                value={formData.cover_image_url}
                onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Access Tier</Label>
                <Select value={formData.access_tier} onValueChange={(val) => setFormData({ ...formData, access_tier: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member+</SelectItem>
                    <SelectItem value="resonance_path">ResonancePath+</SelectItem>
                    <SelectItem value="collaborations">Collaborations</SelectItem>
                    <SelectItem value="one_time">One-Time Purchase</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.access_tier === 'one_time' && (
                <div>
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    value={formData.one_time_price}
                    onChange={(e) => setFormData({ ...formData, one_time_price: parseFloat(e.target.value) })}
                  />
                </div>
              )}
              <div>
                <Label>Max Attendees (optional)</Label>
                <Input
                  type="number"
                  value={formData.max_attendees || ''}
                  onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Unlimited"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
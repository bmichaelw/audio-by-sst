import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import PhaseTrackEditor from '@/components/admin/PhaseTrackEditor.jsx';
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
import {
  DragDropContext,
  Droppable,
  Draggable,
} from '@hello-pangea/dnd';
import {
  Plus,
  Trash2,
  Edit,
  GripVertical,
  Music,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function PhaseManager() {
  const queryClient = useQueryClient();
  const [editingPhase, setEditingPhase] = useState(null);
  const [showPhaseDialog, setShowPhaseDialog] = useState(false);
  const [showTrackDialog, setShowTrackDialog] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [phaseForm, setPhaseForm] = useState({ name: '', description: '', is_published: false });
  const [editingPhaseTrack, setEditingPhaseTrack] = useState(null);
  const [showDeletePhaseDialog, setShowDeletePhaseDialog] = useState(null);

  // Fetch data
  const { data: phases = [] } = useQuery({
    queryKey: ['phases'],
    queryFn: () => base44.entities.Phase.list('sort_order'),
  });

  const { data: phaseTracks = [] } = useQuery({
    queryKey: ['phase-tracks'],
    queryFn: () => base44.entities.PhaseTrack.list('sort_order'),
  });

  const { data: allTracks = [] } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => base44.entities.Track.list('-created_date'),
  });

  // Create/Update Phase
  const savePhase = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      const result = editingPhase
        ? await base44.entities.Phase.update(editingPhase.id, data)
        : await base44.entities.Phase.create({ ...data, sort_order: phases.length });

      // Log audit action
      await base44.entities.AuditLog.create({
        admin_email: user.email,
        action: editingPhase ? 'update_phase' : 'create_phase',
        target_type: 'Phase',
        target_id: result.id || editingPhase?.id,
        details: data,
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases'] });
      setShowPhaseDialog(false);
      setEditingPhase(null);
      setPhaseForm({ name: '', description: '', is_published: false });
      toast.success(editingPhase ? 'Phase updated' : 'Phase created');
    },
  });

  // Delete Phase
  const deletePhase = useMutation({
    mutationFn: async (phaseId) => {
      // Delete all phase tracks first
      const tracksToDelete = phaseTracks.filter(pt => pt.phase_id === phaseId);
      await Promise.all(tracksToDelete.map(pt => base44.entities.PhaseTrack.delete(pt.id)));
      await base44.entities.Phase.delete(phaseId);

      // Log audit action
      const user = await base44.auth.me();
      await base44.entities.AuditLog.create({
        admin_email: user.email,
        action: 'delete_phase',
        target_type: 'Phase',
        target_id: phaseId,
        details: { tracks_deleted: tracksToDelete.length },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases'] });
      queryClient.invalidateQueries({ queryKey: ['phase-tracks'] });
      setShowDeletePhaseDialog(null);
      toast.success('Phase deleted');
    },
  });

  // Toggle Published
  const togglePublished = useMutation({
    mutationFn: ({ phaseId, isPublished }) =>
      base44.entities.Phase.update(phaseId, { is_published: !isPublished }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases'] });
    },
  });

  // Add Track to Phase
  const addTrackToPhase = useMutation({
    mutationFn: async ({ phaseId, trackId }) => {
      const existingTracks = phaseTracks.filter(pt => pt.phase_id === phaseId);
      const sortOrder = existingTracks.length;
      const result = await base44.entities.PhaseTrack.create({
        phase_id: phaseId,
        track_id: trackId,
        sort_order: sortOrder,
      });

      // Log audit action
      const user = await base44.auth.me();
      await base44.entities.AuditLog.create({
        admin_email: user.email,
        action: 'add_track_to_phase',
        target_type: 'PhaseTrack',
        target_id: result.id,
        details: { phase_id: phaseId, track_id: trackId },
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-tracks'] });
      toast.success('Track added to phase');
    },
  });

  // Remove Track from Phase
  const removeTrackFromPhase = useMutation({
    mutationFn: (phaseTrackId) => base44.entities.PhaseTrack.delete(phaseTrackId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-tracks'] });
      toast.success('Track removed from phase');
    },
  });

  // Reorder tracks within phase
  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const phaseId = result.source.droppableId;
    const items = phaseTracks
      .filter(pt => pt.phase_id === phaseId)
      .sort((a, b) => a.sort_order - b.sort_order);

    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sort orders
    try {
      await Promise.all(
        items.map((item, index) =>
          base44.entities.PhaseTrack.update(item.id, { sort_order: index })
        )
      );
      queryClient.invalidateQueries({ queryKey: ['phase-tracks'] });
      toast.success('Order updated');
    } catch {
      toast.error('Failed to reorder');
    }
  };

  const handleEditPhase = (phase) => {
    setEditingPhase(phase);
    setPhaseForm({
      name: phase.name,
      description: phase.description || '',
      is_published: phase.is_published || false,
    });
    setShowPhaseDialog(true);
  };

  const handleSavePhase = () => {
    if (!phaseForm.name.trim()) {
      toast.error('Phase name is required');
      return;
    }
    savePhase.mutate(phaseForm);
  };

  const availableTracksForPhase = (phaseId) => {
    const assignedTrackIds = phaseTracks
      .filter(pt => pt.phase_id === phaseId)
      .map(pt => pt.track_id);
    return allTracks.filter(t => !assignedTrackIds.includes(t.id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light" style={{ color: 'hsl(var(--text-heading))', fontFamily: 'var(--font-heading))' }}>ResonancePath Phases</h2>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--text-muted))' }}>
            Create and manage guided program phases
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingPhase(null);
            setPhaseForm({ name: '', description: '', is_published: false });
            setShowPhaseDialog(true);
          }}
          style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Phase
        </Button>
      </div>

      {/* Phases List */}
      {phases.length === 0 ? (
        <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <CardContent className="pt-6 text-center py-12">
            <Music className="w-16 h-16 mx-auto mb-4" style={{ color: 'hsl(var(--text-subtle))' }} />
            <p style={{ color: 'hsl(var(--text-muted))' }}>No phases yet. Create your first phase to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {phases.map((phase) => {
            const phaseTracksList = phaseTracks
              .filter(pt => pt.phase_id === phase.id)
              .sort((a, b) => a.sort_order - b.sort_order);

            return (
              <Card key={phase.id} style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg" style={{ color: 'hsl(var(--foreground))' }}>{phase.name}</CardTitle>
                        <Badge variant={phase.is_published ? "default" : "outline"} className="text-xs">
                          {phase.is_published ? (
                            <><Eye className="w-3 h-3 mr-1" />Published</>
                          ) : (
                            <><EyeOff className="w-3 h-3 mr-1" />Draft</>
                          )}
                        </Badge>
                      </div>
                      {phase.description && (
                        <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>{phase.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={phase.is_published}
                        onCheckedChange={() =>
                          togglePublished.mutate({ phaseId: phase.id, isPublished: phase.is_published })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditPhase(phase)}
                        style={{ color: 'hsl(var(--text-muted))' }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowDeletePhaseDialog(phase.id)}
                        className="hover:text-red-600"
                        style={{ color: 'hsl(var(--text-muted))' }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>
                      {phaseTracksList.length} session{phaseTracksList.length !== 1 ? 's' : ''}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPhase(phase.id);
                        setShowTrackDialog(true);
                      }}
                      style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Track
                    </Button>
                  </div>

                  {/* Tracks in Phase */}
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId={phase.id}>
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-2"
                        >
                          {phaseTracksList.map((phaseTrack, index) => {
                            const track = allTracks.find(t => t.id === phaseTrack.track_id);
                            if (!track) return null;

                            return (
                              <Draggable
                                key={phaseTrack.id}
                                draggableId={phaseTrack.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={cn(
                                      "flex items-center gap-3 p-3 rounded-lg border",
                                      snapshot.isDragging && "shadow-lg"
                                    )}
                                    style={{ backgroundColor: 'hsl(var(--muted))', borderColor: 'hsl(var(--border))' }}
                                  >
                                    <div {...provided.dragHandleProps} className="cursor-grab">
                                      <GripVertical className="w-4 h-4" style={{ color: 'hsl(var(--text-subtle))' }} />
                                    </div>
                                    <span className="text-sm font-mono w-6" style={{ color: 'hsl(var(--text-muted))' }}>
                                      {index + 1}
                                    </span>
                                    {track.cover_image_url && (
                                      <img
                                        src={track.cover_image_url}
                                        alt={track.title}
                                        className="w-10 h-10 rounded object-cover"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>
                                        {phaseTrack.session_title || track.title}
                                      </p>
                                      {phaseTrack.session_title && (
                                        <p className="text-xs truncate" style={{ color: 'hsl(var(--text-muted))' }}>
                                          Original: {track.title}
                                        </p>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setEditingPhaseTrack({ phaseTrack, track })}
                                      className="h-8 w-8"
                                      style={{ color: 'hsl(var(--text-muted))' }}
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeTrackFromPhase.mutate(phaseTrack.id)}
                                      className="h-8 w-8 hover:text-red-600"
                                      style={{ color: 'hsl(var(--text-muted))' }}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>

                  {phaseTracksList.length === 0 && (
                    <div className="text-center py-8 text-sm" style={{ color: 'hsl(var(--text-muted))' }}>
                      No tracks added yet
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Phase Dialog */}
      <Dialog open={showPhaseDialog} onOpenChange={setShowPhaseDialog}>
        <DialogContent style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'hsl(var(--foreground))' }}>
              {editingPhase ? 'Edit Phase' : 'Create Phase'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label style={{ color: 'hsl(var(--text-body))' }}>Phase Name</Label>
              <Input
                value={phaseForm.name}
                onChange={(e) => setPhaseForm({ ...phaseForm, name: e.target.value })}
                placeholder="e.g., Phase 1: Foundation"
                style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                className="mt-2"
              />
            </div>
            <div>
              <Label style={{ color: 'hsl(var(--text-body))' }}>Description</Label>
              <Textarea
                value={phaseForm.description}
                onChange={(e) => setPhaseForm({ ...phaseForm, description: e.target.value })}
                placeholder="Describe this phase..."
                style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                className="mt-2"
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={phaseForm.is_published}
                onCheckedChange={(checked) => setPhaseForm({ ...phaseForm, is_published: checked })}
              />
              <Label style={{ color: 'hsl(var(--text-body))' }}>Publish (visible to users)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPhaseDialog(false)}
              style={{ borderColor: 'hsl(var(--border))' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePhase}
              disabled={savePhase.isLoading}
              style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            >
              {savePhase.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Phase Track Editor */}
      {editingPhaseTrack && (
        <PhaseTrackEditor
          phaseTrack={editingPhaseTrack.phaseTrack}
          track={editingPhaseTrack.track}
          isOpen={!!editingPhaseTrack}
          onClose={() => setEditingPhaseTrack(null)}
          onUpdate={() => queryClient.invalidateQueries({ queryKey: ['phase-tracks'] })}
        />
      )}

      {/* Delete Phase Confirmation */}
      <Dialog open={!!showDeletePhaseDialog} onOpenChange={() => setShowDeletePhaseDialog(null)}>
        <DialogContent style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'hsl(var(--foreground))' }}>Delete Phase</DialogTitle>
          </DialogHeader>
          <p style={{ color: 'hsl(var(--text-muted))' }}>
            Are you sure you want to delete this phase? All tracks in this phase will be removed. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeletePhaseDialog(null)}
              style={{ borderColor: 'hsl(var(--border))' }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => deletePhase.mutate(showDeletePhaseDialog)}
              className="bg-red-600 hover:bg-red-500 text-white"
              disabled={deletePhase.isLoading}
            >
              {deletePhase.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Phase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Track Dialog */}
      <Dialog open={showTrackDialog} onOpenChange={setShowTrackDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'hsl(var(--foreground))' }}>Add Track to Phase</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {selectedPhase && availableTracksForPhase(selectedPhase).length === 0 ? (
              <p className="text-center py-8" style={{ color: 'hsl(var(--text-muted))' }}>
                All tracks have been added to this phase.
              </p>
            ) : (
              availableTracksForPhase(selectedPhase).map((track) => (
                <div
                  key={track.id}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:shadow-sm transition-all"
                  style={{ backgroundColor: 'hsl(var(--muted))', borderColor: 'hsl(var(--border))' }}
                  onClick={() => {
                    addTrackToPhase.mutate({ phaseId: selectedPhase, trackId: track.id });
                    setShowTrackDialog(false);
                  }}
                >
                  {track.cover_image_url && (
                    <img
                      src={track.cover_image_url}
                      alt={track.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>{track.title}</p>
                    {track.intention && (
                      <p className="text-sm truncate" style={{ color: 'hsl(var(--text-muted))' }}>{track.intention}</p>
                    )}
                  </div>
                  <Plus className="w-5 h-5" style={{ color: 'hsl(var(--accent))' }} />
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
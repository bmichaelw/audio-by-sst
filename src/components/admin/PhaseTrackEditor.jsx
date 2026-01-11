import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PhaseTrackEditor({ phaseTrack, track, isOpen, onClose, onUpdate }) {
  const [sessionTitle, setSessionTitle] = useState(phaseTrack?.session_title || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await base44.entities.PhaseTrack.update(phaseTrack.id, {
        session_title: sessionTitle.trim() || null,
      });

      // Log audit action
      const user = await base44.auth.me();
      await base44.entities.AuditLog.create({
        admin_email: user.email,
        action: 'update_phase_track',
        target_type: 'PhaseTrack',
        target_id: phaseTrack.id,
        details: { session_title: sessionTitle },
      });

      toast.success('Session updated');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to update session:', error);
      toast.error('Failed to update session');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-stone-900 border-stone-800">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Session</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-stone-400 text-sm">Original Track</Label>
            <p className="text-white font-medium mt-1">{track?.title}</p>
          </div>
          <div>
            <Label className="text-stone-300">Custom Session Title</Label>
            <Input
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder={track?.title || 'Session title'}
              className="bg-stone-800/50 border-stone-700 text-white mt-2"
            />
            <p className="text-stone-500 text-xs mt-1">
              Leave empty to use the original track title
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-stone-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-amber-600 hover:bg-amber-500"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
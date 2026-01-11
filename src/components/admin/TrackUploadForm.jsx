import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Music, Image, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const chakraOptions = ['none', 'root', 'sacral', 'solar_plexus', 'heart', 'throat', 'third_eye', 'crown'];
const nervousSystemOptions = ['calming', 'activating', 'balancing'];
const difficultyOptions = ['beginner', 'intermediate', 'advanced'];
const accessTierOptions = ['free', 'member', 'resonance_path', 'collaborations'];

export default function TrackUploadForm({
  initialData,
  onSuccess,
  onCancel,
  themes,
}) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    audio_file_uri: initialData?.audio_file_uri || '',
    audio_mime_type: initialData?.audio_mime_type || '',
    audio_file_size: initialData?.audio_file_size || 0,
    cover_image_url: initialData?.cover_image_url || '',
    duration_seconds: initialData?.duration_seconds || 0,
    themes: initialData?.themes || [],
    tags: initialData?.tags || [],
    intention: initialData?.intention || '',
    chakra: initialData?.chakra || 'none',
    nervous_system_state: initialData?.nervous_system_state || 'calming',
    difficulty_level: initialData?.difficulty_level || 'beginner',
    voice_present: initialData?.voice_present || false,
    is_featured: initialData?.is_featured || false,
    access_tier: initialData?.access_tier || 'free',
  });

  const [isUploading, setIsUploading] = useState({ audio: false, image: false });
  const [isSaving, setIsSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const handleFileUpload = async (file, type) => {
    setIsUploading(prev => ({ ...prev, [type]: true }));
    try {
      if (type === 'audio') {
        // Upload to private storage for security
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
        
        // Extract audio metadata
        const audio = new Audio(URL.createObjectURL(file));
        audio.addEventListener('loadedmetadata', () => {
          setFormData(prev => ({ 
            ...prev, 
            duration_seconds: Math.round(audio.duration),
            audio_file_uri: file_uri,
            audio_mime_type: file.type,
            audio_file_size: file.size,
          }));
          URL.revokeObjectURL(audio.src);
        });
        
        setFormData(prev => ({ 
          ...prev, 
          audio_file_uri: file_uri,
          audio_mime_type: file.type,
          audio_file_size: file.size,
        }));
      } else {
        // Cover images can be public
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setFormData(prev => ({ ...prev, cover_image_url: file_url }));
      }
      toast.success(`${type === 'audio' ? 'Audio' : 'Image'} uploaded successfully`);
    } catch (error) {
      toast.error(`Failed to upload ${type}`);
    } finally {
      setIsUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.audio_file_uri) {
      toast.error('Audio file is required');
      return;
    }
    if (!formData.duration_seconds || formData.duration_seconds <= 0) {
      toast.error('Valid duration is required');
      return;
    }
    if (!formData.access_tier) {
      toast.error('Access tier is required');
      return;
    }

    setIsSaving(true);
    try {
      const user = await base44.auth.me();
      
      if (initialData?.id) {
        await base44.entities.Track.update(initialData.id, formData);
        
        // Log audit action
        await base44.entities.AuditLog.create({
          admin_email: user.email,
          action: 'update_track',
          target_type: 'Track',
          target_id: initialData.id,
          details: { title: formData.title },
        });
        
        toast.success('Track updated successfully');
      } else {
        const newTrack = await base44.entities.Track.create({ 
          ...formData, 
          play_count: 0,
          is_archived: false,
        });
        
        // Log audit action
        await base44.entities.AuditLog.create({
          admin_email: user.email,
          action: 'create_track',
          target_type: 'Track',
          target_id: newTrack.id,
          details: { title: formData.title },
        });
        
        toast.success('Track created successfully');
      }
      onSuccess();
    } catch (error) {
      console.error('Track save error:', error);
      toast.error('Failed to save track');
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const toggleTheme = (theme) => {
    setFormData(prev => ({
      ...prev,
      themes: prev.themes.includes(theme)
        ? prev.themes.filter(t => t !== theme)
        : [...prev.themes, theme],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title" style={{ color: 'hsl(var(--text-body))' }}>Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
          placeholder="Enter track title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label style={{ color: 'hsl(var(--text-body))' }}>Audio File *</Label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 px-4 py-3 rounded-lg cursor-pointer transition-all border" style={{ backgroundColor: 'hsl(var(--input))', borderColor: formData.audio_file_uri ? 'hsl(var(--accent) / 0.4)' : 'hsl(var(--border))' }}>
            {isUploading.audio ? (
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
            ) : (
              <Music className="w-5 h-5" style={{ color: 'hsl(var(--text-muted))' }} />
            )}
            <span className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>
              {formData.audio_url ? 'Change audio' : 'Upload audio'}
            </span>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'audio')}
            />
          </label>
          {formData.audio_file_uri && (
            <div className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>
              <div>Audio uploaded ✓</div>
              {formData.audio_file_size > 0 && (
                <div className="text-xs">
                  {(formData.audio_file_size / 1024 / 1024).toFixed(2)} MB
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label style={{ color: 'hsl(var(--text-body))' }}>Cover Image</Label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 px-4 py-3 rounded-lg cursor-pointer transition-all border" style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))' }}>
            {isUploading.image ? (
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
            ) : (
              <Image className="w-5 h-5" style={{ color: 'hsl(var(--text-muted))' }} />
            )}
            <span className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>
              {formData.cover_image_url ? 'Change image' : 'Upload image'}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'image')}
            />
          </label>
          {formData.cover_image_url && (
            <img
              src={formData.cover_image_url}
              alt="Cover preview"
              className="w-12 h-12 rounded-lg object-cover"
            />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration" style={{ color: 'hsl(var(--text-body))' }}>Duration (seconds)</Label>
        <Input
          id="duration"
          type="number"
          value={formData.duration_seconds}
          onChange={(e) => setFormData(prev => ({ ...prev, duration_seconds: parseInt(e.target.value) || 0 }))}
          style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
          className="w-32"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" style={{ color: 'hsl(var(--text-body))' }}>Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
          className="min-h-[100px]"
          placeholder="Describe this track..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="intention" style={{ color: 'hsl(var(--text-body))' }}>Intention</Label>
        <Input
          id="intention"
          value={formData.intention}
          onChange={(e) => setFormData(prev => ({ ...prev, intention: e.target.value }))}
          style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
          placeholder="e.g., Deep relaxation, Energy activation"
        />
      </div>

      <div className="space-y-2">
        <Label style={{ color: 'hsl(var(--text-body))' }}>Themes</Label>
        <div className="flex flex-wrap gap-2">
          {themes.map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => toggleTheme(theme)}
              className="px-3 py-1.5 rounded-full text-sm transition-all"
              style={formData.themes.includes(theme) ? 
                { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' } : 
                { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--text-muted))' }}
            >
              {theme}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label style={{ color: 'hsl(var(--text-body))' }}>Tags</Label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            placeholder="Add a tag"
          />
          <Button type="button" onClick={addTag} variant="outline" style={{ borderColor: 'hsl(var(--border))' }}>
            Add
          </Button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 rounded-full text-sm flex items-center gap-1"
                style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
              >
                {tag}
                <button type="button" onClick={() => removeTag(tag)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label style={{ color: 'hsl(var(--text-body))' }}>Chakra</Label>
          <Select value={formData.chakra} onValueChange={(v) => setFormData(prev => ({ ...prev, chakra: v }))}>
            <SelectTrigger style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
              {chakraOptions.map((opt) => (
                <SelectItem key={opt} value={opt} className="capitalize">
                  {opt.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label style={{ color: 'hsl(var(--text-body))' }}>Nervous System</Label>
          <Select value={formData.nervous_system_state} onValueChange={(v) => setFormData(prev => ({ ...prev, nervous_system_state: v }))}>
            <SelectTrigger style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
              {nervousSystemOptions.map((opt) => (
                <SelectItem key={opt} value={opt} className="capitalize">{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label style={{ color: 'hsl(var(--text-body))' }}>Difficulty</Label>
          <Select value={formData.difficulty_level} onValueChange={(v) => setFormData(prev => ({ ...prev, difficulty_level: v }))}>
            <SelectTrigger style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
              {difficultyOptions.map((opt) => (
                <SelectItem key={opt} value={opt} className="capitalize">{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label style={{ color: 'hsl(var(--text-body))' }}>Access Tier</Label>
          <Select value={formData.access_tier} onValueChange={(v) => setFormData(prev => ({ ...prev, access_tier: v }))}>
            <SelectTrigger style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
              {accessTierOptions.map((opt) => (
                <SelectItem key={opt} value={opt} className="capitalize">
                  {opt.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-3">
          <Switch
            checked={formData.voice_present}
            onCheckedChange={(v) => setFormData(prev => ({ ...prev, voice_present: v }))}
          />
          <Label style={{ color: 'hsl(var(--text-body))' }}>Voice/Guidance Present</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            checked={formData.is_featured}
            onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_featured: v }))}
          />
          <Label style={{ color: 'hsl(var(--text-body))' }}>Featured Track</Label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving} style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
          {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {initialData?.id ? 'Update Track' : 'Create Track'}
        </Button>
      </div>
    </form>
  );
}
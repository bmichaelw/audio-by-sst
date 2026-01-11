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
    if (!formData.title || !formData.audio_file_uri) {
      toast.error('Title and audio file are required');
      return;
    }

    setIsSaving(true);
    try {
      if (initialData?.id) {
        await base44.entities.Track.update(initialData.id, formData);
        toast.success('Track updated successfully');
      } else {
        await base44.entities.Track.create({ ...formData, play_count: 0 });
        toast.success('Track created successfully');
      }
      onSuccess();
    } catch (error) {
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
        <Label htmlFor="title" className="text-stone-300">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="bg-stone-800/50 border-stone-700 text-white"
          placeholder="Enter track title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label className="text-stone-300">Audio File *</Label>
        <div className="flex items-center gap-4">
          <label className={cn(
            "flex items-center gap-2 px-4 py-3 rounded-lg cursor-pointer transition-all",
            "bg-stone-800/50 border border-stone-700 hover:border-amber-600/50",
            formData.audio_url && "border-amber-600/30"
          )}>
            {isUploading.audio ? (
              <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
            ) : (
              <Music className="w-5 h-5 text-stone-400" />
            )}
            <span className="text-stone-300 text-sm">
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
            <div className="text-stone-400 text-sm">
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
        <Label className="text-stone-300">Cover Image</Label>
        <div className="flex items-center gap-4">
          <label className={cn(
            "flex items-center gap-2 px-4 py-3 rounded-lg cursor-pointer transition-all",
            "bg-stone-800/50 border border-stone-700 hover:border-amber-600/50"
          )}>
            {isUploading.image ? (
              <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
            ) : (
              <Image className="w-5 h-5 text-stone-400" />
            )}
            <span className="text-stone-300 text-sm">
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
        <Label htmlFor="duration" className="text-stone-300">Duration (seconds)</Label>
        <Input
          id="duration"
          type="number"
          value={formData.duration_seconds}
          onChange={(e) => setFormData(prev => ({ ...prev, duration_seconds: parseInt(e.target.value) || 0 }))}
          className="bg-stone-800/50 border-stone-700 text-white w-32"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-stone-300">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="bg-stone-800/50 border-stone-700 text-white min-h-[100px]"
          placeholder="Describe this track..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="intention" className="text-stone-300">Intention</Label>
        <Input
          id="intention"
          value={formData.intention}
          onChange={(e) => setFormData(prev => ({ ...prev, intention: e.target.value }))}
          className="bg-stone-800/50 border-stone-700 text-white"
          placeholder="e.g., Deep relaxation, Energy activation"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-stone-300">Themes</Label>
        <div className="flex flex-wrap gap-2">
          {themes.map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => toggleTheme(theme)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm transition-all",
                formData.themes.includes(theme)
                  ? "bg-amber-600 text-white"
                  : "bg-stone-800 text-stone-400 hover:bg-stone-700"
              )}
            >
              {theme}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-stone-300">Tags</Label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            className="bg-stone-800/50 border-stone-700 text-white"
            placeholder="Add a tag"
          />
          <Button type="button" onClick={addTag} variant="outline" className="border-stone-700">
            Add
          </Button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-stone-800 text-stone-300 rounded-full text-sm flex items-center gap-1"
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
          <Label className="text-stone-300">Chakra</Label>
          <Select value={formData.chakra} onValueChange={(v) => setFormData(prev => ({ ...prev, chakra: v }))}>
            <SelectTrigger className="bg-stone-800/50 border-stone-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-stone-800 border-stone-700">
              {chakraOptions.map((opt) => (
                <SelectItem key={opt} value={opt} className="capitalize">
                  {opt.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-stone-300">Nervous System</Label>
          <Select value={formData.nervous_system_state} onValueChange={(v) => setFormData(prev => ({ ...prev, nervous_system_state: v }))}>
            <SelectTrigger className="bg-stone-800/50 border-stone-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-stone-800 border-stone-700">
              {nervousSystemOptions.map((opt) => (
                <SelectItem key={opt} value={opt} className="capitalize">{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-stone-300">Difficulty</Label>
          <Select value={formData.difficulty_level} onValueChange={(v) => setFormData(prev => ({ ...prev, difficulty_level: v }))}>
            <SelectTrigger className="bg-stone-800/50 border-stone-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-stone-800 border-stone-700">
              {difficultyOptions.map((opt) => (
                <SelectItem key={opt} value={opt} className="capitalize">{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-stone-300">Access Tier</Label>
          <Select value={formData.access_tier} onValueChange={(v) => setFormData(prev => ({ ...prev, access_tier: v }))}>
            <SelectTrigger className="bg-stone-800/50 border-stone-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-stone-800 border-stone-700">
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
          <Label className="text-stone-300">Voice/Guidance Present</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            checked={formData.is_featured}
            onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_featured: v }))}
          />
          <Label className="text-stone-300">Featured Track</Label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="border-stone-700 text-stone-300">
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving} className="bg-amber-600 hover:bg-amber-500 text-white">
          {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {initialData?.id ? 'Update Track' : 'Create Track'}
        </Button>
      </div>
    </form>
  );
}
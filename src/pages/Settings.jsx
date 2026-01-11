import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Sparkles, Heart, Moon, Sun, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Settings() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [moodEntry, setMoodEntry] = useState({ mood: '', energy_level: 5, notes: '' });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['user-preferences', user?.email],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: user.email });
      return prefs[0] || null;
    },
    enabled: !!user,
  });

  const { data: themes = [] } = useQuery({
    queryKey: ['themes'],
    queryFn: () => base44.entities.Theme.list('sort_order'),
  });

  const [formData, setFormData] = useState({
    preferred_themes: [],
    preferred_chakras: [],
    preferred_nervous_system_states: [],
    difficulty_level: 'beginner',
    voice_preference: 'no_preference',
    resonance_focus_areas: [],
    session_duration_preference: 'medium',
    daily_reminder_time: '09:00',
    reminder_enabled: false,
    mood_log: [],
  });

  useEffect(() => {
    if (preferences) {
      setFormData({
        preferred_themes: preferences.preferred_themes || [],
        preferred_chakras: preferences.preferred_chakras || [],
        preferred_nervous_system_states: preferences.preferred_nervous_system_states || [],
        difficulty_level: preferences.difficulty_level || 'beginner',
        voice_preference: preferences.voice_preference || 'no_preference',
        resonance_focus_areas: preferences.resonance_focus_areas || [],
        session_duration_preference: preferences.session_duration_preference || 'medium',
        daily_reminder_time: preferences.daily_reminder_time || '09:00',
        reminder_enabled: preferences.reminder_enabled || false,
        mood_log: preferences.mood_log || [],
      });
    }
  }, [preferences]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (preferences) {
        return base44.entities.UserPreferences.update(preferences.id, data);
      } else {
        return base44.entities.UserPreferences.create({
          user_email: user.email,
          ...data,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      toast.success('Preferences saved!');
    },
    onError: () => {
      toast.error('Failed to save preferences');
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const toggleArrayItem = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value],
    }));
  };

  const handleAddMood = () => {
    if (!moodEntry.mood) return;
    
    const newMoodLog = [
      ...formData.mood_log,
      {
        date: new Date().toISOString(),
        mood: moodEntry.mood,
        energy_level: moodEntry.energy_level,
        notes: moodEntry.notes,
      },
    ];
    
    setFormData(prev => ({ ...prev, mood_log: newMoodLog }));
    saveMutation.mutate({ ...formData, mood_log: newMoodLog });
    setMoodEntry({ mood: '', energy_level: 5, notes: '' });
    toast.success('Mood logged!');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  const chakraOptions = ['root', 'sacral', 'solar_plexus', 'heart', 'throat', 'third_eye', 'crown'];
  const nervousSystemOptions = ['activating', 'calming', 'balancing'];
  const focusAreas = ['Stress Relief', 'Better Sleep', 'Focus & Clarity', 'Emotional Balance', 'Energy Boost', 'Self-Love', 'Creativity'];

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, hsl(var(--primary)), hsl(var(--primary-hover)))' }}>
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'hsl(var(--text-heading))', fontFamily: 'var(--font-heading))' }}>Your Preferences</h1>
            <p style={{ color: 'hsl(var(--text-muted))' }}>Personalize your healing journey</p>
          </div>
        </div>

        {/* Preferred Themes */}
        <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border) / 0.5)', borderRadius: '1.25rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'hsl(var(--foreground))', fontSize: '1.25rem' }}>Favorite Themes</CardTitle>
            <CardDescription style={{ fontSize: '0.9375rem', color: 'hsl(var(--text-muted))' }}>Select themes you resonate with most</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {themes.map(theme => (
                <Badge
                  key={theme.id}
                  variant={formData.preferred_themes.includes(theme.name) ? 'default' : 'outline'}
                  className="cursor-pointer transition-all"
                  style={formData.preferred_themes.includes(theme.name) ? 
                    { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' } : 
                    { borderColor: 'hsl(var(--border))' }}
                  onClick={() => toggleArrayItem('preferred_themes', theme.name)}
                >
                  {theme.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chakras & Nervous System */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border) / 0.5)', borderRadius: '1.25rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}>
            <CardHeader>
              <CardTitle style={{ color: 'hsl(var(--foreground))', fontSize: '1.25rem' }}>Chakra Focus</CardTitle>
              <CardDescription style={{ fontSize: '0.9375rem', color: 'hsl(var(--text-muted))' }}>Areas you want to work on</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {chakraOptions.map(chakra => (
                  <Badge
                    key={chakra}
                    variant={formData.preferred_chakras.includes(chakra) ? 'default' : 'outline'}
                    className="cursor-pointer transition-all capitalize"
                    style={formData.preferred_chakras.includes(chakra) ? 
                      { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' } : 
                      { borderColor: 'hsl(var(--border))' }}
                    onClick={() => toggleArrayItem('preferred_chakras', chakra)}
                  >
                    {chakra.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border) / 0.5)', borderRadius: '1.25rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}>
            <CardHeader>
              <CardTitle style={{ color: 'hsl(var(--foreground))', fontSize: '1.25rem' }}>Nervous System</CardTitle>
              <CardDescription style={{ fontSize: '0.9375rem', color: 'hsl(var(--text-muted))' }}>Preferred effects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {nervousSystemOptions.map(state => (
                  <Badge
                    key={state}
                    variant={formData.preferred_nervous_system_states.includes(state) ? 'default' : 'outline'}
                    className="cursor-pointer transition-all capitalize"
                    style={formData.preferred_nervous_system_states.includes(state) ? 
                      { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' } : 
                      { borderColor: 'hsl(var(--border))' }}
                    onClick={() => toggleArrayItem('preferred_nervous_system_states', state)}
                  >
                    {state}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ResonancePath Focus */}
        <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border) / 0.5)', borderRadius: '1.25rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'hsl(var(--foreground))', fontSize: '1.25rem' }}>ResonancePath Focus</CardTitle>
            <CardDescription style={{ fontSize: '0.9375rem', color: 'hsl(var(--text-muted))' }}>What you want to achieve</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {focusAreas.map(area => (
                <Badge
                  key={area}
                  variant={formData.resonance_focus_areas.includes(area) ? 'default' : 'outline'}
                  className="cursor-pointer transition-all"
                  style={formData.resonance_focus_areas.includes(area) ? 
                    { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' } : 
                    { borderColor: 'hsl(var(--border))' }}
                  onClick={() => toggleArrayItem('resonance_focus_areas', area)}
                >
                  {area}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Session Preferences */}
        <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border) / 0.5)', borderRadius: '1.25rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'hsl(var(--foreground))', fontSize: '1.25rem' }}>Session Preferences</CardTitle>
            <CardDescription style={{ fontSize: '0.9375rem', color: 'hsl(var(--text-muted))' }}>Customize your practice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label className="mb-2 block" style={{ color: 'hsl(var(--text-body))' }}>Experience Level</Label>
                <Select value={formData.difficulty_level} onValueChange={(val) => setFormData(prev => ({ ...prev, difficulty_level: val }))}>
                  <SelectTrigger style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block" style={{ color: 'hsl(var(--text-body))' }}>Voice Guidance</Label>
                <Select value={formData.voice_preference} onValueChange={(val) => setFormData(prev => ({ ...prev, voice_preference: val }))}>
                  <SelectTrigger style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
                    <SelectItem value="with_voice">Prefer Guided</SelectItem>
                    <SelectItem value="without_voice">Prefer Instrumental</SelectItem>
                    <SelectItem value="no_preference">No Preference</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block" style={{ color: 'hsl(var(--text-body))' }}>Session Length</Label>
                <Select value={formData.session_duration_preference} onValueChange={(val) => setFormData(prev => ({ ...prev, session_duration_preference: val }))}>
                  <SelectTrigger style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
                    <SelectItem value="short">Short (&lt;15 min)</SelectItem>
                    <SelectItem value="medium">Medium (15-30 min)</SelectItem>
                    <SelectItem value="long">Long (30+ min)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'hsl(var(--divider))' }}>
              <div>
                <Label style={{ color: 'hsl(var(--text-body))' }}>Daily Reminder</Label>
                <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>Get reminded to practice</p>
              </div>
              <Switch
                checked={formData.reminder_enabled}
                onCheckedChange={(val) => setFormData(prev => ({ ...prev, reminder_enabled: val }))}
              />
            </div>

            {formData.reminder_enabled && (
              <div>
                <Label className="mb-2 block" style={{ color: 'hsl(var(--text-body))' }}>Reminder Time</Label>
                <Input
                  type="time"
                  value={formData.daily_reminder_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, daily_reminder_time: e.target.value }))}
                  style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))' }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mood Tracking */}
        <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border) / 0.5)', borderRadius: '1.25rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: 'hsl(var(--foreground))', fontSize: '1.25rem' }}>
              <Heart className="w-5 h-5 text-rose-500" />
              Daily Mood Check-in
            </CardTitle>
            <CardDescription style={{ fontSize: '0.9375rem', color: 'hsl(var(--text-muted))' }}>Track how you're feeling</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label className="mb-2 block" style={{ color: 'hsl(var(--text-body))' }}>How are you feeling today?</Label>
                <Select value={moodEntry.mood} onValueChange={(val) => setMoodEntry(prev => ({ ...prev, mood: val }))}>
                  <SelectTrigger style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))' }}>
                    <SelectValue placeholder="Select mood..." />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
                    <SelectItem value="amazing">🌟 Amazing</SelectItem>
                    <SelectItem value="good">😊 Good</SelectItem>
                    <SelectItem value="okay">😐 Okay</SelectItem>
                    <SelectItem value="low">😔 Low</SelectItem>
                    <SelectItem value="stressed">😰 Stressed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block" style={{ color: 'hsl(var(--text-body))' }}>Energy Level: {moodEntry.energy_level}/10</Label>
                <Input
                  type="range"
                  min="1"
                  max="10"
                  value={moodEntry.energy_level}
                  onChange={(e) => setMoodEntry(prev => ({ ...prev, energy_level: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <div>
                <Label className="mb-2 block" style={{ color: 'hsl(var(--text-body))' }}>Notes (optional)</Label>
                <Textarea
                  value={moodEntry.notes}
                  onChange={(e) => setMoodEntry(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any thoughts or reflections..."
                  className="resize-none"
                  style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))' }}
                  rows={2}
                />
              </div>

              <Button
                onClick={handleAddMood}
                disabled={!moodEntry.mood}
                className="w-full"
                style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
              >
                Log Mood
              </Button>
            </div>

            {formData.mood_log.length > 0 && (
              <div className="pt-4 border-t" style={{ borderColor: 'hsl(var(--divider))' }}>
                <h4 className="text-sm font-medium mb-3" style={{ color: 'hsl(var(--text-body))' }}>Recent Entries</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {formData.mood_log.slice(-5).reverse().map((entry, idx) => (
                    <div key={idx} className="rounded-lg p-3 text-sm" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="capitalize" style={{ color: 'hsl(var(--foreground))' }}>{entry.mood}</span>
                        <span style={{ color: 'hsl(var(--text-muted))' }}>{new Date(entry.date).toLocaleDateString()}</span>
                      </div>
                      <div style={{ color: 'hsl(var(--text-muted))' }}>Energy: {entry.energy_level}/10</div>
                      {entry.notes && <p className="text-xs mt-1" style={{ color: 'hsl(var(--text-subtle))' }}>{entry.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="px-8"
            style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
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
    <div className="min-h-screen bg-stone-950 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Your Preferences</h1>
            <p className="text-stone-400">Personalize your experience</p>
          </div>
        </div>

        {/* Preferred Themes */}
        <Card className="bg-stone-900 border-stone-800">
          <CardHeader>
            <CardTitle className="text-white">Favorite Themes</CardTitle>
            <CardDescription>Select themes you resonate with most</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {themes.map(theme => (
                <Badge
                  key={theme.id}
                  variant={formData.preferred_themes.includes(theme.name) ? 'default' : 'outline'}
                  className={cn(
                    "cursor-pointer transition-all",
                    formData.preferred_themes.includes(theme.name)
                      ? "bg-amber-600 hover:bg-amber-500 text-white"
                      : "hover:bg-stone-800"
                  )}
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
          <Card className="bg-stone-900 border-stone-800">
            <CardHeader>
              <CardTitle className="text-white">Chakra Focus</CardTitle>
              <CardDescription>Areas you want to work on</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {chakraOptions.map(chakra => (
                  <Badge
                    key={chakra}
                    variant={formData.preferred_chakras.includes(chakra) ? 'default' : 'outline'}
                    className={cn(
                      "cursor-pointer transition-all capitalize",
                      formData.preferred_chakras.includes(chakra)
                        ? "bg-amber-600 hover:bg-amber-500 text-white"
                        : "hover:bg-stone-800"
                    )}
                    onClick={() => toggleArrayItem('preferred_chakras', chakra)}
                  >
                    {chakra.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-stone-900 border-stone-800">
            <CardHeader>
              <CardTitle className="text-white">Nervous System</CardTitle>
              <CardDescription>Preferred effects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {nervousSystemOptions.map(state => (
                  <Badge
                    key={state}
                    variant={formData.preferred_nervous_system_states.includes(state) ? 'default' : 'outline'}
                    className={cn(
                      "cursor-pointer transition-all capitalize",
                      formData.preferred_nervous_system_states.includes(state)
                        ? "bg-amber-600 hover:bg-amber-500 text-white"
                        : "hover:bg-stone-800"
                    )}
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
        <Card className="bg-stone-900 border-stone-800">
          <CardHeader>
            <CardTitle className="text-white">ResonancePath Focus</CardTitle>
            <CardDescription>What you want to achieve</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {focusAreas.map(area => (
                <Badge
                  key={area}
                  variant={formData.resonance_focus_areas.includes(area) ? 'default' : 'outline'}
                  className={cn(
                    "cursor-pointer transition-all",
                    formData.resonance_focus_areas.includes(area)
                      ? "bg-amber-600 hover:bg-amber-500 text-white"
                      : "hover:bg-stone-800"
                  )}
                  onClick={() => toggleArrayItem('resonance_focus_areas', area)}
                >
                  {area}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Session Preferences */}
        <Card className="bg-stone-900 border-stone-800">
          <CardHeader>
            <CardTitle className="text-white">Session Preferences</CardTitle>
            <CardDescription>Customize your practice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label className="text-stone-300 mb-2 block">Experience Level</Label>
                <Select value={formData.difficulty_level} onValueChange={(val) => setFormData(prev => ({ ...prev, difficulty_level: val }))}>
                  <SelectTrigger className="bg-stone-800 border-stone-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-stone-300 mb-2 block">Voice Guidance</Label>
                <Select value={formData.voice_preference} onValueChange={(val) => setFormData(prev => ({ ...prev, voice_preference: val }))}>
                  <SelectTrigger className="bg-stone-800 border-stone-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="with_voice">Prefer Guided</SelectItem>
                    <SelectItem value="without_voice">Prefer Instrumental</SelectItem>
                    <SelectItem value="no_preference">No Preference</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-stone-300 mb-2 block">Session Length</Label>
                <Select value={formData.session_duration_preference} onValueChange={(val) => setFormData(prev => ({ ...prev, session_duration_preference: val }))}>
                  <SelectTrigger className="bg-stone-800 border-stone-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short (&lt;15 min)</SelectItem>
                    <SelectItem value="medium">Medium (15-30 min)</SelectItem>
                    <SelectItem value="long">Long (30+ min)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-stone-800">
              <div>
                <Label className="text-stone-300">Daily Reminder</Label>
                <p className="text-stone-500 text-sm">Get reminded to practice</p>
              </div>
              <Switch
                checked={formData.reminder_enabled}
                onCheckedChange={(val) => setFormData(prev => ({ ...prev, reminder_enabled: val }))}
              />
            </div>

            {formData.reminder_enabled && (
              <div>
                <Label className="text-stone-300 mb-2 block">Reminder Time</Label>
                <Input
                  type="time"
                  value={formData.daily_reminder_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, daily_reminder_time: e.target.value }))}
                  className="bg-stone-800 border-stone-700"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mood Tracking */}
        <Card className="bg-stone-900 border-stone-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-400" />
              Daily Mood Check-in
            </CardTitle>
            <CardDescription>Track how you're feeling</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label className="text-stone-300 mb-2 block">How are you feeling today?</Label>
                <Select value={moodEntry.mood} onValueChange={(val) => setMoodEntry(prev => ({ ...prev, mood: val }))}>
                  <SelectTrigger className="bg-stone-800 border-stone-700">
                    <SelectValue placeholder="Select mood..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amazing">🌟 Amazing</SelectItem>
                    <SelectItem value="good">😊 Good</SelectItem>
                    <SelectItem value="okay">😐 Okay</SelectItem>
                    <SelectItem value="low">😔 Low</SelectItem>
                    <SelectItem value="stressed">😰 Stressed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-stone-300 mb-2 block">Energy Level: {moodEntry.energy_level}/10</Label>
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
                <Label className="text-stone-300 mb-2 block">Notes (optional)</Label>
                <Textarea
                  value={moodEntry.notes}
                  onChange={(e) => setMoodEntry(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any thoughts or reflections..."
                  className="bg-stone-800 border-stone-700 resize-none"
                  rows={2}
                />
              </div>

              <Button
                onClick={handleAddMood}
                disabled={!moodEntry.mood}
                className="bg-amber-600 hover:bg-amber-500 w-full"
              >
                Log Mood
              </Button>
            </div>

            {formData.mood_log.length > 0 && (
              <div className="pt-4 border-t border-stone-800">
                <h4 className="text-stone-300 text-sm font-medium mb-3">Recent Entries</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {formData.mood_log.slice(-5).reverse().map((entry, idx) => (
                    <div key={idx} className="bg-stone-800/50 rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white capitalize">{entry.mood}</span>
                        <span className="text-stone-400">{new Date(entry.date).toLocaleDateString()}</span>
                      </div>
                      <div className="text-stone-400">Energy: {entry.energy_level}/10</div>
                      {entry.notes && <p className="text-stone-500 text-xs mt-1">{entry.notes}</p>}
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
            className="bg-amber-600 hover:bg-amber-500 text-white px-8"
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
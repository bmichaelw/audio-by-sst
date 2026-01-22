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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, Sparkles, Heart, Moon, Sun, X, User, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Settings() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [moodEntry, setMoodEntry] = useState({ mood: '', energy_level: 5, notes: '' });
  const [artistData, setArtistData] = useState({
    artist_tagline: '',
    artist_bio: '',
    artist_avatar_url: '',
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        setArtistData({
          artist_tagline: userData.artist_tagline || '',
          artist_bio: userData.artist_bio || '',
          artist_avatar_url: userData.artist_avatar_url || '',
        });
      } catch {}
    };
    fetchUser();
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

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingAvatar(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setArtistData(prev => ({ ...prev, artist_avatar_url: file_url }));
      toast.success('Avatar uploaded!');
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const saveArtistProfile = useMutation({
    mutationFn: async (data) => {
      return base44.auth.updateMe(data);
    },
    onSuccess: () => {
      toast.success('Artist profile updated!');
      queryClient.invalidateQueries({ queryKey: ['artist'] });
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const handleSaveArtistProfile = () => {
    saveArtistProfile.mutate(artistData);
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
            <h1 className="text-3xl font-bold mb-3" style={{ color: 'hsl(var(--text-heading))', fontFamily: 'var(--font-heading)', letterSpacing: '0.03em' }}>Settings</h1>
            <div className="h-px w-24 mb-2" style={{ background: 'linear-gradient(to right, hsl(var(--accent)), transparent)' }} />
            <p style={{ color: 'hsl(var(--text-muted))' }}>Manage your profile and preferences</p>
          </div>
        </div>

        <Tabs defaultValue={user?.is_artist ? "artist" : "preferences"}>
          <TabsList style={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))' }}>
            {user?.is_artist && (
              <TabsTrigger value="artist">
                <User className="w-4 h-4 mr-2" />
                Artist Profile
              </TabsTrigger>
            )}
            <TabsTrigger value="preferences">
              <Sparkles className="w-4 h-4 mr-2" />
              Preferences
            </TabsTrigger>
          </TabsList>

          {/* Artist Profile Tab */}
          {user?.is_artist && (
            <TabsContent value="artist" className="space-y-6 mt-6">
              <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border) / 0.5)', borderRadius: '1.25rem' }}>
                <CardHeader>
                  <CardTitle style={{ color: 'hsl(var(--foreground))', fontSize: '1.25rem' }}>Artist Profile</CardTitle>
                  <CardDescription style={{ fontSize: '0.9375rem', color: 'hsl(var(--text-muted))' }}>
                    Customize how you appear to listeners
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Upload */}
                  <div>
                    <Label className="mb-2 block" style={{ color: 'hsl(var(--text-body))' }}>Profile Avatar</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                        {artistData.artist_avatar_url ? (
                          <img src={artistData.artist_avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl" style={{ color: 'hsl(var(--text-muted))' }}>
                            {user?.full_name?.[0] || 'A'}
                          </div>
                        )}
                      </div>
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          id="avatar-upload"
                        />
                        <label htmlFor="avatar-upload">
                          <Button type="button" variant="outline" disabled={uploadingAvatar} asChild>
                            <span>
                              {uploadingAvatar ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4 mr-2" />
                              )}
                              Upload Image
                            </span>
                          </Button>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Artist Tagline */}
                  <div>
                    <Label className="mb-2 block" style={{ color: 'hsl(var(--text-body))' }}>
                      Tagline / Hero Line
                    </Label>
                    <Input
                      value={artistData.artist_tagline}
                      onChange={(e) => setArtistData(prev => ({ ...prev, artist_tagline: e.target.value }))}
                      placeholder="e.g., Healing through sacred sound and vibration"
                      style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))' }}
                      maxLength={100}
                    />
                    <p className="text-xs mt-1" style={{ color: 'hsl(var(--text-subtle))' }}>
                      A short, inspiring line that appears on your profile
                    </p>
                  </div>

                  {/* Artist Bio */}
                  <div>
                    <Label className="mb-2 block" style={{ color: 'hsl(var(--text-body))' }}>
                      Bio
                    </Label>
                    <Textarea
                      value={artistData.artist_bio}
                      onChange={(e) => setArtistData(prev => ({ ...prev, artist_bio: e.target.value }))}
                      placeholder="Tell listeners about your practice, background, and approach to sound healing..."
                      style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))' }}
                      rows={6}
                    />
                  </div>

                  <Button
                    onClick={handleSaveArtistProfile}
                    disabled={saveArtistProfile.isPending}
                    style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                  >
                    {saveArtistProfile.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Artist Profile
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6 mt-6">

        {/* Preferred Themes */}
        <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border) / 0.5)', borderRadius: '1.25rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'hsl(var(--foreground))', fontSize: '1.25rem' }}>Favorite Themes</CardTitle>
            <div className="h-px w-16 mt-2 mb-1" style={{ background: 'linear-gradient(to right, hsl(var(--accent)), transparent)' }} />
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
              <div className="h-px w-16 mt-2 mb-1" style={{ background: 'linear-gradient(to right, hsl(var(--accent)), transparent)' }} />
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
              <div className="h-px w-16 mt-2 mb-1" style={{ background: 'linear-gradient(to right, hsl(var(--accent)), transparent)' }} />
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
            <div className="h-px w-16 mt-2 mb-1" style={{ background: 'linear-gradient(to right, hsl(var(--accent)), transparent)' }} />
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
            <div className="h-px w-16 mt-2 mb-1" style={{ background: 'linear-gradient(to right, hsl(var(--accent)), transparent)' }} />
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
            <div className="h-px w-16 mt-2 mb-1" style={{ background: 'linear-gradient(to right, hsl(var(--accent)), transparent)' }} />
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TrackList from '@/components/tracks/TrackList.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, Loader2 } from 'lucide-react';

export default function PersonalizedPlaylist({ userEmail, userTier, onUpgradeClick }) {
  const { data: preferences } = useQuery({
    queryKey: ['user-preferences', userEmail],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: userEmail });
      return prefs[0] || null;
    },
    enabled: !!userEmail,
  });

  const { data: tracks = [], isLoading } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => base44.entities.Track.list('-created_date'),
  });

  const personalizedPlaylist = useMemo(() => {
    if (!preferences || tracks.length === 0) return [];

    const scored = tracks.map(track => {
      let score = 0;
      const reasons = [];

      // Match preferred themes
      if (preferences.preferred_themes?.length > 0) {
        const matchedThemes = track.themes?.filter(t => preferences.preferred_themes.includes(t));
        if (matchedThemes?.length > 0) {
          score += matchedThemes.length * 3;
          reasons.push(`Matches your interest in ${matchedThemes.join(', ')}`);
        }
      }

      // Match preferred chakras
      if (preferences.preferred_chakras?.length > 0 && track.chakra) {
        if (preferences.preferred_chakras.includes(track.chakra)) {
          score += 2;
          reasons.push(`Focuses on ${track.chakra} chakra`);
        }
      }

      // Match nervous system preferences
      if (preferences.preferred_nervous_system_states?.length > 0 && track.nervous_system_state) {
        if (preferences.preferred_nervous_system_states.includes(track.nervous_system_state)) {
          score += 2;
          reasons.push(`${track.nervous_system_state} effect`);
        }
      }

      // Match difficulty level
      if (preferences.difficulty_level && track.difficulty_level === preferences.difficulty_level) {
        score += 1;
        reasons.push(`${preferences.difficulty_level} level`);
      }

      // Match voice preference
      if (preferences.voice_preference === 'with_voice' && track.voice_present) {
        score += 1;
        reasons.push('Guided practice');
      }
      if (preferences.voice_preference === 'without_voice' && !track.voice_present) {
        score += 1;
        reasons.push('Instrumental only');
      }

      // Match session duration
      if (preferences.session_duration_preference && track.duration_seconds) {
        const minutes = track.duration_seconds / 60;
        if (preferences.session_duration_preference === 'short' && minutes < 15) {
          score += 1;
          reasons.push('Quick session');
        }
        if (preferences.session_duration_preference === 'medium' && minutes >= 15 && minutes <= 30) {
          score += 1;
          reasons.push('Medium length');
        }
        if (preferences.session_duration_preference === 'long' && minutes > 30) {
          score += 1;
          reasons.push('Extended practice');
        }
      }

      return { track, score, reasons };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [tracks, preferences]);

  if (!preferences) return null;

  if (isLoading) {
    return (
      <Card className="bg-stone-900 border-stone-800">
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (personalizedPlaylist.length === 0) {
    return (
      <Card className="bg-stone-900 border-stone-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            Your Personalized Playlist
          </CardTitle>
          <CardDescription>
            Complete your preferences in Settings to see personalized recommendations
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-stone-900 border-stone-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-600" />
          Your Personalized Playlist
        </CardTitle>
        <CardDescription>
          Curated based on your preferences • {personalizedPlaylist.length} tracks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TrackList
          tracks={personalizedPlaylist.map(item => item.track)}
          isLoading={false}
          userTier={userTier}
          onUpgradeClick={onUpgradeClick}
        />
      </CardContent>
    </Card>
  );
}
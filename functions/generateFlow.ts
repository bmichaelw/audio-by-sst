import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { startTrackId, artistEmail } = await req.json();

    // Get user's subscription
    const subscriptions = await base44.entities.UserSubscription.filter({
      user_email: user.email,
      is_active: true
    });

    const userTier = subscriptions.length > 0 ? subscriptions[0].subscription_type : 'free';

    // Get all available tracks
    let availableTracks = await base44.entities.Track.filter({ is_archived: false });

    // Filter by access eligibility
    availableTracks = availableTracks.filter(track => {
      if (track.access_eligibility === 'all_access') {
        return userTier === 'all_access';
      }
      if (track.access_eligibility === 'artist_membership') {
        return userTier === 'all_access' || userTier === 'artist_membership';
      }
      return false;
    });

    if (availableTracks.length === 0) {
      return Response.json({ tracks: [], message: 'No eligible content available' });
    }

    // Find starting track
    let startTrack = availableTracks.find(t => t.id === startTrackId);
    if (!startTrack && availableTracks.length > 0) {
      startTrack = availableTracks[0];
    }

    // Build flow queue with intelligent sequencing
    const flowQueue = [startTrack];
    const usedTrackIds = new Set([startTrack.id]);

    // Intensity level mapping
    const intensityLevels = {
      'very_low': 1,
      'low': 2,
      'medium': 3,
      'high': 4,
      'very_high': 5
    };

    let currentTrack = startTrack;
    const maxQueueSize = 20;

    // If artist email specified, prioritize that artist's tracks first
    let artistTracks = [];
    let otherTracks = [];

    if (artistEmail) {
      artistTracks = availableTracks.filter(t => 
        t.artist_email === artistEmail && !usedTrackIds.has(t.id)
      );
      otherTracks = availableTracks.filter(t => 
        t.artist_email !== artistEmail && !usedTrackIds.has(t.id)
      );
    } else {
      otherTracks = availableTracks.filter(t => !usedTrackIds.has(t.id));
    }

    // Generate flow queue
    while (flowQueue.length < maxQueueSize) {
      let nextTrack = null;

      // First, try to find from artist tracks if available
      if (artistTracks.length > 0) {
        nextTrack = findNextTrack(currentTrack, artistTracks, intensityLevels);
        if (nextTrack) {
          artistTracks = artistTracks.filter(t => t.id !== nextTrack.id);
        }
      }

      // If no artist tracks left or none found, try other tracks
      if (!nextTrack && otherTracks.length > 0) {
        nextTrack = findNextTrack(currentTrack, otherTracks, intensityLevels);
        if (nextTrack) {
          otherTracks = otherTracks.filter(t => t.id !== nextTrack.id);
        }
      }

      // If no next track found, break
      if (!nextTrack) {
        break;
      }

      flowQueue.push(nextTrack);
      usedTrackIds.add(nextTrack.id);
      currentTrack = nextTrack;
    }

    return Response.json({ 
      tracks: flowQueue,
      message: flowQueue.length < 5 ? 'Limited content available in this flow' : null
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Helper function to find next compatible track
function findNextTrack(currentTrack, candidateTracks, intensityLevels) {
  const currentIntensity = intensityLevels[currentTrack.intensity_band] || 3;

  // Score each candidate
  const scoredTracks = candidateTracks.map(track => {
    let score = 0;
    const trackIntensity = intensityLevels[track.intensity_band] || 3;

    // Prevent abrupt intensity jumps (max 1 level difference)
    const intensityDiff = Math.abs(trackIntensity - currentIntensity);
    if (intensityDiff > 1) {
      return null; // Skip tracks with too much intensity difference
    }
    score += (2 - intensityDiff) * 10; // Prefer smaller intensity changes

    // Match modality (prefer similar modalities)
    if (track.modality === currentTrack.modality) {
      score += 15;
    }

    // Match voice type
    if (track.voice_type === currentTrack.voice_type) {
      score += 10;
    }

    // Match lyrical state
    if (track.lyrical_state === currentTrack.lyrical_state) {
      score += 8;
    }

    // Match safety flags
    if (track.is_sleep_safe === currentTrack.is_sleep_safe) {
      score += 5;
    }
    if (track.is_trip_safe === currentTrack.is_trip_safe) {
      score += 5;
    }

    return { track, score };
  }).filter(item => item !== null);

  // Sort by score and return best match
  if (scoredTracks.length === 0) {
    return null;
  }

  scoredTracks.sort((a, b) => b.score - a.score);
  return scoredTracks[0].track;
}
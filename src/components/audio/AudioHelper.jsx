import { base44 } from '@/api/base44Client';

/**
 * Generates a signed URL for private audio playback
 * Signed URLs expire after 1 hour for security
 */
export async function getPlaybackUrl(track) {
  if (!track.audio_file_uri) {
    throw new Error('Track has no audio file URI');
  }

  try {
    // Create a signed URL that expires in 1 hour (3600 seconds)
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
      file_uri: track.audio_file_uri,
      expires_in: 3600,
    });
    
    return signed_url;
  } catch (error) {
    console.error('Failed to generate playback URL:', error);
    throw new Error('Unable to generate secure playback URL');
  }
}

/**
 * Validates if user has access to a track based on their subscription tier
 */
export function canAccessTrack(userTier, trackTier) {
  const TIER_HIERARCHY = {
    free: 0,
    member: 1,
    resonance_path: 2,
    collaborations: 3,
  };

  return TIER_HIERARCHY[userTier] >= TIER_HIERARCHY[trackTier];
}
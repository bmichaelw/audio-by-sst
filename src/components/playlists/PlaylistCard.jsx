import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Music, Heart, Lock, Globe, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PlaylistCard({ playlist, isOwner, user }) {
  const navigate = useNavigate();

  return (
    <Card className="bg-stone-900 border-stone-800 hover:bg-stone-900/80 transition-all group cursor-pointer">
      <CardContent className="p-0">
        {/* Cover */}
        <div 
          className="h-48 bg-gradient-to-br from-amber-600/20 via-stone-800 to-stone-900 flex items-center justify-center relative overflow-hidden"
          onClick={() => navigate(createPageUrl(`PlaylistView?id=${playlist.id}`))}
        >
          {playlist.cover_image_url ? (
            <img src={playlist.cover_image_url} alt={playlist.name} className="w-full h-full object-cover" />
          ) : (
            <Music className="w-16 h-16 text-stone-600 group-hover:text-stone-500 transition-colors" />
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <Button
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity bg-amber-600 hover:bg-amber-500 rounded-full w-12 h-12"
            >
              <Play className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-white font-medium line-clamp-1">{playlist.name}</h3>
            {playlist.is_public ? (
              <Globe className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : (
              <Lock className="w-4 h-4 text-stone-500 flex-shrink-0" />
            )}
          </div>
          
          {playlist.description && (
            <p className="text-stone-400 text-sm line-clamp-2 mb-3">
              {playlist.description}
            </p>
          )}

          <div className="flex items-center justify-between text-stone-500 text-sm">
            <span className="flex items-center gap-1">
              <Music className="w-3 h-3" />
              {/* Track count will be calculated */}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {playlist.likes_count || 0}
            </span>
          </div>

          {!isOwner && (
            <p className="text-stone-500 text-xs mt-2">
              by {playlist.created_by?.split('@')[0]}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
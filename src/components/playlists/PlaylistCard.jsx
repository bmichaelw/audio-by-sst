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
    <Card className="hover:shadow-lg transition-all group cursor-pointer" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
      <CardContent className="p-0">
        {/* Cover */}
        <div 
          className="h-48 flex items-center justify-center relative overflow-hidden"
          style={{ background: 'linear-gradient(to bottom right, hsl(var(--accent) / 0.2), hsl(var(--muted)))' }}
          onClick={() => navigate(createPageUrl(`PlaylistView?id=${playlist.id}`))}
        >
          {playlist.cover_image_url ? (
            <img src={playlist.cover_image_url} alt={playlist.name} className="w-full h-full object-cover" />
          ) : (
            <Music className="w-16 h-16 transition-colors" style={{ color: 'hsl(var(--text-subtle))' }} />
          )}
          <div className="absolute inset-0 bg-purple-900/0 group-hover:bg-purple-900/10 transition-colors flex items-center justify-center">
            <Button
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full w-12 h-12"
              style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            >
              <Play className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium line-clamp-1" style={{ color: 'hsl(var(--foreground))' }}>{playlist.name}</h3>
            {playlist.is_public ? (
              <Globe className="w-4 h-4 text-green-600 flex-shrink-0" />
            ) : (
              <Lock className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--text-subtle))' }} />
            )}
          </div>
          
          {playlist.description && (
            <p className="text-sm line-clamp-2 mb-3" style={{ color: 'hsl(var(--text-muted))' }}>
              {playlist.description}
            </p>
          )}

          <div className="flex items-center justify-between text-sm" style={{ color: 'hsl(var(--text-subtle))' }}>
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
            <p className="text-xs mt-2" style={{ color: 'hsl(var(--text-subtle))' }}>
              by {playlist.created_by?.split('@')[0]}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function ArtistApprovals() {
  const queryClient = useQueryClient();

  const { data: pendingArtists = [], isLoading } = useQuery({
    queryKey: ['pending-artists'],
    queryFn: async () => {
      const allUsers = await base44.entities.User.list();
      return allUsers.filter(u => u.is_artist && !u.artist_approved);
    },
  });

  const handleApprove = async (artist) => {
    try {
      await base44.entities.User.update(artist.id, {
        artist_approved: true,
      });
      toast.success(`${artist.full_name || artist.email} approved as artist`);
      queryClient.invalidateQueries({ queryKey: ['pending-artists'] });
    } catch (error) {
      toast.error('Failed to approve artist');
    }
  };

  const handleReject = async (artist) => {
    try {
      await base44.entities.User.update(artist.id, {
        is_artist: false,
        artist_approved: false,
      });
      toast.success('Artist application rejected');
      queryClient.invalidateQueries({ queryKey: ['pending-artists'] });
    } catch (error) {
      toast.error('Failed to reject artist');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
      </div>
    );
  }

  if (pendingArtists.length === 0) {
    return (
      <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        <CardContent className="py-12 text-center">
          <User className="w-12 h-12 mx-auto mb-4" style={{ color: 'hsl(var(--text-subtle))' }} />
          <p style={{ color: 'hsl(var(--text-muted))' }}>No pending artist applications</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium" style={{ color: 'hsl(var(--foreground))' }}>
          Pending Artist Approvals
        </h3>
        <Badge style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
          {pendingArtists.length} Pending
        </Badge>
      </div>

      <div className="grid gap-4">
        {pendingArtists.map((artist, index) => (
          <motion.div
            key={artist.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={artist.artist_profile_image} />
                    <AvatarFallback style={{ backgroundColor: 'hsl(var(--muted))' }}>
                      {(artist.full_name || artist.email)[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                      {artist.full_name || 'Unnamed Artist'}
                    </h4>
                    <p className="text-sm mb-2" style={{ color: 'hsl(var(--text-muted))' }}>
                      {artist.email}
                    </p>
                    {artist.artist_bio && (
                      <p className="text-sm mt-3 p-3 rounded-lg" style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--text-body))' }}>
                        {artist.artist_bio}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(artist)}
                      style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(artist)}
                      className="text-red-600 hover:text-red-700"
                      style={{ borderColor: 'hsl(var(--border))' }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
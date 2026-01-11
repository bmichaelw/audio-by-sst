import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import PlaylistCard from '@/components/playlists/PlaylistCard.jsx';
import CreatePlaylistModal from '@/components/playlists/CreatePlaylistModal.jsx';
import { Plus, Music, Users, Loader2 } from 'lucide-react';

export default function Playlists() {
  const [user, setUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: myPlaylists = [], isLoading: myLoading } = useQuery({
    queryKey: ['my-playlists', user?.email],
    queryFn: () => base44.entities.Playlist.filter({ user_email: user.email }, '-created_date'),
    enabled: !!user,
  });

  const { data: publicPlaylists = [], isLoading: publicLoading } = useQuery({
    queryKey: ['public-playlists'],
    queryFn: () => base44.entities.Playlist.filter({ is_public: true }, '-likes_count'),
  });

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'hsl(var(--text-heading))', fontFamily: 'var(--font-heading))' }}>Playlists</h1>
            <p style={{ color: 'hsl(var(--text-muted))' }}>Curate and share your favorite tracks</p>
          </div>
          {user && (
            <Button
              onClick={() => setShowCreateModal(true)}
              style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Playlist
            </Button>
          )}
        </div>

        <Tabs defaultValue="my" className="space-y-6">
          <TabsList style={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))' }}>
            <TabsTrigger value="my">
              <Music className="w-4 h-4 mr-2" />
              My Playlists
            </TabsTrigger>
            <TabsTrigger value="community">
              <Users className="w-4 h-4 mr-2" />
              Community Playlists
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my">
            {myLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
              </div>
            ) : myPlaylists.length === 0 ? (
              <div className="text-center py-12">
                <Music className="w-16 h-16 mx-auto mb-4" style={{ color: 'hsl(var(--text-subtle))' }} />
                <p className="mb-4" style={{ color: 'hsl(var(--text-muted))' }}>You haven't created any playlists yet</p>
                <Button onClick={() => setShowCreateModal(true)} style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                  Create Your First Playlist
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myPlaylists.map(playlist => (
                  <PlaylistCard key={playlist.id} playlist={playlist} isOwner user={user} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="community">
            {publicLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
              </div>
            ) : publicPlaylists.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4" style={{ color: 'hsl(var(--text-subtle))' }} />
                <p style={{ color: 'hsl(var(--text-muted))' }}>No public playlists yet</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {publicPlaylists.map(playlist => (
                  <PlaylistCard key={playlist.id} playlist={playlist} user={user} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {user && (
        <CreatePlaylistModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          user={user}
        />
      )}
    </div>
  );
}
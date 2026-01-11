import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CreatePostModal from '@/components/community/CreatePostModal.jsx';
import DiscussionThread from '@/components/community/DiscussionThread.jsx';
import { MessageSquare, Plus, TrendingUp, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Community() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['discussion-posts', selectedCategory],
    queryFn: async () => {
      if (selectedCategory === 'all') {
        return base44.entities.DiscussionPost.list('-created_date');
      }
      return base44.entities.DiscussionPost.filter({ category: selectedCategory }, '-created_date');
    },
  });

  const categories = [
    { id: 'all', label: 'All', icon: MessageSquare },
    { id: 'general', label: 'General', icon: MessageSquare },
    { id: 'experiences', label: 'Experiences', icon: Users },
    { id: 'questions', label: 'Questions', icon: MessageSquare },
    { id: 'tips', label: 'Tips & Advice', icon: TrendingUp },
    { id: 'resonance_path', label: 'ResonancePath', icon: TrendingUp },
  ];

  if (selectedPost) {
    return (
      <DiscussionThread
        postId={selectedPost}
        onBack={() => setSelectedPost(null)}
        user={user}
      />
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-3" style={{ color: 'hsl(var(--text-heading))', fontFamily: 'var(--font-heading)', letterSpacing: '0.03em' }}>Community</h1>
            <div className="h-px w-24 mb-3" style={{ background: 'linear-gradient(to right, hsl(var(--accent)), transparent)' }} />
            <p style={{ color: 'hsl(var(--text-muted))' }}>Connect, share experiences, and learn together</p>
          </div>
          {user && (
            <Button
              onClick={() => setShowCreatePost(true)}
              style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          )}
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                style={selectedCategory === cat.id ? 
                  { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' } : 
                  { borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
              >
                <Icon className="w-4 h-4 mr-2" />
                {cat.label}
              </Button>
            );
          })}
        </div>

        {/* Posts List */}
        <div className="space-y-3">
          {isLoading ? (
            <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <CardContent className="py-12 text-center" style={{ color: 'hsl(var(--text-muted))' }}>
                Loading discussions...
              </CardContent>
            </Card>
          ) : posts.length === 0 ? (
            <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3" style={{ color: 'hsl(var(--text-subtle))' }} />
                <p style={{ color: 'hsl(var(--text-muted))' }}>No posts yet in this category</p>
                <p className="text-sm mt-1" style={{ color: 'hsl(var(--text-subtle))' }}>Be the first to start a discussion!</p>
              </CardContent>
            </Card>
          ) : (
            posts.map(post => (
              <Card
                key={post.id}
                className="hover:shadow-md transition-all cursor-pointer"
                style={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  borderColor: 'hsl(var(--border) / 0.5)',
                  borderRadius: '1rem',
                  padding: '1.25rem'
                }}
                onClick={() => setSelectedPost(post.id)}
              >
                <CardContent className="p-0">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, hsl(var(--accent) / 0.3), hsl(var(--muted)))' }}>
                        <span className="text-sm font-medium" style={{ color: 'hsl(var(--accent))' }}>
                          {post.created_by?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-medium transition-colors" style={{ color: 'hsl(var(--foreground))' }}>
                          {post.title}
                        </h3>
                        <Badge variant="outline" className="text-xs" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--text-muted))' }}>
                          {post.category}
                        </Badge>
                      </div>
                      <p className="text-sm line-clamp-2 mb-3" style={{ color: 'hsl(var(--text-muted))' }}>
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs" style={{ color: 'hsl(var(--text-subtle))' }}>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {post.created_by?.split('@')[0]}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(post.created_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {post.upvotes || 0} upvotes
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        user={user}
      />
    </div>
  );
}
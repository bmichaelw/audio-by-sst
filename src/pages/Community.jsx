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
    <div className="min-h-screen bg-stone-950 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Community</h1>
            <p className="text-stone-400">Connect, share experiences, and learn together</p>
          </div>
          {user && (
            <Button
              onClick={() => setShowCreatePost(true)}
              className="bg-amber-600 hover:bg-amber-500"
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
                className={cn(
                  selectedCategory === cat.id
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'border-stone-700 text-stone-300 hover:bg-stone-800'
                )}
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
            <Card className="bg-stone-900 border-stone-800">
              <CardContent className="py-12 text-center text-stone-400">
                Loading discussions...
              </CardContent>
            </Card>
          ) : posts.length === 0 ? (
            <Card className="bg-stone-900 border-stone-800">
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-12 h-12 text-stone-600 mx-auto mb-3" />
                <p className="text-stone-400">No posts yet in this category</p>
                <p className="text-stone-500 text-sm mt-1">Be the first to start a discussion!</p>
              </CardContent>
            </Card>
          ) : (
            posts.map(post => (
              <Card
                key={post.id}
                className="bg-stone-900 border-stone-800 hover:bg-stone-900/80 transition-all cursor-pointer"
                onClick={() => setSelectedPost(post.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600/20 to-stone-800 flex items-center justify-center">
                        <span className="text-amber-500 text-sm font-medium">
                          {post.created_by?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-white font-medium hover:text-amber-500 transition-colors">
                          {post.title}
                        </h3>
                        <Badge variant="outline" className="border-stone-700 text-stone-400 text-xs">
                          {post.category}
                        </Badge>
                      </div>
                      <p className="text-stone-400 text-sm line-clamp-2 mb-3">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 text-stone-500 text-xs">
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
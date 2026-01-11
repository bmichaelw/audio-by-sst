import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, Clock, MessageSquare, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DiscussionThread({ postId, onBack, user }) {
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');

  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ['discussion-post', postId],
    queryFn: () => base44.entities.DiscussionPost.filter({ id: postId }).then(posts => posts[0]),
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['discussion-comments', postId],
    queryFn: () => base44.entities.DiscussionComment.filter({ post_id: postId }, 'created_date'),
  });

  const createCommentMutation = useMutation({
    mutationFn: (content) => base44.entities.DiscussionComment.create({
      post_id: postId,
      author_email: user.email,
      content,
      upvotes: 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussion-comments'] });
      setCommentText('');
      toast.success('Comment added!');
    },
  });

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    createCommentMutation.mutate(commentText);
  };

  if (postLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6"
          style={{ color: 'hsl(var(--text-muted))' }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to discussions
        </Button>

        {/* Post */}
        <Card className="mb-6" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(to bottom right, hsl(var(--accent) / 0.3), hsl(var(--muted)))' }}>
                <span className="font-medium" style={{ color: 'hsl(var(--accent))' }}>
                  {post?.created_by?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h1 className="text-2xl font-medium mb-1" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading))' }}>{post?.title}</h1>
                    <div className="flex items-center gap-3 text-sm" style={{ color: 'hsl(var(--text-subtle))' }}>
                      <span>{post?.created_by?.split('@')[0]}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(post?.created_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--text-muted))' }}>
                    {post?.category}
                  </Badge>
                </div>
              </div>
            </div>
            <p className="whitespace-pre-wrap leading-relaxed" style={{ color: 'hsl(var(--text-body))' }}>
              {post?.content}
            </p>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t" style={{ borderColor: 'hsl(var(--divider))' }}>
              <Button variant="ghost" size="sm" style={{ color: 'hsl(var(--text-muted))' }}>
                <TrendingUp className="w-4 h-4 mr-1" />
                {post?.upvotes || 0} upvotes
              </Button>
              <Button variant="ghost" size="sm" style={{ color: 'hsl(var(--text-muted))' }}>
                <MessageSquare className="w-4 h-4 mr-1" />
                {comments.length} comments
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Comments */}
        <div className="space-y-4">
          <h2 className="text-xl font-medium" style={{ color: 'hsl(var(--foreground))' }}>
            Comments ({comments.length})
          </h2>

          {user && (
            <Card style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <CardContent className="p-4">
                <form onSubmit={handleSubmitComment} className="space-y-3">
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="resize-none"
                    style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))' }}
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={!commentText.trim() || createCommentMutation.isPending}
                      style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                    >
                      {createCommentMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Comment
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {comments.map(comment => (
            <Card key={comment.id} style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(to bottom right, hsl(var(--accent) / 0.3), hsl(var(--muted)))' }}>
                    <span className="text-sm" style={{ color: 'hsl(var(--accent))' }}>
                      {comment.created_by?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                        {comment.created_by?.split('@')[0]}
                      </span>
                      <span className="text-xs" style={{ color: 'hsl(var(--text-subtle))' }}>
                        {new Date(comment.created_date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: 'hsl(var(--text-body))' }}>
                      {comment.content}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
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
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-stone-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to discussions
        </Button>

        {/* Post */}
        <Card className="bg-stone-900 border-stone-800 mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600/20 to-stone-800 flex items-center justify-center flex-shrink-0">
                <span className="text-amber-500 font-medium">
                  {post?.created_by?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h1 className="text-2xl font-medium text-white mb-1">{post?.title}</h1>
                    <div className="flex items-center gap-3 text-stone-500 text-sm">
                      <span>{post?.created_by?.split('@')[0]}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(post?.created_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-stone-700 text-stone-400">
                    {post?.category}
                  </Badge>
                </div>
              </div>
            </div>
            <p className="text-stone-300 whitespace-pre-wrap leading-relaxed">
              {post?.content}
            </p>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-stone-800">
              <Button variant="ghost" size="sm" className="text-stone-400 hover:text-amber-500">
                <TrendingUp className="w-4 h-4 mr-1" />
                {post?.upvotes || 0} upvotes
              </Button>
              <Button variant="ghost" size="sm" className="text-stone-400">
                <MessageSquare className="w-4 h-4 mr-1" />
                {comments.length} comments
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Comments */}
        <div className="space-y-4">
          <h2 className="text-xl font-medium text-white">
            Comments ({comments.length})
          </h2>

          {user && (
            <Card className="bg-stone-900 border-stone-800">
              <CardContent className="p-4">
                <form onSubmit={handleSubmitComment} className="space-y-3">
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="bg-stone-800 border-stone-700 resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={!commentText.trim() || createCommentMutation.isPending}
                      className="bg-amber-600 hover:bg-amber-500"
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
            <Card key={comment.id} className="bg-stone-900/50 border-stone-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600/20 to-stone-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-500 text-sm">
                      {comment.created_by?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white font-medium text-sm">
                        {comment.created_by?.split('@')[0]}
                      </span>
                      <span className="text-stone-500 text-xs">
                        {new Date(comment.created_date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-stone-300 text-sm whitespace-pre-wrap">
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
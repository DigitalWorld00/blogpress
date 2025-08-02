import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Heart, MessageCircle, Eye } from 'lucide-react';

interface PostEngagementProps {
  postId: string;
  viewCount: number;
  onViewCountUpdate?: (count: number) => void;
}

export function PostEngagement({ postId, viewCount, onViewCountUpdate }: PostEngagementProps) {
  const [likes, setLikes] = useState<number>(0);
  const [isLiked, setIsLiked] = useState(false);
  const [commentsCount, setCommentsCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchEngagementData();
    incrementViewCount();
  }, [postId]);

  const fetchEngagementData = async () => {
    try {
      // Fetch likes count using RPC function
      const { data: likesCount, error: likesError } = await supabase
        .rpc('count_post_likes', { post_id: postId });

      if (!likesError && likesCount !== null) {
        setLikes(likesCount);
      }

      // Check if current user liked the post
      if (user) {
        const { data: isLikedData, error: isLikedError } = await supabase
          .rpc('check_user_liked_post', { post_id: postId, user_id: user.id });

        if (!isLikedError && isLikedData !== null) {
          setIsLiked(isLikedData);
        }
      }

      // Fetch comments count
      const { count: commentsCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      setCommentsCount(commentsCount || 0);
    } catch (error) {
      console.error('Error fetching engagement data:', error);
      // Set default values on error
      setLikes(0);
      setCommentsCount(0);
    }
  };

  const incrementViewCount = async () => {
    try {
      // Use RPC function to increment view count
      await supabase.rpc('increment_post_views', { post_id: postId });
      if (onViewCountUpdate) {
        onViewCountUpdate(viewCount + 1);
      }
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to like posts.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (isLiked) {
        // Unlike the post using RPC function
        const { error } = await supabase.rpc('unlike_post', { 
          post_id: postId, 
          user_id: user.id 
        });

        if (error) throw error;
        setLikes(prev => prev - 1);
        setIsLiked(false);
      } else {
        // Like the post using RPC function
        const { error } = await supabase.rpc('like_post', { 
          post_id: postId, 
          user_id: user.id 
        });

        if (error) throw error;
        setLikes(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-6 text-sm text-muted-foreground">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLike}
        disabled={loading}
        className={isLiked ? "text-red-500 hover:text-red-600" : ""}
      >
        <Heart className={`h-4 w-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
        {likes}
      </Button>
      
      <div className="flex items-center">
        <MessageCircle className="h-4 w-4 mr-1" />
        {commentsCount}
      </div>
      
      <div className="flex items-center">
        <Eye className="h-4 w-4 mr-1" />
        {viewCount + 1}
      </div>
    </div>
  );
}
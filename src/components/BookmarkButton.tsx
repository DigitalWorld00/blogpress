import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface BookmarkButtonProps {
  postId: string;
  size?: "sm" | "default" | "lg";
}

export const BookmarkButton = ({ postId, size = "default" }: BookmarkButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: isBookmarked = false } = useQuery({
    queryKey: ['bookmark', postId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();
      return !!data;
    },
    enabled: !!user
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in');
      
      if (isBookmarked) {
        await supabase
          .from('bookmarks')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('bookmarks')
          .insert({ post_id: postId, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmark', postId, user?.id] });
      toast({
        title: isBookmarked ? "Bookmark removed" : "Post bookmarked",
        description: isBookmarked ? "Removed from your bookmarks" : "Added to your bookmarks",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive",
      });
    }
  });

  const handleBookmark = () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to bookmark posts",
        variant: "destructive",
      });
      return;
    }
    bookmarkMutation.mutate();
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleBookmark}
      disabled={bookmarkMutation.isPending}
      className="gap-1"
    >
      {isBookmarked ? (
        <BookmarkCheck className="h-4 w-4" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
      {size !== "sm" && (isBookmarked ? "Bookmarked" : "Bookmark")}
    </Button>
  );
};
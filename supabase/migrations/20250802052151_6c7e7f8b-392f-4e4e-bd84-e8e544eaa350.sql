-- Create RPC functions for post engagement

-- Function to count likes for a post
CREATE OR REPLACE FUNCTION public.count_post_likes(post_id UUID)
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM public.post_likes WHERE post_likes.post_id = $1;
$$;

-- Function to check if user liked a post
CREATE OR REPLACE FUNCTION public.check_user_liked_post(post_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.post_likes 
    WHERE post_likes.post_id = $1 AND post_likes.user_id = $2
  );
$$;

-- Function to like a post
CREATE OR REPLACE FUNCTION public.like_post(post_id UUID, user_id UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.post_likes (post_id, user_id) 
  VALUES ($1, $2)
  ON CONFLICT (user_id, post_id) DO NOTHING;
$$;

-- Function to unlike a post
CREATE OR REPLACE FUNCTION public.unlike_post(post_id UUID, user_id UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.post_likes 
  WHERE post_likes.post_id = $1 AND post_likes.user_id = $2;
$$;

-- Function to increment post views
CREATE OR REPLACE FUNCTION public.increment_post_views(post_id UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.blog_posts 
  SET view_count = COALESCE(view_count, 0) + 1 
  WHERE id = $1;
$$;
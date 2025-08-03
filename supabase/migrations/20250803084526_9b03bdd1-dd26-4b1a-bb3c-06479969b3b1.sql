-- Phase 5: Add categories, series, bookmarks, and advanced features

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create series table
CREATE TABLE public.series (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_image_url TEXT,
  author_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post_categories junction table
CREATE TABLE public.post_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  category_id UUID NOT NULL,
  UNIQUE(post_id, category_id)
);

-- Create bookmarks table
CREATE TABLE public.bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Create reading_lists table
CREATE TABLE public.reading_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reading_list_posts junction table
CREATE TABLE public.reading_list_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reading_list_id UUID NOT NULL,
  post_id UUID NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(reading_list_id, post_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'new_post', 'comment', 'like', 'follow'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_post_id UUID,
  related_user_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_follows table for following other users
CREATE TABLE public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Add new columns to existing tables
ALTER TABLE public.blog_posts 
ADD COLUMN series_id UUID,
ADD COLUMN series_order INTEGER,
ADD COLUMN meta_title TEXT,
ADD COLUMN meta_description TEXT,
ADD COLUMN canonical_url TEXT,
ADD COLUMN reading_time INTEGER DEFAULT 0,
ADD COLUMN is_featured BOOLEAN DEFAULT false,
ADD COLUMN scheduled_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS on all new tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_list_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Categories policies (public read, admin write)
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" 
ON public.categories FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Series policies
CREATE POLICY "Series are viewable by everyone" 
ON public.series FOR SELECT USING (true);

CREATE POLICY "Authors can create series" 
ON public.series FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own series" 
ON public.series FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own series" 
ON public.series FOR DELETE 
USING (auth.uid() = author_id);

-- Post categories policies
CREATE POLICY "Post categories are viewable by everyone" 
ON public.post_categories FOR SELECT USING (true);

CREATE POLICY "Authors can manage their post categories" 
ON public.post_categories FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.blog_posts 
  WHERE id = post_id AND author_id = auth.uid()
));

-- Bookmarks policies
CREATE POLICY "Users can view their own bookmarks" 
ON public.bookmarks FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookmarks" 
ON public.bookmarks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" 
ON public.bookmarks FOR DELETE 
USING (auth.uid() = user_id);

-- Reading lists policies
CREATE POLICY "Users can view their own reading lists and public ones" 
ON public.reading_lists FOR SELECT 
USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create their own reading lists" 
ON public.reading_lists FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading lists" 
ON public.reading_lists FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reading lists" 
ON public.reading_lists FOR DELETE 
USING (auth.uid() = user_id);

-- Reading list posts policies
CREATE POLICY "Users can view posts in accessible reading lists" 
ON public.reading_list_posts FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.reading_lists 
  WHERE id = reading_list_id 
  AND (user_id = auth.uid() OR is_public = true)
));

CREATE POLICY "Users can manage posts in their own reading lists" 
ON public.reading_list_posts FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.reading_lists 
  WHERE id = reading_list_id AND user_id = auth.uid()
));

-- Notifications policies
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- User follows policies
CREATE POLICY "User follows are viewable by everyone" 
ON public.user_follows FOR SELECT USING (true);

CREATE POLICY "Users can follow others" 
ON public.user_follows FOR INSERT 
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others" 
ON public.user_follows FOR DELETE 
USING (auth.uid() = follower_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_series_updated_at
  BEFORE UPDATE ON public.series
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reading_lists_updated_at
  BEFORE UPDATE ON public.reading_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate reading time
CREATE OR REPLACE FUNCTION public.calculate_reading_time(content TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  word_count INTEGER;
  reading_time INTEGER;
BEGIN
  -- Remove HTML tags and count words
  word_count := array_length(string_to_array(regexp_replace(content, '<[^>]*>', '', 'g'), ' '), 1);
  -- Average reading speed is 200 words per minute
  reading_time := CEIL(word_count::FLOAT / 200);
  -- Minimum 1 minute
  RETURN GREATEST(reading_time, 1);
END;
$$;

-- Create function for full-text search
CREATE OR REPLACE FUNCTION public.search_posts(search_query TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  excerpt TEXT,
  content TEXT,
  author_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER,
  rank REAL
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bp.id,
    bp.title,
    bp.excerpt,
    bp.content,
    bp.author_id,
    bp.created_at,
    bp.view_count,
    ts_rank(
      to_tsvector('english', bp.title || ' ' || COALESCE(bp.excerpt, '') || ' ' || bp.content),
      plainto_tsquery('english', search_query)
    ) as rank
  FROM public.blog_posts bp
  WHERE 
    bp.published = true
    AND to_tsvector('english', bp.title || ' ' || COALESCE(bp.excerpt, '') || ' ' || bp.content) 
        @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC, bp.created_at DESC;
END;
$$;

-- Insert some default categories
INSERT INTO public.categories (name, slug, description, color, icon) VALUES
('Technology', 'technology', 'Posts about technology and programming', '#3B82F6', 'Laptop'),
('Design', 'design', 'UI/UX design and creative content', '#8B5CF6', 'Palette'),
('Business', 'business', 'Business insights and entrepreneurship', '#10B981', 'TrendingUp'),
('Lifestyle', 'lifestyle', 'Personal development and lifestyle', '#F59E0B', 'Heart'),
('Tutorial', 'tutorial', 'Step-by-step guides and tutorials', '#EF4444', 'BookOpen');
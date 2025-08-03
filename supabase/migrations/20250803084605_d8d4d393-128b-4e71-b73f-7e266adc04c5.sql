-- Fix security warnings for functions

-- Fix calculate_reading_time function
CREATE OR REPLACE FUNCTION public.calculate_reading_time(content TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public'
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

-- Fix search_posts function
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
SECURITY DEFINER
SET search_path = 'public'
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
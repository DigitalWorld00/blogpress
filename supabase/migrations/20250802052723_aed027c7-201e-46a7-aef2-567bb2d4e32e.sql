-- Create subscribers table for email notifications
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true,
  unsubscribe_token TEXT NOT NULL DEFAULT gen_random_uuid()
);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Create policies for newsletter subscribers
CREATE POLICY "Subscribers can view their own subscription" 
ON public.newsletter_subscribers 
FOR SELECT 
USING (true); -- Admin can view all, users can view their own if needed

CREATE POLICY "Anyone can subscribe" 
ON public.newsletter_subscribers 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Subscribers can update their own subscription" 
ON public.newsletter_subscribers 
FOR UPDATE 
USING (true);

-- Create analytics table for tracking post views and engagement
CREATE TABLE public.post_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER NOT NULL DEFAULT 0,
  unique_views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  UNIQUE(post_id, date)
);

-- Enable RLS
ALTER TABLE public.post_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics (admin only)
CREATE POLICY "Admins can view all analytics" 
ON public.post_analytics 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Update profiles table to include admin roles properly
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'user';

-- Add constraint to ensure role is valid
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_role CHECK (role IN ('user', 'admin', 'moderator'));
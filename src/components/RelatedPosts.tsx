import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ArrowRight } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string | null;
  featured_image_url: string | null;
  created_at: string;
  tags: string[] | null;
}

interface FullBlogPost extends BlogPost {
  content: string;
  author_id: string;
  view_count: number;
  reading_time: number;
  is_featured: boolean;
  meta_title: string | null;
  meta_description: string | null;
  profiles: {
    display_name: string | null;
  };
}

interface RelatedPostsProps {
  currentPostId: string;
  currentPostTags: string[] | null;
  onPostSelect: (post: FullBlogPost) => void;
}

export function RelatedPosts({ currentPostId, currentPostTags, onPostSelect }: RelatedPostsProps) {
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRelatedPosts();
  }, [currentPostId, currentPostTags]);

  const fetchRelatedPosts = async () => {
    try {
      let query = supabase
        .from('blog_posts')
        .select('id, title, excerpt, featured_image_url, created_at, tags')
        .eq('published', true)
        .neq('id', currentPostId)
        .limit(6);

      const { data, error } = await query;
      if (error) throw error;

      if (!data) {
        setRelatedPosts([]);
        return;
      }

      // Score posts by tag similarity and recency
      const scoredPosts = data.map(post => {
        let score = 0;
        
        // Tag similarity scoring
        if (currentPostTags && post.tags) {
          const commonTags = currentPostTags.filter(tag => post.tags!.includes(tag));
          score += commonTags.length * 10; // 10 points per common tag
        }
        
        // Recency scoring (newer posts get higher scores)
        const daysSinceCreated = Math.floor(
          (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        score += Math.max(0, 30 - daysSinceCreated); // Up to 30 points for recency
        
        return { ...post, score };
      });

      // Sort by score and take top 3
      const topRelated = scoredPosts
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      setRelatedPosts(topRelated);
    } catch (error) {
      console.error('Error fetching related posts:', error);
      setRelatedPosts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Related Posts</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-32 bg-muted"></div>
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (relatedPosts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Related Posts</h3>
      <div className="grid gap-4 md:grid-cols-3">
        {relatedPosts.map((post) => (
          <Card key={post.id} className="hover:shadow-md transition-shadow cursor-pointer">
            {post.featured_image_url && (
               <div className="h-32 overflow-hidden">
                <img 
                  src={post.featured_image_url} 
                  alt={post.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                  onClick={() => {
                    const fullPost: FullBlogPost = {
                      ...post,
                      content: '',
                      author_id: '',
                      view_count: 0,
                      reading_time: 0,
                      is_featured: false,
                      meta_title: null,
                      meta_description: null,
                      profiles: { display_name: null }
                    };
                    onPostSelect(fullPost);
                  }}
                />
              </div>
            )}
            <CardHeader className="pb-2">
              <CardTitle 
                className="text-base line-clamp-2 hover:text-primary cursor-pointer"
                  onClick={() => {
                    // Convert and fetch full post data
                    const fullPost: FullBlogPost = {
                      ...post,
                      content: '', 
                      author_id: '',
                      view_count: 0,
                      reading_time: 0,
                      is_featured: false,
                      meta_title: null,
                      meta_description: null,
                      profiles: { display_name: null }
                    };
                    onPostSelect(fullPost);
                  }}
              >
                {post.title}
              </CardTitle>
              {post.excerpt && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {post.excerpt}
                </p>
              )}
              <div className="text-xs text-muted-foreground">
                {format(new Date(post.created_at), 'MMM dd, yyyy')}
              </div>
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {post.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {post.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{post.tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  // Convert BlogPost to FullBlogPost for compatibility
                  const fullPost: FullBlogPost = {
                    ...post,
                    content: '', // Will be fetched when selected
                    author_id: '',
                    view_count: 0,
                    reading_time: 0,
                    is_featured: false,
                    meta_title: null,
                    meta_description: null,
                    profiles: { display_name: null }
                  };
                  onPostSelect(fullPost);
                }}
                className="p-0 h-auto text-primary hover:text-primary-dark"
              >
                Read more
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
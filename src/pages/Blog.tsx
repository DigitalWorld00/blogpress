import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Comments } from '@/components/Comments';
import { TagFilter } from '@/components/TagFilter';
import { PostEngagement } from '@/components/PostEngagement';
import { SocialShare } from '@/components/SocialShare';
import { ReadingTime } from '@/components/ReadingTime';
import { RelatedPosts } from '@/components/RelatedPosts';
import { NewsletterSubscription } from '@/components/NewsletterSubscription';
import { SearchBar } from '@/components/SearchBar';
import { CategoryFilter } from '@/components/CategoryFilter';
import { BookmarkButton } from '@/components/BookmarkButton';
import { ReadingListManager } from '@/components/ReadingListManager';
import { NotificationCenter } from '@/components/NotificationCenter';
import { SEOHead } from '@/components/SEOHead';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { User, Grid, List } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  featured_image_url: string | null;
  created_at: string;
  author_id: string;
  tags: string[] | null;
  view_count: number;
  reading_time: number;
  is_featured: boolean;
  meta_title: string | null;
  meta_description: string | null;
  profiles: {
    display_name: string | null;
  };
}

export default function Blog() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [searchResults, setSearchResults] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [posts, searchQuery, selectedTags, selectedCategories, searchResults]);

  // Increment view count when viewing a post
  useEffect(() => {
    if (selectedPost) {
      const incrementViews = async () => {
        await supabase.rpc('increment_post_views', { post_id: selectedPost.id });
      };
      incrementViews();
    }
  }, [selectedPost?.id]);

  const fetchPosts = async () => {
    try {
      // First get blog posts
      const { data: postsData, error: postsError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Then get profiles for authors
      const authorIds = postsData?.map(post => post.author_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', authorIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const postsWithProfiles = postsData?.map(post => ({
        ...post,
        profiles: {
          display_name: profilesData?.find(profile => profile.user_id === post.author_id)?.display_name || null
        }
      })) || [];

      setPosts(postsWithProfiles);
      
      // Extract all unique tags
      const tags = new Set<string>();
      postsData?.forEach(post => {
        if (post.tags) {
          post.tags.forEach((tag: string) => tags.add(tag));
        }
      });
      setAllTags(Array.from(tags));
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPosts = () => {
    // Use search results if advanced search was used
    let filtered = searchResults.length > 0 ? searchResults : posts;

    // Filter by basic search query
    if (searchQuery.trim() && searchResults.length === 0) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.excerpt?.toLowerCase().includes(query) ||
        post.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(post =>
        post.tags && selectedTags.every(tag => post.tags.includes(tag))
      );
    }

    // Filter by selected categories
    if (selectedCategories.length > 0) {
      // This would require joining with post_categories table
      // For now, we'll implement a simpler version
      filtered = filtered.filter(post => {
        // You could implement category filtering here
        return true;
      });
    }

    setFilteredPosts(filtered);
  };

  const handleBasicSearch = (query: string) => {
    setSearchQuery(query);
    setSearchResults([]); // Clear advanced search results
  };

  const handleAdvancedSearch = (results: BlogPost[]) => {
    setSearchResults(results);
    setSearchQuery(''); // Clear basic search
  };

  const handleTagSelect = (tag: string) => {
    setSelectedTags([...selectedTags, tag]);
  };

  const handleTagRemove = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleClearAllTags = () => {
    setSelectedTags([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading posts...</p>
        </div>
      </div>
    );
  }

  if (selectedPost) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead
          title={selectedPost.meta_title || selectedPost.title}
          description={selectedPost.meta_description || selectedPost.excerpt || undefined}
          type="article"
          author={selectedPost.profiles?.display_name || undefined}
          publishedTime={selectedPost.created_at}
          tags={selectedPost.tags || undefined}
          image={selectedPost.featured_image_url || undefined}
        />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 flex items-center justify-between">
            <Button variant="outline" onClick={() => setSelectedPost(null)}>
              ← Back to Blog
            </Button>
            <div className="flex items-center gap-2">
              {user && <NotificationCenter />}
            </div>
          </div>
          
          <Card className="mb-8">
            {selectedPost.featured_image_url && (
              <div className="w-full h-64 overflow-hidden">
                <img 
                  src={selectedPost.featured_image_url} 
                  alt={selectedPost.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-3xl">{selectedPost.title}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span>
                  Published on {format(new Date(selectedPost.created_at), 'MMMM dd, yyyy')}
                </span>
                <span>•</span>
                <Link 
                  to={`/profile/${selectedPost.author_id}`}
                  className="flex items-center gap-1 hover:text-primary"
                >
                  <User className="h-4 w-4" />
                  {selectedPost.profiles?.display_name || 'Anonymous'}
                </Link>
                <span>•</span>
                <ReadingTime content={selectedPost.content} />
                <span>•</span>
                <span>{selectedPost.view_count} views</span>
              </div>
              {selectedPost.tags && selectedPost.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 mb-4">
                  {selectedPost.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-4 mb-4">
                <PostEngagement 
                  postId={selectedPost.id} 
                  viewCount={selectedPost.view_count}
                />
                <SocialShare 
                  title={selectedPost.title}
                  url={window.location.href}
                  excerpt={selectedPost.excerpt || undefined}
                />
                {user && (
                  <>
                    <BookmarkButton postId={selectedPost.id} />
                    <ReadingListManager postId={selectedPost.id} />
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none mb-8">
                <div 
                  className="text-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                />
              </div>
            </CardContent>
          </Card>

          <RelatedPosts 
            currentPostId={selectedPost.id}
            currentPostTags={selectedPost.tags}
            onPostSelect={setSelectedPost}
          />

          <Comments postId={selectedPost.id} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Blog - Modern Blog Platform"
        description="Discover amazing content on our modern blog platform with advanced features"
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-foreground">Blog</h1>
          <div className="flex items-center gap-4">
            {user && <NotificationCenter />}
            <Link to="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="space-y-6 mb-8">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <SearchBar
                onSearch={handleBasicSearch}
                onAdvancedSearch={handleAdvancedSearch}
                placeholder="Search posts..."
                showAdvanced={true}
              />
            </div>
            <div>
              <CategoryFilter
                selectedCategories={selectedCategories}
                onCategoryChange={setSelectedCategories}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div>
            <TagFilter
              availableTags={allTags}
              selectedTags={selectedTags}
              onTagSelect={handleTagSelect}
              onTagRemove={handleTagRemove}
              onClearAll={handleClearAllTags}
            />
          </div>
        </div>

        {posts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">No posts published yet.</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No posts found matching your search criteria.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTags([]);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-3">
              <div className={viewMode === 'grid' ? 'grid gap-6' : 'space-y-4'}>
                {filteredPosts.map((post) => (
                  <Card key={post.id} className={`hover:shadow-md transition-shadow ${post.is_featured ? 'border-primary' : ''}`}>
                    {post.is_featured && (
                      <div className="bg-primary text-primary-foreground px-3 py-1 text-xs font-medium">
                        Featured
                      </div>
                    )}
                    {post.featured_image_url && (
                      <div className={`w-full overflow-hidden ${viewMode === 'grid' ? 'h-48' : 'h-32 md:h-48'}`}>
                        <img 
                          src={post.featured_image_url} 
                          alt={post.title}
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => setSelectedPost(post)}
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle 
                        className="text-2xl hover:text-primary cursor-pointer transition-colors"
                        onClick={() => setSelectedPost(post)}
                      >
                        {post.title}
                      </CardTitle>
                      {post.excerpt && (
                        <p className="text-muted-foreground">{post.excerpt}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          Published on {format(new Date(post.created_at), 'MMMM dd, yyyy')}
                        </span>
                        <span>•</span>
                        <Link 
                          to={`/profile/${post.author_id}`}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          <User className="h-4 w-4" />
                          {post.profiles?.display_name || 'Anonymous'}
                        </Link>
                        <span>•</span>
                        <ReadingTime content={post.content} />
                        <span>•</span>
                        <span>{post.view_count} views</span>
                      </div>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {post.tags.slice(0, 5).map((tag) => (
                            <Badge 
                              key={tag} 
                              variant="secondary"
                              className="cursor-pointer hover:bg-accent transition-colors"
                              onClick={() => {
                                if (!selectedTags.includes(tag)) {
                                  setSelectedTags([...selectedTags, tag]);
                                }
                              }}
                            >
                              {tag}
                            </Badge>
                          ))}
                          {post.tags.length > 5 && (
                            <Badge variant="outline">
                              +{post.tags.length - 5} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none">
                        <p className="line-clamp-3 text-muted-foreground">
                          {post.content.replace(/<[^>]*>/g, '').slice(0, 200)}...
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <PostEngagement 
                            postId={post.id} 
                            viewCount={post.view_count}
                          />
                          {user && (
                            <>
                              <BookmarkButton postId={post.id} size="sm" />
                              <ReadingListManager postId={post.id} />
                            </>
                          )}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedPost(post)}
                        >
                          Read More
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <NewsletterSubscription />
            </div>
          </div>
        )}
      </div>
    </div>
);
}
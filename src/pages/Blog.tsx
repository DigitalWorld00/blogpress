import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Comments } from '@/components/Comments';
import { TagFilter } from '@/components/TagFilter';
import { PostEngagement } from '@/components/PostEngagement';
import { SocialShare } from '@/components/SocialShare';
import { ReadingTime } from '@/components/ReadingTime';
import { RelatedPosts } from '@/components/RelatedPosts';
import { format } from 'date-fns';
import { Search, User } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  featured_image_url: string | null;
  created_at: string;
  author_id: string;
  tags: string[] | null;
  profiles: {
    display_name: string | null;
  };
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [posts, searchQuery, selectedTags]);

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
    let filtered = posts;

    // Filter by search query
    if (searchQuery.trim()) {
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

    setFilteredPosts(filtered);
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
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button variant="outline" onClick={() => setSelectedPost(null)}>
              ← Back to Blog
            </Button>
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
                  viewCount={0}
                />
                <SocialShare 
                  title={selectedPost.title}
                  url={window.location.href}
                  excerpt={selectedPost.excerpt || undefined}
                />
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-foreground">Blog</h1>
          <Link to="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>

        {/* Search and Filter Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
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
          <div className="grid gap-6">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                {post.featured_image_url && (
                  <div className="w-full h-48 overflow-hidden">
                    <img 
                      src={post.featured_image_url} 
                      alt={post.title}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setSelectedPost(post)}
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle 
                    className="text-2xl hover:text-primary cursor-pointer"
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
                  </div>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {post.tags.slice(0, 5).map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="secondary"
                          className="cursor-pointer hover:bg-accent"
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
                    <PostEngagement 
                      postId={post.id} 
                      viewCount={0}
                    />
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
        )}
      </div>
    </div>
  );
}
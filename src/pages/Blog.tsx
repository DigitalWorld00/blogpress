import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Search, User } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  created_at: string;
  tags: string[];
  profiles: {
    display_name: string;
  } | null;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    const filtered = posts.filter(post =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredPosts(filtered);
  }, [posts, searchTerm]);

  const fetchPosts = async () => {
    try {
      // First get the blog posts
      const { data: postsData, error: postsError } = await supabase
        .from('blog_posts')
        .select('id, title, excerpt, content, created_at, tags, author_id')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Then get the author profiles
      const authorIds = postsData?.map(post => post.author_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', authorIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const postsWithProfiles = postsData?.map(post => ({
        ...post,
        profiles: profilesData?.find(profile => profile.user_id === post.author_id) || null
      })) || [];

      setPosts(postsWithProfiles);
    } catch (error: any) {
      toast({
        title: "Error fetching posts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const readingTime = (content: string) => {
    const words = content.split(' ').length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold cursor-pointer" onClick={() => navigate('/')}>
              📝 BlogPress
            </h1>
            <Badge variant="secondary">Blog</Badge>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <Button onClick={() => navigate('/dashboard')} variant="outline">
                Dashboard
              </Button>
            ) : (
              <Button onClick={() => navigate('/auth')} variant="outline">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Welcome to BlogPress</h2>
            <p className="text-xl text-muted-foreground">
              Discover amazing stories and insights from our community
            </p>
          </div>

          <div className="mb-8">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <h3 className="text-xl font-semibold mb-2">
                  {searchTerm ? 'No posts found' : 'No posts available'}
                </h3>
                <p className="text-muted-foreground text-center">
                  {searchTerm 
                    ? 'Try adjusting your search terms' 
                    : 'Be the first to create a blog post!'
                  }
                </p>
                {!user && (
                  <Button onClick={() => navigate('/auth')} className="mt-4">
                    Sign up to start blogging
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-8">
              {filteredPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader onClick={() => navigate(`/post/${post.id}`)}>
                    <CardTitle className="text-2xl hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {post.excerpt || post.content.substring(0, 150) + '...'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{post.profiles?.display_name || 'Anonymous'}</span>
                        </div>
                        <span>•</span>
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{readingTime(post.content)}</span>
                      </div>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex space-x-2">
                          {post.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
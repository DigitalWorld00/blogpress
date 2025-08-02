import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { 
  ArrowLeft, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  Trash2, 
  Eye,
  Search,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';

interface BlogPost {
  id: string;
  title: string;
  published: boolean;
  created_at: string;
  view_count: number;
  author_id: string;
  profiles: {
    display_name: string | null;
  };
}

interface User {
  id: string;
  email: string;
  created_at: string;
  profiles: {
    display_name: string | null;
    role: string;
  };
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'posts' | 'users' | 'subscribers'>('analytics');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    checkAdminAccess();
  }, [user, navigate]);

  const checkAdminAccess = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user?.id)
        .single();

      if (profile?.role !== 'admin') {
        toast({
          title: "Access denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }

      await fetchData();
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/dashboard');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all posts with author info (simplified due to type issues)
      const { data: postsData } = await supabase
        .from('blog_posts')
        .select('id, title, published, created_at, view_count, author_id')
        .order('created_at', { ascending: false });

      // Convert to the expected format
      const postsWithProfiles = postsData?.map(post => ({
        ...post,
        profiles: { display_name: null } // Will be fetched separately if needed
      })) || [];

      setPosts(postsWithProfiles);

      // Fetch subscribers
      const { data: subscribersData } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });

      setSubscribers(subscribersData || []);

      // Note: Can't fetch auth.users directly, so we'll show profiles instead
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Convert profiles to user format
      const usersFromProfiles = profilesData?.map(profile => ({
        id: profile.user_id,
        email: 'N/A', // Can't access email from profiles
        created_at: profile.created_at,
        profiles: {
          display_name: profile.display_name,
          role: profile.role
        }
      })) || [];

      setUsers(usersFromProfiles);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts(posts.filter(post => post.id !== postId));
      toast({
        title: "Post deleted",
        description: "The post has been successfully deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleTogglePostStatus = async (postId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ published: !currentStatus })
        .eq('id', postId);

      if (error) throw error;

      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, published: !currentStatus }
          : post
      ));

      toast({
        title: currentStatus ? "Post unpublished" : "Post published",
        description: `The post has been ${currentStatus ? 'unpublished' : 'published'}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    (user.profiles?.display_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubscribers = subscribers.filter(subscriber =>
    subscriber.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 border-b">
          {[
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'posts', label: 'Posts', icon: FileText },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'subscribers', label: 'Subscribers', icon: Users }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                onClick={() => setActiveTab(tab.id as any)}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'analytics' && <AnalyticsDashboard />}

        {activeTab === 'posts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Manage Posts</h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {filteredPosts.map((post) => (
                <Card key={post.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {post.title}
                          <Badge variant={post.published ? 'default' : 'secondary'}>
                            {post.published ? 'Published' : 'Draft'}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          By {post.profiles?.display_name || 'Anonymous'} • 
                          {format(new Date(post.created_at), 'MMM dd, yyyy')} • 
                          <Eye className="h-3 w-3 inline mx-1" />
                          {post.view_count || 0} views
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTogglePostStatus(post.id, post.published)}
                        >
                          {post.published ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Manage Users</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>

            <div className="grid gap-4">
              {filteredUsers.map((user) => (
                <Card key={user.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{user.profiles?.display_name || 'Anonymous User'}</CardTitle>
                        <CardDescription>
                          Joined {format(new Date(user.created_at), 'MMM dd, yyyy')}
                        </CardDescription>
                      </div>
                      <Badge variant={user.profiles?.role === 'admin' ? 'default' : 'secondary'}>
                        {user.profiles?.role || 'user'}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'subscribers' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Newsletter Subscribers</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search subscribers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>

            <div className="grid gap-4">
              {filteredSubscribers.map((subscriber) => (
                <Card key={subscriber.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{subscriber.email}</CardTitle>
                        <CardDescription>
                          Subscribed {format(new Date(subscriber.subscribed_at), 'MMM dd, yyyy')}
                        </CardDescription>
                      </div>
                      <Badge variant={subscriber.active ? 'default' : 'secondary'}>
                        {subscriber.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
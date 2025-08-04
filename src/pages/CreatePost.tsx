import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TagInput } from '@/components/TagInput';
import { ImageUpload } from '@/components/ImageUpload';
import { RichTextEditor } from '@/components/RichTextEditor';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Eye } from 'lucide-react';

export default function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [published, setPublished] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with:', { title, content, published, user: user?.id });
    
    if (!user) {
      console.log('No user found, authentication required');
      toast({
        title: "Authentication required",
        description: "Please log in to create a post.",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim() || !content.trim()) {
      console.log('Missing required fields:', { title: title.trim(), content: content.trim() });
      toast({
        title: "Missing required fields",
        description: "Please fill in the title and content fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    console.log('Starting to insert post...');
    
    try {
      const postData = {
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt?.trim() || null,
        featured_image_url: featuredImage || null,
        published,
        tags: tags.length > 0 ? tags : null,
        author_id: user.id,
      };
      
      console.log('Inserting post data:', postData);
      
      const { data, error } = await supabase
        .from('blog_posts')
        .insert(postData)
        .select()
        .single();

      console.log('Supabase response:', { data, error });

      if (error) throw error;

      toast({
        title: "Post created successfully",
        description: published ? "Your post is now live!" : "Your draft has been saved.",
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: "Error creating post",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold">Create New Post</h1>
          </div>
          <Button onClick={() => navigate('/blog')} variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            View Blog
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Write Your Blog Post</CardTitle>
            <CardDescription>
              Create engaging content for your readers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter your post title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  placeholder="Brief description of your post..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <TagInput 
                  tags={tags} 
                  onTagsChange={setTags}
                  placeholder="Add tags to categorize your post..."
                />
                <p className="text-xs text-muted-foreground">
                  Press Enter or click Add to add tags. Use tags to help readers find your content.
                </p>
              </div>

              <ImageUpload
                onImageUploaded={setFeaturedImage}
                currentImage={featuredImage}
                userId={user?.id || ''}
              />

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Write your blog post content here..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={published}
                  onCheckedChange={setPublished}
                />
                <Label htmlFor="published">
                  Publish immediately
                </Label>
              </div>

              <div className="flex space-x-4">
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : published ? 'Publish Post' : 'Save Draft'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/dashboard')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
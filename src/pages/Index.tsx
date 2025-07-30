import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { BookOpen, Edit, Users, Zap } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: <Edit className="h-8 w-8" />,
      title: "Create & Edit",
      description: "Write beautiful blog posts with our intuitive editor"
    },
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: "Read & Discover",
      description: "Explore amazing content from our community"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Comment & Engage",
      description: "Connect with readers through comments and discussions"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Fast & Modern",
      description: "Built with the latest technologies for optimal performance"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              📝 BlogPress
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              A modern, fullstack blogging platform built with React, Tailwind CSS, and Supabase
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Button size="lg" onClick={() => navigate('/dashboard')}>
                    Go to Dashboard
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/blog')}>
                    Explore Blog
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" onClick={() => navigate('/auth')}>
                    Get Started
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/blog')}>
                    Explore Blog
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to create and share amazing content
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 text-primary w-fit">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary/5 border-t">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Blogging?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join our community of writers and share your stories with the world
          </p>
          {!user && (
            <Button size="lg" onClick={() => navigate('/auth')}>
              Sign Up Today
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;

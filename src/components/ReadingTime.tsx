import { Clock } from 'lucide-react';

interface ReadingTimeProps {
  content: string;
}

export function ReadingTime({ content }: ReadingTimeProps) {
  const calculateReadingTime = (text: string): number => {
    // Remove HTML tags and count words
    const plainText = text.replace(/<[^>]*>/g, '');
    const words = plainText.trim().split(/\s+/).length;
    
    // Average reading speed is 200-250 words per minute
    // We'll use 225 words per minute as our baseline
    const wordsPerMinute = 225;
    const minutes = Math.ceil(words / wordsPerMinute);
    
    return Math.max(1, minutes); // Minimum 1 minute
  };

  const readingTime = calculateReadingTime(content);

  return (
    <div className="flex items-center text-sm text-muted-foreground">
      <Clock className="h-4 w-4 mr-1" />
      {readingTime} min read
    </div>
  );
}
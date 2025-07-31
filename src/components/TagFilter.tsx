import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface TagFilterProps {
  availableTags: string[];
  selectedTags: string[];
  onTagSelect: (tag: string) => void;
  onTagRemove: (tag: string) => void;
  onClearAll: () => void;
}

export function TagFilter({ 
  availableTags, 
  selectedTags, 
  onTagSelect, 
  onTagRemove, 
  onClearAll 
}: TagFilterProps) {
  if (availableTags.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Filter by Tags</h3>
        {selectedTags.length > 0 && (
          <Button variant="outline" size="sm" onClick={onClearAll}>
            Clear All
          </Button>
        )}
      </div>
      
      {selectedTags.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Active filters:</p>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="default" className="gap-1">
                {tag}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 hover:bg-transparent text-primary-foreground"
                  onClick={() => onTagRemove(tag)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Available tags:</p>
        <div className="flex flex-wrap gap-2">
          {availableTags
            .filter(tag => !selectedTags.includes(tag))
            .map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="cursor-pointer hover:bg-accent"
                onClick={() => onTagSelect(tag)}
              >
                {tag}
              </Badge>
            ))}
        </div>
      </div>
    </div>
  );
}
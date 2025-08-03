import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface CategoryFilterProps {
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
}

export const CategoryFilter = ({ selectedCategories, onCategoryChange }: CategoryFilterProps) => {
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      return data as Category[];
    }
  });

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoryChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      onCategoryChange([...selectedCategories, categoryId]);
    }
  };

  const clearCategories = () => {
    onCategoryChange([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Categories</h3>
        {selectedCategories.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearCategories}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category.id);
          return (
            <Badge
              key={category.id}
              variant={isSelected ? "default" : "outline"}
              className="cursor-pointer hover:scale-105 transition-transform"
              style={isSelected ? { backgroundColor: category.color } : {}}
              onClick={() => toggleCategory(category.id)}
            >
              {category.name}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};
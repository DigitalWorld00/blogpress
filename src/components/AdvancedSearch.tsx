import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, X, Calendar, User, Tag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AdvancedSearchProps {
  onSearch: (results: any[]) => void;
  isLoading: boolean;
}

export const AdvancedSearch = ({ onSearch, isLoading }: AdvancedSearchProps) => {
  const [query, setQuery] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [dateRange, setDateRange] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      return data || [];
    }
  });

  const { data: authors = [] } = useQuery({
    queryKey: ['authors'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .not('display_name', 'is', null)
        .order('display_name');
      return data || [];
    }
  });

  const handleSearch = async () => {
    if (!query.trim()) return;

    const { data } = await supabase.rpc('search_posts', {
      search_query: query
    });

    let results = data || [];

    // Apply additional filters
    if (selectedAuthor) {
      results = results.filter((post: any) => post.author_id === selectedAuthor);
    }

    if (selectedCategory) {
      const { data: categoryPosts } = await supabase
        .from('post_categories')
        .select('post_id')
        .eq('category_id', selectedCategory);
      
      const categoryPostIds = categoryPosts?.map(cp => cp.post_id) || [];
      results = results.filter((post: any) => categoryPostIds.includes(post.id));
    }

    if (dateRange) {
      const now = new Date();
      let startDate = new Date();
      
      switch (dateRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      results = results.filter((post: any) => 
        new Date(post.created_at) >= startDate
      );
    }

    onSearch(results);
  };

  const clearFilters = () => {
    setQuery("");
    setSelectedAuthor("");
    setSelectedCategory("");
    setDateRange("");
    onSearch([]);
  };

  const hasFilters = selectedAuthor || selectedCategory || dateRange;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Search posts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isLoading || !query.trim()}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Author Filter */}
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-1">
                <User className="h-4 w-4" />
                Author
              </label>
              <select
                className="w-full p-2 border rounded-md"
                value={selectedAuthor}
                onChange={(e) => setSelectedAuthor(e.target.value)}
              >
                <option value="">All authors</option>
                {authors.map((author) => (
                  <option key={author.user_id} value={author.user_id}>
                    {author.display_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-1">
                <Tag className="h-4 w-4" />
                Category
              </label>
              <select
                className="w-full p-2 border rounded-md"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Date Range
              </label>
              <select
                className="w-full p-2 border rounded-md"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="">All time</option>
                <option value="week">Past week</option>
                <option value="month">Past month</option>
                <option value="year">Past year</option>
              </select>
            </div>
          </div>

          {/* Active Filters */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {selectedAuthor && (
                <Badge variant="secondary" className="gap-1">
                  Author: {authors.find(a => a.user_id === selectedAuthor)?.display_name}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setSelectedAuthor("")} 
                  />
                </Badge>
              )}
              {selectedCategory && (
                <Badge variant="secondary" className="gap-1">
                  Category: {categories.find((c: any) => c.id === selectedCategory)?.name}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setSelectedCategory("")} 
                  />
                </Badge>
              )}
              {dateRange && (
                <Badge variant="secondary" className="gap-1">
                  {dateRange === 'week' ? 'Past week' : 
                   dateRange === 'month' ? 'Past month' : 'Past year'}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setDateRange("")} 
                  />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
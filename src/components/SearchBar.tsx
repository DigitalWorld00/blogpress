import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";
import { AdvancedSearch } from "./AdvancedSearch";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onAdvancedSearch?: (results: any[]) => void;
  placeholder?: string;
  className?: string;
  showAdvanced?: boolean;
}

export function SearchBar({ 
  onSearch, 
  onAdvancedSearch,
  placeholder = "Search posts...", 
  className,
  showAdvanced = true 
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const clearSearch = () => {
    setQuery('');
    onSearch('');
  };

  const handleAdvancedSearch = async (results: any[]) => {
    setIsLoading(true);
    try {
      onAdvancedSearch?.(results);
      setIsAdvancedOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <form onSubmit={handleSubmit} className="relative flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </form>
      
      {showAdvanced && (
        <Dialog open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <AdvancedSearch onSearch={handleAdvancedSearch} isLoading={isLoading} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
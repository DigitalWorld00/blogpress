import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListPlus, BookOpen, Lock, Globe, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ReadingList {
  id: string;
  name: string;
  description: string;
  is_public: boolean;
  created_at: string;
  reading_list_posts: { post_id: string }[];
}

interface ReadingListManagerProps {
  postId?: string;
}

export const ReadingListManager = ({ postId }: ReadingListManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const { data: readingLists = [] } = useQuery({
    queryKey: ['reading-lists', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get reading lists
      const { data: lists } = await supabase
        .from('reading_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!lists) return [];

      // Get posts for each list
      const listsWithPosts = await Promise.all(
        lists.map(async (list) => {
          const { data: posts } = await supabase
            .from('reading_list_posts')
            .select('post_id')
            .eq('reading_list_id', list.id);
          
          return {
            ...list,
            reading_list_posts: posts || []
          };
        })
      );

      return listsWithPosts as ReadingList[];
    },
    enabled: !!user
  });

  const createListMutation = useMutation({
    mutationFn: async (listData: { name: string; description: string; is_public: boolean }) => {
      if (!user) throw new Error('Must be logged in');
      
      const { data, error } = await supabase
        .from('reading_lists')
        .insert({
          ...listData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-lists', user?.id] });
      setNewListName("");
      setNewListDescription("");
      setIsPublic(false);
      toast({
        title: "Reading list created",
        description: "Your new reading list has been created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create reading list",
        variant: "destructive",
      });
    }
  });

  const addToListMutation = useMutation({
    mutationFn: async ({ listId, postId }: { listId: string; postId: string }) => {
      const { error } = await supabase
        .from('reading_list_posts')
        .insert({
          reading_list_id: listId,
          post_id: postId
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-lists', user?.id] });
      toast({
        title: "Added to reading list",
        description: "Post has been added to your reading list",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add post to reading list",
        variant: "destructive",
      });
    }
  });

  const removeFromListMutation = useMutation({
    mutationFn: async ({ listId, postId }: { listId: string; postId: string }) => {
      const { error } = await supabase
        .from('reading_list_posts')
        .delete()
        .eq('reading_list_id', listId)
        .eq('post_id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-lists', user?.id] });
      toast({
        title: "Removed from reading list",
        description: "Post has been removed from your reading list",
      });
    }
  });

  const deleteListMutation = useMutation({
    mutationFn: async (listId: string) => {
      const { error } = await supabase
        .from('reading_lists')
        .delete()
        .eq('id', listId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-lists', user?.id] });
      toast({
        title: "Reading list deleted",
        description: "Your reading list has been deleted",
      });
    }
  });

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    
    createListMutation.mutate({
      name: newListName,
      description: newListDescription,
      is_public: isPublic
    });
  };

  const isPostInList = (list: ReadingList, postId: string) => {
    return list.reading_list_posts.some(p => p.post_id === postId);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ListPlus className="h-4 w-4 mr-1" />
          Reading Lists
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Reading Lists</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create New Reading List</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="listName">Name</Label>
                <Input
                  id="listName"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Reading list name"
                />
              </div>
              <div>
                <Label htmlFor="listDescription">Description</Label>
                <Textarea
                  id="listDescription"
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  placeholder="Optional description"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label htmlFor="isPublic">Make this list public</Label>
              </div>
              <Button 
                onClick={handleCreateList}
                disabled={!newListName.trim() || createListMutation.isPending}
              >
                Create List
              </Button>
            </CardContent>
          </Card>

          {/* Existing Lists */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Your Reading Lists</h3>
            {readingLists.length === 0 ? (
              <p className="text-muted-foreground">No reading lists yet. Create your first one above!</p>
            ) : (
              <div className="space-y-3">
                {readingLists.map((list) => (
                  <Card key={list.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="h-4 w-4" />
                            <h4 className="font-medium">{list.name}</h4>
                            {list.is_public ? (
                              <Badge variant="secondary" className="gap-1">
                                <Globe className="h-3 w-3" />
                                Public
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1">
                                <Lock className="h-3 w-3" />
                                Private
                              </Badge>
                            )}
                          </div>
                          {list.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {list.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {list.reading_list_posts.length} posts
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {postId && (
                            <Button
                              size="sm"
                              variant={isPostInList(list, postId) ? "destructive" : "default"}
                              onClick={() => {
                                if (isPostInList(list, postId)) {
                                  removeFromListMutation.mutate({ listId: list.id, postId });
                                } else {
                                  addToListMutation.mutate({ listId: list.id, postId });
                                }
                              }}
                            >
                              {isPostInList(list, postId) ? "Remove" : "Add"}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteListMutation.mutate(list.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

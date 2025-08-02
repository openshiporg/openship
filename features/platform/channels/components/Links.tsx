"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Edit2,
  Plus,
  Trash2,
  CircleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { 
  getShops, 
  getChannelLinks, 
  createChannelLink, 
  deleteChannelLink 
} from "../actions/links";

interface Link {
  id: string;
  shop: {
    id: string;
    name: string;
  };
  filters: any;
  createdAt: string;
}

interface Shop {
  id: string;
  name: string;
}

export const CreateLinkButton = ({ channelId, refetch }: {
  channelId: string;
  refetch: () => void;
}) => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadShops = async () => {
      const response = await getShops();
      if (response.success && response.data) {
        setShops(response.data.shops);
      }
    };
    loadShops();
  }, []);

  const handleCreate = async () => {
    if (!selectedShopId) return;

    setIsCreating(true);
    try {
      const response = await createChannelLink(channelId, selectedShopId);
      if (response.success) {
        toast({
          title: "Link Created",
          description: "Successfully created shop link",
        });
        setIsOpen(false);
        setSelectedShopId("");
        refetch();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to create link",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create link",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus className="h-3 w-3" />
          Add Link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Link</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Shop</label>
            <Select value={selectedShopId} onValueChange={setSelectedShopId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a shop..." />
              </SelectTrigger>
              <SelectContent>
                {shops.map((shop) => (
                  <SelectItem key={shop.id} value={shop.id}>
                    {shop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={!selectedShopId || isCreating}
            >
              {isCreating ? "Creating..." : "Create Link"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export function Links({ channelId }: { channelId: string }) {
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadLinks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await getChannelLinks(channelId);
      if (response.success && response.data) {
        setLinks(response.data.links);
      } else {
        setError(response.error || "Failed to load links");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load links");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, [channelId]);

  const handleDelete = async (linkId: string) => {
    try {
      const response = await deleteChannelLink(linkId);
      if (response.success) {
        toast({
          title: "Link Deleted",
          description: "Successfully deleted link",
        });
        loadLinks();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete link",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete link",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 text-red-600">
        <CircleAlert className="h-4 w-4" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Shop Links</h4>
        <CreateLinkButton channelId={channelId} refetch={loadLinks} />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : links.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No shop links configured.</p>
          <p className="text-xs mt-1">
            Links connect shops to this channel for order processing.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {links.map((link) => (
            <div
              key={link.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-medium text-sm">{link.shop.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Created {new Date(link.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {Object.keys(link.filters || {}).length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Filtered
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    // TODO: Implement filter editing
                    toast({
                      title: "Coming Soon",
                      description: "Filter editing will be available soon",
                    });
                  }}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  onClick={() => handleDelete(link.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
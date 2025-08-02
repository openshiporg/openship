'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  Edit,
  Edit2,
  ListFilter,
  Plus,
  Trash2,
  X,
  ChevronDown,
  Pencil,
  CircleAlert,
  GripVertical,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ReactSortable } from "react-sortablejs";
import { cn } from "@/lib/utils";

interface LinkFilter {
  field: string;
  type: string;
  value: string;
}

interface Link {
  id: string;
  channel: {
    id: string;
    name: string;
  };
  filters: LinkFilter[];
  rank?: number;
  createdAt: string;
}

interface Channel {
  id: string;
  name: string;
}

interface SortableLink extends Link {
  chosen?: boolean;
  selected?: boolean;
}

// Create Link Button Component
export const CreateLinkButton = ({ shopId, refetch }: {
  shopId: string;
  refetch: () => void;
}) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const loadChannels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetChannels {
              channels(take: 50) {
                id
                name
              }
            }
          `
        })
      });
      
      const data = await response.json();
      if (data.data?.channels) {
        setChannels(data.data.channels);
      } else {
        setError('Failed to load channels');
      }
    } catch (err: any) {
      console.error('Failed to load channels:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  const handleCreateLink = async (channelId: string) => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation CreateLink($data: LinkCreateInput!) {
              createLink(data: $data) {
                id
                channel {
                  id
                  name
                }
                filters
                rank
              }
            }
          `,
          variables: {
            data: {
              shop: { connect: { id: shopId } },
              channel: { connect: { id: channelId } },
              filters: {},
              rank: 1
            }
          }
        })
      });
      
      const data = await response.json();
      if (data.data?.createLink) {
        toast({
          title: "Link Created",
          description: "Successfully created channel link",
        });
        refetch();
      } else {
        throw new Error(data.errors?.[0]?.message || 'Failed to create link');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create link",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return <Button disabled size="sm">Loading...</Button>;
  }

  if (error) {
    return (
      <div className="text-red-600 text-xs">
        Error: {error}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1" disabled={isCreating}>
          <Plus className="h-3 w-3" />
          {isCreating ? "Creating..." : "Add Link"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Select Channel to Link</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {channels.length === 0 ? (
            <DropdownMenuItem disabled>
              No channels available
            </DropdownMenuItem>
          ) : (
            channels.map((channel) => (
              <DropdownMenuItem
                key={channel.id}
                onClick={() => handleCreateLink(channel.id)}
                disabled={isCreating}
              >
                {channel.name}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Filter Editor Component
const FilterEditor = ({ filters, onChange }: {
  filters: LinkFilter[];
  onChange: (filters: LinkFilter[]) => void;
}) => {
  const addFilter = () => {
    onChange([...filters, { field: "", type: "equals", value: "" }]);
  };

  const updateFilter = (index: number, field: keyof LinkFilter, value: string) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    onChange(newFilters);
  };

  const removeFilter = (index: number) => {
    onChange(filters.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Filters</Label>
        <Button size="sm" variant="outline" onClick={addFilter}>
          <Plus className="h-3 w-3 mr-1" />
          Add Filter
        </Button>
      </div>
      {filters.map((filter, index) => (
        <div key={index} className="flex gap-2 items-center">
          <Input
            placeholder="Field"
            value={filter.field}
            onChange={(e) => updateFilter(index, "field", e.target.value)}
            className="flex-1"
          />
          <Select
            value={filter.type}
            onValueChange={(value) => updateFilter(index, "type", value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equals">Equals</SelectItem>
              <SelectItem value="contains">Contains</SelectItem>
              <SelectItem value="startsWith">Starts With</SelectItem>
              <SelectItem value="endsWith">Ends With</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Value"
            value={filter.value}
            onChange={(e) => updateFilter(index, "value", e.target.value)}
            className="flex-1"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => removeFilter(index)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
};

// Individual Link Item Component
const LinkItem = ({ link, linkMode = "sequential", isSelected, onSelect, onUpdate, onDelete }: {
  link: SortableLink;
  linkMode?: string;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(link.id);
      toast({
        title: "Link Deleted",
        description: "Successfully deleted link",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete link",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-background border rounded-lg flex justify-between items-center p-3 tracking-wide font-medium w-full">
      <div className="flex items-center gap-3 flex-1">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
        <Badge
          variant="outline"
          className="py-1 px-2 text-xs font-medium"
        >
          {linkMode === "sequential" ? link.rank || 1 : "1"}
        </Badge>
        <div className="flex-1">
          <div className="font-medium">{link.channel.name}</div>
          <div className="text-xs text-muted-foreground">
            {link.filters?.length || 0} filter{(link.filters?.length || 0) !== 1 && "s"}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-6 w-6 p-0",
            isSelected && "bg-blue-50 border-blue-200"
          )}
          onClick={onSelect}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className={cn(
            "h-6 px-2 text-xs",
            isSelected && "bg-blue-50 border-blue-200 border"
          )}
          onClick={onSelect}
        >
          {link.filters?.length || 0} filter{(link.filters?.length || 0) !== 1 && "s"}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

// Check if link orders are equal
const areOrdersEqual = (links1: SortableLink[], links2: SortableLink[]) => {
  if (links1.length !== links2.length) return false;
  return links1.every((link, index) => link.id === links2[index].id);
};

// Main Links Component
export const Links = ({ shopId }: { shopId: string }) => {
  const [links, setLinks] = useState<SortableLink[]>([]);
  const [initialLinks, setInitialLinks] = useState<SortableLink[]>([]);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [linkMode] = useState("sequential"); // Could be made dynamic
  const { toast } = useToast();

  const hasOrderChanged = !areOrdersEqual(initialLinks, links);

  const loadLinks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetLinks {
              links {
                id
                channel {
                  id
                  name
                }
                filters
                rank
                createdAt
              }
            }
          `
        })
      });
      
      const data = await response.json();
      console.log('Shop Links response:', data);
      
      if (data.data?.links) {
        // Sort by rank if available, otherwise by creation date
        const sortedLinks = data.data.links.sort((a: Link, b: Link) => {
          if (a.rank !== undefined && b.rank !== undefined) {
            return a.rank - b.rank;
          }
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        setLinks(sortedLinks);
        setInitialLinks(sortedLinks);
      } else {
        setError('No links data received');
      }
    } catch (err: any) {
      console.error('Failed to load shop links:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, [shopId]);

  const handleUpdateLink = async (linkId: string, data: any) => {
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation UpdateLink($where: LinkWhereUniqueInput!, $data: LinkUpdateInput!) {
              updateLink(where: $where, data: $data) {
                id
                channel {
                  id
                  name
                }
                filters
                rank
              }
            }
          `,
          variables: {
            where: { id: linkId },
            data
          }
        })
      });
      
      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }
      
      loadLinks(); // Refresh the list
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation DeleteLink($where: LinkWhereUniqueInput!) {
              deleteLink(where: $where) {
                id
              }
            }
          `,
          variables: {
            where: { id: linkId }
          }
        })
      });
      
      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }
      
      loadLinks(); // Refresh the list
    } catch (error) {
      throw error;
    }
  };

  const handleSaveOrder = async () => {
    setIsUpdating(true);
    try {
      const updatePromises = links.map((link, index) => {
        return fetch('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              mutation UpdateLink($where: LinkWhereUniqueInput!, $data: LinkUpdateInput!) {
                updateLink(where: $where, data: $data) {
                  id
                  rank
                }
              }
            `,
            variables: {
              where: { id: link.id },
              data: { rank: index + 1 }
            }
          })
        });
      });
      
      await Promise.all(updatePromises);
      
      toast({
        title: "Order Updated",
        description: "Successfully updated link order",
      });
      
      loadLinks(); // Refresh to get updated ranks
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update link order",
        variant: "destructive",
      });
      loadLinks(); // Revert to server state
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return <div>Loading links...</div>;
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-500/50 px-4 py-3 text-red-600">
        <p className="text-sm">
          <CircleAlert
            className="me-3 -mt-0.5 inline-flex opacity-60"
            size={16}
            aria-hidden="true"
          />
          Error loading links: {error}
        </p>
      </div>
    );
  }

  const selectedLink = selectedLinkId ? links.find(l => l.id === selectedLinkId) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Links</h3>
          <p className="text-sm text-muted-foreground">
            Create links to channels based on filters
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasOrderChanged ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveOrder}
              disabled={isUpdating}
            >
              {isUpdating ? "Saving..." : "Save Order"}
            </Button>
          ) : (
            <CreateLinkButton shopId={shopId} refetch={loadLinks} />
          )}
        </div>
      </div>

      {links.length > 0 && (
        <ReactSortable
          list={links}
          setList={setLinks}
          handle=".cursor-grab"
          className="space-y-2"
        >
          {links.map((link) => (
            <LinkItem
              key={link.id}
              link={link}
              linkMode={linkMode}
              isSelected={selectedLinkId === link.id}
              onSelect={() => setSelectedLinkId(link.id)}
              onUpdate={handleUpdateLink}
              onDelete={handleDeleteLink}
            />
          ))}
        </ReactSortable>
      )}

      {links.length === 0 && (
        <div className="text-center p-8 border border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground">
            No links found. Create your first link above.
          </p>
        </div>
      )}

      {selectedLink && (
        <div className="border rounded-lg p-4">
          <div className="flex flex-col gap-3">
            <div>
              <h4 className="text-base font-medium">Filters for {selectedLink.channel.name}</h4>
              <p className="text-xs text-muted-foreground">
                Orders matching these filters will be processed by this channel
              </p>
            </div>
            <FilterEditor 
              filters={selectedLink.filters || []} 
              onChange={(newFilters) => {
                handleUpdateLink(selectedLink.id, { filters: newFilters });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Links;
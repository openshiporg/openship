'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
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
  PopoverClose,
} from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from '@tanstack/react-query';
import { enhanceFields } from '../../../dashboard/utils/enhanceFields';
import { 
  createChannelLink, 
  updateChannelLink, 
  deleteChannelLink 
} from '../actions/links';
import { cn } from "@/lib/utils";

interface LinkFilter {
  field: string;
  type: string;
  value: string;
}

interface LinksProps {
  channelId: string;
  channel: any;
  shops?: any[];
  orderList?: any;
}

interface Link {
  id: string;
  shop?: {
    id: string;
    name: string;
  };
  filters?: LinkFilter[];
  rank?: number;
}

// Create Link Button Component
const CreateLinkButton = ({ channelId, shops, onCreated }: {
  channelId: string;
  shops: any[];
  onCreated: () => void;
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateLink = async (shopId: string) => {
    setIsCreating(true);
    try {
      const response = await createChannelLink(channelId, shopId, []);
      if (response.success) {
        toast({ title: "Link Created" });
        onCreated();
      } else {
        throw new Error(response.error || 'Failed to create link');
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" disabled={isCreating}>
          <Plus className="h-4 w-4" />
          {isCreating ? "Creating..." : "Add Link"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Select Shop to Link</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {shops.length === 0 ? (
            <DropdownMenuItem disabled>No shops available</DropdownMenuItem>
          ) : (
            shops.map((shop) => (
              <DropdownMenuItem
                key={shop.id}
                onClick={() => handleCreateLink(shop.id)}
                disabled={isCreating}
              >
                {shop.name}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Filter Chip Component - Tremor-inspired
const FilterChip = ({
  filter,
  index,
  filterableFields,
  enhancedFields,
  onUpdate,
  onRemove,
}: {
  filter: LinkFilter;
  index: number;
  filterableFields: Record<string, any>;
  enhancedFields: Record<string, any>;
  onUpdate: (index: number, updates: Partial<LinkFilter>) => void;
  onRemove: (index: number) => void;
}) => {
  const [localType, setLocalType] = useState(filter.type);
  const [localValue, setLocalValue] = useState(filter.value);

  const getFilterTypes = (fieldPath: string) => {
    const field = filterableFields[fieldPath];
    if (!field?.controller?.filter?.types) return {};
    return field.controller.filter.types;
  };

  const getFieldLabel = (fieldPath: string) => {
    return enhancedFields[fieldPath]?.label || fieldPath;
  };

  const getTypeLabel = (fieldPath: string, typeKey: string) => {
    const types = getFilterTypes(fieldPath);
    return types[typeKey]?.label || typeKey;
  };

  const filterTypes = getFilterTypes(filter.field);
  const hasValue = filter.value && filter.value.trim() !== '';
  const fieldLabel = getFieldLabel(filter.field);
  const typeLabel = getTypeLabel(filter.field, filter.type);

  const handleApply = () => {
    const updates: Partial<LinkFilter> = {};
    if (localType !== filter.type) {
      updates.type = localType;
    }
    if (localValue !== filter.value) {
      updates.value = localValue;
    }
    if (Object.keys(updates).length > 0) {
      onUpdate(index, updates);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-x-1.5 whitespace-nowrap rounded-md border px-2 py-1.5 text-sm font-medium transition-colors",
            "hover:bg-muted/50",
            hasValue
              ? "border-border bg-background text-foreground"
              : "border-dashed border-muted-foreground/50 text-muted-foreground"
          )}
        >
          <span
            aria-hidden="true"
            onClick={(e) => {
              if (hasValue) {
                e.stopPropagation();
                onRemove(index);
              }
            }}
            className="flex items-center"
          >
            <Plus
              className={cn(
                "-ml-px h-4 w-4 shrink-0 transition-transform",
                hasValue && "rotate-45 hover:text-destructive"
              )}
            />
          </span>
          <span className="truncate max-w-[100px] font-medium">{fieldLabel}</span>
          {hasValue && (
            <>
              <span className="text-muted-foreground/60" aria-hidden="true">⋮</span>
              <span className="truncate max-w-[80px] opacity-70">
                {typeLabel}
              </span>
              <span className="text-muted-foreground/60" aria-hidden="true">⋮</span>
              <span className="truncate max-w-[100px] opacity-50">
                {filter.value}
              </span>
            </>
          )}
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Field</label>
            <div className="h-9 px-3 py-2 text-sm bg-muted rounded-md text-muted-foreground">
              {getFieldLabel(filter.field)}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Condition</label>
            <Select value={localType} onValueChange={setLocalType}>
              <SelectTrigger className="h-9 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(filterTypes).map(([typeKey, typeConfig]: [string, any]) => (
                  <SelectItem key={typeKey} value={typeKey}>
                    {typeConfig.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Value</label>
            <input
              type="text"
              placeholder="Enter value..."
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <PopoverClose asChild>
              <Button 
                size="sm" 
                className="flex-1"
                onClick={handleApply}
              >
                Apply
              </Button>
            </PopoverClose>
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1"
              onClick={() => onRemove(index)}
            >
              Remove
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Add Filter Button - Tremor-inspired dashed button
const AddFilterButton = ({
  filterableFields,
  enhancedFields,
  existingFilterFields,
  onAdd,
  disabled,
}: {
  filterableFields: Record<string, any>;
  enhancedFields: Record<string, any>;
  existingFilterFields: string[];
  onAdd: (filter: LinkFilter) => void;
  disabled: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedField, setSelectedField] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [value, setValue] = useState('');

  // Exclude fields that are already used in filters
  const fieldPaths = Object.keys(filterableFields).filter(
    (path) => !existingFilterFields.includes(path)
  );

  const getFilterTypes = (fieldPath: string) => {
    const field = filterableFields[fieldPath];
    if (!field?.controller?.filter?.types) return {};
    return field.controller.filter.types;
  };

  const getFieldLabel = (fieldPath: string) => {
    return enhancedFields[fieldPath]?.label || fieldPath;
  };

  const handleFieldChange = (fieldPath: string) => {
    setSelectedField(fieldPath);
    const types = getFilterTypes(fieldPath);
    const firstType = Object.keys(types)[0];
    setSelectedType(firstType || '');
    setValue('');
  };

  const handleApply = () => {
    if (selectedField && selectedType) {
      onAdd({ field: selectedField, type: selectedType, value });
      setSelectedField('');
      setSelectedType('');
      setValue('');
      setIsOpen(false);
    }
  };

  const filterTypes = selectedField ? getFilterTypes(selectedField) : {};

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex items-center gap-x-1.5 whitespace-nowrap rounded-md border border-dashed px-2 py-1.5 text-sm font-medium transition-colors",
            "border-muted-foreground/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span>Add Filter</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Field</label>
            <Select value={selectedField} onValueChange={handleFieldChange}>
              <SelectTrigger className="h-9 text-base">
                <SelectValue placeholder="Select field..." />
              </SelectTrigger>
              <SelectContent>
                {fieldPaths.map((fieldPath) => (
                  <SelectItem key={fieldPath} value={fieldPath}>
                    {getFieldLabel(fieldPath)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedField && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Condition</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="h-9 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(filterTypes).map(([typeKey, typeConfig]: [string, any]) => (
                      <SelectItem key={typeKey} value={typeKey}>
                        {typeConfig.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Value</label>
                <input
                  type="text"
                  placeholder="Enter value..."
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </>
          )}

          <div className="flex gap-2 pt-1">
            <PopoverClose asChild>
              <Button 
                size="sm" 
                className="flex-1"
                onClick={handleApply}
                disabled={!selectedField || !selectedType}
              >
                Add
              </Button>
            </PopoverClose>
            <PopoverClose asChild>
              <Button size="sm" variant="outline" className="flex-1">
                Cancel
              </Button>
            </PopoverClose>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Individual Link Card Component
const LinkCard = ({ 
  link, 
  linkMode = "sequential", 
  onDeleted,
  orderList
}: {
  link: Link;
  linkMode?: string;
  onDeleted: () => void;
  orderList: any;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [localFilters, setLocalFilters] = useState<LinkFilter[]>(
    Array.isArray(link.filters) ? link.filters : []
  );
  const { toast } = useToast();
  
  const enhancedFields = useMemo(() => {
    if (!orderList?.fields) return {};
    return enhanceFields(orderList.fields, 'Order');
  }, [orderList]);

  const filterableFields = useMemo(() => {
    const filtered: Record<string, any> = {};
    // Fields to exclude from link filters
    const excludedFields = ['id', 'name'];
    Object.entries(enhancedFields).forEach(([path, field]: [string, any]) => {
      if (field.controller?.filter && !excludedFields.includes(path)) {
        filtered[path] = field;
      }
    });
    return filtered;
  }, [enhancedFields]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await deleteChannelLink(link.id);
      if (response.success) {
        toast({ title: "Link Deleted" });
        onDeleted();
      } else {
        throw new Error(response.error);
      }
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to delete link", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const saveFilters = async (newFilters: LinkFilter[]) => {
    try {
      const response = await updateChannelLink(link.id, { filters: newFilters });
      if (!response.success) {
        throw new Error(response.error);
      }
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to save filters", variant: "destructive" });
    }
  };

  const addFilter = (filter: LinkFilter) => {
    const newFilters = [...localFilters, filter];
    setLocalFilters(newFilters);
    saveFilters(newFilters);
  };

  const updateFilter = (index: number, updates: Partial<LinkFilter>) => {
    const newFilters = [...localFilters];
    newFilters[index] = { ...newFilters[index], ...updates };
    setLocalFilters(newFilters);
    saveFilters(newFilters);
  };

  const removeFilter = (index: number) => {
    const newFilters = localFilters.filter((_, i) => i !== index);
    setLocalFilters(newFilters);
    saveFilters(newFilters);
  };

  return (
    <div className="rounded-2xl bg-muted/50 p-1">
      {/* Frame Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
          <Badge variant="secondary" className="text-xs font-medium h-6 w-6 flex items-center justify-center p-0 rounded-md shrink-0">
            {linkMode === "sequential" ? link.rank || 1 : "1"}
          </Badge>
          <h3 className="text-sm font-semibold truncate">{link.shop?.name || 'Unknown Shop'}</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Frame Panel - Filter Chips */}
      <div className="rounded-xl border bg-background p-4">
        <div className="flex flex-wrap gap-2">
          {localFilters.map((filter, index) => (
            <FilterChip
              key={index}
              filter={filter}
              index={index}
              filterableFields={filterableFields}
              enhancedFields={enhancedFields}
              onUpdate={updateFilter}
              onRemove={removeFilter}
            />
          ))}
          
          <AddFilterButton
            filterableFields={filterableFields}
            enhancedFields={enhancedFields}
            existingFilterFields={localFilters.map((f) => f.field)}
            onAdd={addFilter}
            disabled={!orderList || Object.keys(filterableFields).length === 0}
          />
        </div>
        
        {localFilters.length === 0 && (
          <p className="text-xs text-muted-foreground mt-2">No filters - matches all orders</p>
        )}
      </div>
    </div>
  );
};

// Main Links Component
export const Links = ({ channelId, channel, shops = [], orderList }: LinksProps) => {
  const queryClient = useQueryClient();
  
  const links = channel?.links || [];

  const invalidateChannels = async () => {
    await queryClient.invalidateQueries({ queryKey: ['lists', 'Channel', 'items'] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">Links</h3>
          <p className="text-sm text-muted-foreground">
            Create links from shops based on filters
          </p>
        </div>
        <CreateLinkButton channelId={channelId} shops={shops} onCreated={invalidateChannels} />
      </div>

      {links.length > 0 ? (
        <div className="space-y-3">
          {links.map((link: Link) => (
            <LinkCard
              key={link.id}
              link={link}
              linkMode={channel?.linkMode || "sequential"}
              onDeleted={invalidateChannels}
              orderList={orderList}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No links found. Create your first link above.
          </p>
        </div>
      )}
    </div>
  );
};

export default Links;

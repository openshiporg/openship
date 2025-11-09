"use client";
import React, { useState } from "react";
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from "@/components/ui/button";
import { CirclePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { createShop, initiateOAuthFlow } from "../actions/createShop";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlatformSelect } from "./PlatformSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from '@tanstack/react-query';

interface CreateShopProps {
  onShopCreated?: () => void;
  trigger?: React.ReactElement;
}

export function CreateShop({ onShopCreated, trigger }: CreateShopProps = {}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [selectedPlatformData, setSelectedPlatformData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Form fields
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [accessToken, setAccessToken] = useState('');

  const handleShopCreation = async () => {
    if (!selectedPlatform) {
      toast.error('Please select a platform');
      return;
    }

    setIsLoading(true);

    try {
      // Check if this is OAuth platform
      if (
        selectedPlatformData?.appKey &&
        selectedPlatformData?.appSecret &&
        selectedPlatformData?.oAuthFunction &&
        selectedPlatformData?.oAuthCallbackFunction
      ) {
        // OAuth flow - redirect to platform OAuth
        if (!domain) {
          toast.error('Please enter a domain');
          setIsLoading(false);
          return;
        }
        
        console.log('Initiating OAuth flow for domain:', domain);
        await initiateOAuthFlow(selectedPlatform, domain);
        return;
      }

      // Manual creation flow
      if (!name || !domain || !accessToken) {
        toast.error('Please fill in all fields');
        setIsLoading(false);
        return;
      }

      console.log('Creating shop with:', {
        name,
        domain,
        accessToken,
        platformId: selectedPlatform
      });

      const result = await createShop({
        name,
        domain,
        accessToken,
        platformId: selectedPlatform
      });

      if (result.success) {
        toast.success('Shop created successfully');
        setIsDialogOpen(false);
        // Invalidate React Query cache to refetch shops
        // Use exact: false to match all queries that start with this key
        await queryClient.invalidateQueries({
          queryKey: ['lists', 'Shop', 'items'],
          exact: false
        });
        onShopCreated?.();
      } else {
        toast.error(result.error || 'Failed to create shop');
      }
    } catch (error) {
      console.error('Error creating shop:', error);
      toast.error('An error occurred while creating the shop');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedPlatform('');
    setSelectedPlatformData(null);
    setName('');
    setDomain('');
    setAccessToken('');
  };


  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            className={cn(
              buttonVariants({ size: "icon" }),
              "lg:px-4 lg:py-2 lg:w-auto rounded-lg"
            )}
          >
            <CirclePlus />
            <span className="hidden lg:inline">Create Shop</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Shop</DialogTitle>
          <DialogDescription>
            Connect a new shop to your platform
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <PlatformSelect 
            value={selectedPlatform}
            onValueChange={setSelectedPlatform}
            onPlatformDataChange={setSelectedPlatformData}
          />

          {selectedPlatform && selectedPlatformData && (
            <div className="space-y-4">
              {/* Check if platform has OAuth - if it does AND has app credentials, only show domain */}
              {selectedPlatformData.oAuthFunction && selectedPlatformData.oAuthCallbackFunction && selectedPlatformData.appKey && selectedPlatformData.appSecret ? (
                <div>
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    type="text"
                    placeholder="your-shop-domain.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="bg-muted/40 mt-2"
                  />
                </div>
              ) : (
                /* No OAuth or missing app credentials - need all fields for manual setup */
                <>
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Shop name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-muted/40 mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="domain">Domain</Label>
                    <Input
                      id="domain"
                      type="text"
                      placeholder="your-shop-domain.com"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="bg-muted/40 mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="accessToken">Access Token</Label>
                    <Input
                      id="accessToken"
                      type="text"
                      placeholder="Enter access token"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      className="bg-muted/40 mt-2"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={handleDialogClose}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            disabled={isLoading || !selectedPlatform}
            onClick={handleShopCreation}
          >
            {isLoading ? "Creating..." : 
             (selectedPlatformData?.oAuthFunction && selectedPlatformData?.oAuthCallbackFunction && selectedPlatformData?.appKey && selectedPlatformData?.appSecret
              ? `Install App on ${selectedPlatformData.name}` : "Create Shop")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
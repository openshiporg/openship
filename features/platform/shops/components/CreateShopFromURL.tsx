"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createShop } from "../actions/createShop";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateShopFromURLProps {
  onShopCreated?: () => void;
  searchParams?: {
    showCreateShop?: string;
    platform?: string;
    accessToken?: string;
    domain?: string;
  };
}

export function CreateShopFromURL({ onShopCreated, searchParams }: CreateShopFromURLProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  // Form fields - pre-filled from URL params
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [platformId, setPlatformId] = useState('');

  useEffect(() => {
    if (!searchParams) return;
    
    // Check if we should auto-open and pre-fill
    const { showCreateShop, platform: urlPlatform, accessToken: urlAccessToken, domain: urlDomain } = searchParams;

    console.log('CreateShopFromURL - Search params:', {
      showCreateShop,
      urlPlatform,
      urlAccessToken,
      urlDomain
    });

    if (showCreateShop === 'true' && urlPlatform && urlAccessToken && urlDomain) {
      console.log('CreateShopFromURL - Opening dialog with params');
      // Pre-fill form with URL data
      setPlatformId(urlPlatform);
      setAccessToken(urlAccessToken);
      setDomain(decodeURIComponent(urlDomain));
      
      // Auto-generate shop name from domain
      const domainWithoutProtocol = decodeURIComponent(urlDomain).replace(/^https?:\/\//, '');
      setName(domainWithoutProtocol);
      
      // Auto-open dialog
      setIsDialogOpen(true);

      // Clear URL params to clean up browser history
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('showCreateShop');
      newUrl.searchParams.delete('platform');
      newUrl.searchParams.delete('accessToken');
      newUrl.searchParams.delete('domain');
      router.replace(newUrl.pathname + newUrl.search);
    }
  }, [searchParams, router]);

  const handleShopCreation = async () => {
    if (!name.trim()) {
      toast.error('Please enter a shop name');
      return;
    }

    if (!domain.trim()) {
      toast.error('Please enter a shop domain');
      return;
    }

    if (!accessToken.trim()) {
      toast.error('Please enter an access token');
      return;
    }

    if (!platformId) {
      toast.error('Platform ID is missing');
      return;
    }

    setIsLoading(true);

    try {
      await createShop({
        name: name.trim(),
        domain: domain.trim(),
        accessToken: accessToken.trim(),
        platformId,
      });

      toast.success('Shop created successfully!');
      setIsDialogOpen(false);
      
      // Reset form
      setName('');
      setDomain('');
      setAccessToken('');
      setPlatformId('');
      
      if (onShopCreated) {
        onShopCreated();
      }
    } catch (error) {
      console.error('Error creating shop:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create shop');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    // Reset form
    setName('');
    setDomain('');
    setAccessToken('');
    setPlatformId('');
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Shop</DialogTitle>
          <DialogDescription>
            Complete your shop setup with the OAuth credentials received.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Shop Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter shop name"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="shop.example.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="accessToken">Access Token</Label>
            <Input
              id="accessToken"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Access token from OAuth"
              disabled={isLoading}
              type="password"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleShopCreation}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Shop'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createChannel } from "../actions/createChannel";
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

interface CreateChannelFromURLProps {
  onChannelCreated?: () => void;
  searchParams?: {
    showCreateChannel?: string;
    platform?: string;
    accessToken?: string;
    domain?: string;
    platformInitiated?: string;
  };
}

export function CreateChannelFromURL({ onChannelCreated, searchParams }: CreateChannelFromURLProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  // Form fields - pre-filled from URL params
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [platformId, setPlatformId] = useState('');
  const [isPlatformInitiated, setIsPlatformInitiated] = useState(false);

  useEffect(() => {
    if (!searchParams) return;
    
    // Check if we should auto-open and pre-fill
    const { 
      showCreateChannel, 
      platform: urlPlatform, 
      accessToken: urlAccessToken, 
      domain: urlDomain,
      platformInitiated
    } = searchParams;

    console.log('CreateChannelFromURL - Search params:', {
      showCreateChannel,
      urlPlatform,
      urlAccessToken,
      urlDomain,
      platformInitiated
    });

    // Handle platform-initiated flow (from OpenFront)
    if (showCreateChannel === 'true' && urlPlatform && urlDomain && platformInitiated === 'true') {
      console.log('🚀 Platform-initiated channel flow detected');
      setIsPlatformInitiated(true);
      setPlatformId(urlPlatform);
      setDomain(decodeURIComponent(urlDomain));
      
      // Auto-generate channel name from domain  
      const domainWithoutProtocol = decodeURIComponent(urlDomain).replace(/^https?:\/\//, '');
      const cleanName = domainWithoutProtocol.split('.')[0].replace(/[-_]/g, ' ');
      const capitalizedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1) + ' Channel';
      setName(capitalizedName);
      
      setIsDialogOpen(true);

      // Clean URL params
      const newUrl = new URL(window.location.href);
      ['showCreateChannel', 'platform', 'domain', 'platformInitiated'].forEach(param => {
        newUrl.searchParams.delete(param);
      });
      router.replace(newUrl.pathname + newUrl.search);
      return;
    }

    // Handle standard OAuth callback flow
    if (showCreateChannel === 'true' && urlPlatform && urlAccessToken && urlDomain) {
      console.log('✅ Standard OAuth callback flow');
      setPlatformId(urlPlatform);
      setAccessToken(urlAccessToken);
      setDomain(decodeURIComponent(urlDomain));
      
      // Auto-generate channel name from domain
      const domainWithoutProtocol = decodeURIComponent(urlDomain).replace(/^https?:\/\//, '');
      setName(domainWithoutProtocol);
      
      setIsDialogOpen(true);

      // Clear URL params
      const newUrl = new URL(window.location.href);
      ['showCreateChannel', 'platform', 'accessToken', 'domain'].forEach(param => {
        newUrl.searchParams.delete(param);
      });
      router.replace(newUrl.pathname + newUrl.search);
    }
  }, [searchParams, router]);

  const handleChannelCreation = async () => {
    if (!name.trim()) {
      toast.error('Please enter a channel name');
      return;
    }

    if (!domain.trim()) {
      toast.error('Please enter a channel domain');
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
      await createChannel({
        name: name.trim(),
        domain: domain.trim(),
        accessToken: accessToken.trim(),
        platformId,
      });

      toast.success('Channel created successfully!');
      setIsDialogOpen(false);
      router.refresh(); // Add router.refresh() like the regular CreateChannel component
      
      // Reset form
      setName('');
      setDomain('');
      setAccessToken('');
      setPlatformId('');
      
      if (onChannelCreated) {
        onChannelCreated();
      }
    } catch (error) {
      console.error('Error creating channel:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create channel');
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
          <DialogTitle>Create Channel</DialogTitle>
          <DialogDescription>
            Complete your channel setup with the OAuth credentials received.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Channel Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter channel name"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="channel.example.com"
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
            onClick={handleChannelCreation}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Channel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
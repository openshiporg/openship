"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createChannel } from "../actions/channels";
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
}

export function CreateChannelFromURL({ onChannelCreated }: CreateChannelFromURLProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Form fields - pre-filled from URL params
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [platformId, setPlatformId] = useState('');

  useEffect(() => {
    // Check if we should auto-open and pre-fill
    const showCreateChannel = searchParams.get('showCreateChannel');
    const urlPlatform = searchParams.get('platform');
    const urlAccessToken = searchParams.get('accessToken');
    const urlDomain = searchParams.get('domain');

    if (showCreateChannel === 'true' && urlPlatform && urlAccessToken && urlDomain) {
      // Pre-fill form with URL data
      setPlatformId(urlPlatform);
      setAccessToken(urlAccessToken);
      setDomain(decodeURIComponent(urlDomain));
      
      // Auto-generate channel name from domain
      const domainWithoutProtocol = decodeURIComponent(urlDomain).replace(/^https?:\/\//, '');
      setName(domainWithoutProtocol);
      
      // Auto-open dialog
      setIsDialogOpen(true);

      // Clear URL params to clean up browser history
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('showCreateChannel');
      newUrl.searchParams.delete('platform');
      newUrl.searchParams.delete('accessToken');
      newUrl.searchParams.delete('domain');
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
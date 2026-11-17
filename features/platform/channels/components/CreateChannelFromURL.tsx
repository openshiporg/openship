'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { completeChannelOAuthConnection } from '../actions/createChannel';

interface CreateChannelFromURLProps {
  onChannelCreated?: () => void;
  searchParams?: {
    showCreateChannel?: string;
    platform?: string;
    accessToken?: string;
    domain?: string;
    refreshToken?: string;
    tokenExpiresAt?: string;
  };
}

export function CreateChannelFromURL({ onChannelCreated, searchParams }: CreateChannelFromURLProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!searchParams?.showCreateChannel) return;
    const urlDomain = searchParams.domain;
    if (!urlDomain || !searchParams.platform) return;

    const decodedDomain = decodeURIComponent(urlDomain);
    const domainName = decodedDomain
      .replace(/^https?:\/\//, '')
      .split('.')[0]
      .replace(/[-_]/g, ' ')
      .replace(/openfront/gi, 'Openfront');
    setName(`${domainName.charAt(0).toUpperCase()}${domainName.slice(1)} Channel`);
    setDomain(decodedDomain);
    setIsDialogOpen(true);
  }, [searchParams]);

  const handleChannelCreation = async () => {
    if (!name.trim() || !domain.trim()) {
      toast.error('OAuth channel details are incomplete');
      return;
    }

    setIsLoading(true);
    try {
      const result = await completeChannelOAuthConnection(name.trim());
      if (!result.success) {
        toast.error(result.error || 'Failed to create channel');
        return;
      }

      toast.success('Channel connected successfully!');
      setIsDialogOpen(false);
      const url = new URL(window.location.href);
      ['showCreateChannel', 'platform', 'accessToken', 'domain', 'refreshToken', 'tokenExpiresAt'].forEach(
        (parameter) => url.searchParams.delete(parameter)
      );
      router.replace(url.pathname + url.search);
      await queryClient.invalidateQueries({ queryKey: ['lists', 'Channel', 'items'] });
      onChannelCreated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create channel');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Openfront Channel</DialogTitle>
          <DialogDescription>Complete your channel setup with the OAuth credentials received.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Channel Name</Label>
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} disabled={isLoading} />
          </div>
          <div>
            <Label htmlFor="domain">Domain</Label>
            <Input id="domain" value={domain} onChange={(event) => setDomain(event.target.value)} disabled={isLoading} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleChannelCreation} disabled={isLoading}>{isLoading ? 'Connecting...' : 'Connect Channel'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

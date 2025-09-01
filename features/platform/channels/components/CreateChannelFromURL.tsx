"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createChannel } from "../actions/createChannel";
import { createChannelPlatform } from "../actions/createChannelPlatform";
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
    // OAuth parameters from marketplace flow
    client_id?: string;
    client_secret?: string;
    app_name?: string;
    adapter_slug?: string; // Identifies which adapter to use (e.g., 'openfront', 'shopify')
    code?: string;
    scope?: string;
    redirect_uri?: string;
    state?: string;
    // Token parameters from OAuth callback
    refreshToken?: string;
    tokenExpiresAt?: string;
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
  const [isMarketplaceFlow, setIsMarketplaceFlow] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [appName, setAppName] = useState('');
  const [adapterSlug, setAdapterSlug] = useState('');
  const [oauthCode, setOauthCode] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [tokenExpiresAt, setTokenExpiresAt] = useState('');

  useEffect(() => {
    
    if (!searchParams || !searchParams.showCreateChannel) {
      return;
    }
    
    const { 
      platform: urlPlatform, 
      accessToken: urlAccessToken, 
      domain: urlDomain,
      client_id,
      client_secret,
      app_name,
      adapter_slug,
      code,
      refreshToken: urlRefreshToken,
      tokenExpiresAt: urlTokenExpiresAt
    } = searchParams;


    if (!urlDomain) {
      return;
    }

    // Auto-generate channel name from domain
    const domainWithoutProtocol = decodeURIComponent(urlDomain).replace(/^https?:\/\//, '');
    const cleanName = domainWithoutProtocol.split('.')[0].replace(/[-_]/g, ' ');
    // Fix OpenFront capitalization specifically
    const fixedName = cleanName.replace(/openfront/gi, 'Openfront');
    const capitalizedName = fixedName.charAt(0).toUpperCase() + fixedName.slice(1) + ' Channel';
    setName(capitalizedName);
    setDomain(decodeURIComponent(urlDomain));
    
    // Check if this is marketplace flow (has client_id) or long flow (has platform)
    if (client_id && client_secret && app_name && adapter_slug && urlAccessToken && urlAccessToken !== 'undefined') {
      // Marketplace flow - OAuth already exchanged, ready to create platform/channel
      
      setIsMarketplaceFlow(true);
      setClientId(client_id);
      setClientSecret(client_secret);
      setAppName(app_name);
      setAdapterSlug(adapter_slug);
      setAccessToken(urlAccessToken);
      
      if (urlRefreshToken) {
        setRefreshToken(urlRefreshToken);
      }
      if (urlTokenExpiresAt) {
        setTokenExpiresAt(urlTokenExpiresAt);
      }
    } else if (urlPlatform && urlAccessToken) {
      // Long flow - platform exists, just need to create channel
      
      setPlatformId(urlPlatform);
      setAccessToken(urlAccessToken);
      
      // Set additional token data if provided
      if (urlRefreshToken) {
        setRefreshToken(urlRefreshToken);
      }
      if (urlTokenExpiresAt) {
        setTokenExpiresAt(urlTokenExpiresAt);
      }
    } else {
      return;
    }
    
    setIsDialogOpen(true);

    // DON'T clean URL params immediately - wait for user action
    // This was causing the dialog to lose its data source
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

    setIsLoading(true);

    try {
      let finalPlatformId: string | null = platformId;

      // Marketplace flow: Check if platform exists
      if (isMarketplaceFlow && clientId && clientSecret) {
        
        const { getChannelPlatformByClientId } = await import('../actions/getChannelPlatformByClientId');
        const platformResult = await getChannelPlatformByClientId(clientId);
        
        
        if (platformResult.success && platformResult.data) {
          // Platform exists, use it
          finalPlatformId = platformResult.data.id;
        } else {
          // Platform doesn't exist, will create inline with shop
          finalPlatformId = null;
        }
      }

      // For marketplace flow, access token should come from OAuth callback
      let finalAccessToken = accessToken;
      if (!finalAccessToken && !isMarketplaceFlow) {
        toast.error('Access token is required');
        return;
      }

      // Create the channel
      const channelData: any = {
        name: name.trim(),
        domain: domain.trim(),
        accessToken: finalAccessToken.trim(),
      };


      if (refreshToken) {
        channelData.refreshToken = refreshToken;
      }

      if (tokenExpiresAt) {
        channelData.tokenExpiresAt = new Date(tokenExpiresAt);
      }


      if (finalPlatformId) {
        channelData.platformId = finalPlatformId;
      } else if (isMarketplaceFlow && clientId && clientSecret && appName && adapterSlug) {
        // Create platform inline using dynamic adapter slug
        channelData.platform = {
          create: {
            name: appName + ' (Auto-created)',
            appKey: clientId,
            appSecret: clientSecret,
            // Use adapter slug for all function mappings
            searchProductsFunction: adapterSlug,
            getProductFunction: adapterSlug,
            createPurchaseFunction: adapterSlug,
            createWebhookFunction: adapterSlug,
            oAuthFunction: adapterSlug,
            oAuthCallbackFunction: adapterSlug,
            createTrackingWebhookHandler: adapterSlug,
            cancelPurchaseWebhookHandler: adapterSlug,
            getWebhooksFunction: adapterSlug,
            deleteWebhookFunction: adapterSlug,
          }
        };
      }


      const channelResult = await createChannel(channelData);

      if (channelResult.success) {
        toast.success('Channel connected successfully!');
        setIsDialogOpen(false);
        
        // Clean URL params after successful creation
        const newUrl = new URL(window.location.href);
        ['showCreateChannel', 'platform', 'accessToken', 'domain', 'client_id', 'client_secret', 'app_name', 'adapter_slug', 'refreshToken', 'tokenExpiresAt', 'code'].forEach(param => {
          newUrl.searchParams.delete(param);
        });
        router.replace(newUrl.pathname + newUrl.search);
        
        router.refresh();
        
        if (onChannelCreated) {
          onChannelCreated();
        }
      } else {
        toast.error(channelResult.error || 'Failed to create channel');
      }
    } catch (error) {
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
    setIsMarketplaceFlow(false);
    setClientId('');
    setClientSecret('');
    setAppName('');
    setRefreshToken('');
    setTokenExpiresAt('');
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Openfront Channel</DialogTitle>
          <DialogDescription>
            {isMarketplaceFlow
              ? 'Setting up your Openfront integration. We\'ll create the platform if needed and connect your channel.'
              : 'Complete your channel setup with the OAuth credentials received.'
            }
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
              placeholder="shop.example.com"
              disabled={isLoading}
            />
          </div>

          {!isMarketplaceFlow && (
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
          )}

          {isMarketplaceFlow && (
            <div className="text-sm bg-zinc-50 dark:bg-zinc-950/20 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <p className="font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                Openfront Integration
              </p>
              <p className="text-zinc-700 dark:text-zinc-300 text-xs">
                This platform will be created with the channel.
              </p>
            </div>
          )}
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
            {isLoading 
              ? 'Connecting...' 
              : 'Connect Channel'
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
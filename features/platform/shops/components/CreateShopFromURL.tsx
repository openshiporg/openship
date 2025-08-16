"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createShop } from "../actions/createShop";
import { createShopPlatform } from "../actions/createShopPlatform";
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
    showCreateShopAndPlatform?: string;
    platform?: string;
    accessToken?: string;
    domain?: string;
    platformInitiated?: string;
    // OAuth parameters from OpenFront
    client_id?: string;
    client_secret?: string;
    app_name?: string;
    scope?: string;
    redirect_uri?: string;
    state?: string;
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
  const [isOAuthFlow, setIsOAuthFlow] = useState(false);
  const [isPlatformInitiated, setIsPlatformInitiated] = useState(false);
  const [isReverseOAuthFlow, setIsReverseOAuthFlow] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [appName, setAppName] = useState('');
  const [oauthParams, setOauthParams] = useState<{
    client_id: string;
    scope: string;
    redirect_uri: string;
    state: string;
  } | null>(null);

  useEffect(() => {
    if (!searchParams) return;
    
    // Check if we should auto-open and pre-fill
    const { 
      showCreateShop,
      showCreateShopAndPlatform,
      platform: urlPlatform, 
      accessToken: urlAccessToken, 
      domain: urlDomain,
      platformInitiated,
      client_id,
      client_secret,
      app_name
    } = searchParams;

    console.log('CreateShopFromURL - Search params:', {
      showCreateShop,
      showCreateShopAndPlatform,
      urlPlatform,
      urlAccessToken,
      urlDomain,
      platformInitiated,
      client_id,
      client_secret,
      app_name
    });

    // Handle reverse OAuth flow (OpenFront → Openship with auto platform/shop creation)
    if (showCreateShopAndPlatform === 'true' && client_id && client_secret && urlAccessToken && urlDomain) {
      console.log('🚀 Reverse OAuth flow detected - auto-create platform and shop');
      setIsReverseOAuthFlow(true);
      setClientId(client_id);
      setClientSecret(client_secret);
      setAppName(app_name || 'OpenFront Integration');
      setAccessToken(urlAccessToken);
      setDomain(decodeURIComponent(urlDomain));
      
      // Auto-generate shop name from domain
      const domainWithoutProtocol = decodeURIComponent(urlDomain).replace(/^https?:\/\//, '');
      const cleanName = domainWithoutProtocol.split('.')[0].replace(/[-_]/g, ' ');
      const capitalizedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1) + ' Store';
      setName(capitalizedName);
      
      setIsDialogOpen(true);

      // Clean URL params
      const newUrl = new URL(window.location.href);
      ['showCreateShopAndPlatform', 'client_id', 'client_secret', 'app_name', 'accessToken', 'domain'].forEach(param => {
        newUrl.searchParams.delete(param);
      });
      router.replace(newUrl.pathname + newUrl.search);
      return;
    }

    // Handle platform-initiated flow (from OpenFront)
    if (showCreateShop === 'true' && urlPlatform && urlDomain && platformInitiated === 'true') {
      console.log('🚀 Platform-initiated flow detected');
      setIsPlatformInitiated(true);
      setPlatformId(urlPlatform);
      setDomain(decodeURIComponent(urlDomain));
      
      // Auto-generate shop name from domain  
      const domainWithoutProtocol = decodeURIComponent(urlDomain).replace(/^https?:\/\//, '');
      const cleanName = domainWithoutProtocol.split('.')[0].replace(/[-_]/g, ' ');
      const capitalizedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1) + ' Store';
      setName(capitalizedName);
      
      setIsDialogOpen(true);

      // Clean URL params
      const newUrl = new URL(window.location.href);
      ['showCreateShop', 'platform', 'domain', 'platformInitiated'].forEach(param => {
        newUrl.searchParams.delete(param);
      });
      router.replace(newUrl.pathname + newUrl.search);
      return;
    }

    // Handle standard OAuth callback flow
    if (showCreateShop === 'true' && urlPlatform && urlAccessToken && urlDomain) {
      console.log('✅ Standard OAuth callback flow');
      setPlatformId(urlPlatform);
      setAccessToken(urlAccessToken);
      setDomain(decodeURIComponent(urlDomain));
      
      // Auto-generate shop name from domain
      const domainWithoutProtocol = decodeURIComponent(urlDomain).replace(/^https?:\/\//, '');
      setName(domainWithoutProtocol);
      
      setIsDialogOpen(true);

      // Clear URL params
      const newUrl = new URL(window.location.href);
      ['showCreateShop', 'platform', 'accessToken', 'domain'].forEach(param => {
        newUrl.searchParams.delete(param);
      });
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

    setIsLoading(true);

    try {
      // Reverse OAuth flow: Find or create platform, then create shop
      if (isReverseOAuthFlow && clientId && clientSecret && accessToken.trim()) {
        console.log('🚀 Processing reverse OAuth flow - find or create platform');
        
        // Import platform management functions
        const { getShopPlatformByClientId } = await import('../actions/getShopPlatformByClientId');
        
        // Check if platform already exists with this client_id
        const platformResult = await getShopPlatformByClientId(clientId);
        let platform = null;
        
        if (platformResult.success && platformResult.data) {
          platform = platformResult.data;
          console.log('✅ Found existing platform:', platform.name);
          toast.success(`Using existing platform: ${platform.name}`);
        } else {
          console.log('📦 Creating new platform for:', appName);
          
          // Create new platform
          const platformResult = await createShopPlatform({
            name: appName + ' (Auto-created)',
            clientId: clientId,
            clientSecret: clientSecret,
            scopes: ['read_products', 'write_products', 'read_orders', 'write_orders'],
            redirectUri: window.location.origin + '/api/oauth/callback',
            domain: domain || 'auto-created'
          });

          if (!platformResult.success) {
            toast.error(platformResult.error || 'Failed to create platform');
            return;
          }
          
          platform = platformResult.data;
          toast.success(`Created new platform: ${platform.name}`);
        }

        // Now create the shop using the platform
        const shopResult = await createShop({
          name: name.trim(),
          domain: domain.trim(),
          accessToken: accessToken.trim(),
          platformId: platform.id,
        });

        if (shopResult.success) {
          toast.success('Shop connected successfully!');
          setIsDialogOpen(false);
          router.refresh();
          
          if (onShopCreated) {
            onShopCreated();
          }
        } else {
          toast.error(shopResult.error || 'Failed to create shop');
        }
        return;
      }

      // Platform-initiated flow: Start OAuth process
      if (isPlatformInitiated && !accessToken.trim()) {
        if (!platformId) {
          toast.error('Platform ID is missing');
          return;
        }
        
        console.log('🚀 Starting OAuth flow for platform-initiated setup');
        
        // Create shop with temporary token first
        const shopResult = await createShop({
          name: name.trim(),
          domain: domain.trim(),
          accessToken: 'oauth-pending',
          platformId,
        });

        if (shopResult.success) {
          toast.success('Shop created! Redirecting for OAuth authorization...');
          
          // Import OAuth flow initiation
          const { initiateOAuthFlow } = await import('../actions/createShop');
          
          // This will redirect to OpenFront for OAuth
          await initiateOAuthFlow(platformId, domain.trim());
          
          // Note: Redirect happens in initiateOAuthFlow
        } else {
          toast.error(shopResult.error || 'Failed to create shop');
        }
        return;
      }

      // Standard flow: Create shop with provided access token
      if (!platformId) {
        toast.error('Platform ID is missing');
        return;
      }
      
      if (!accessToken.trim()) {
        toast.error('Please enter an access token');
        return;
      }

      await createShop({
        name: name.trim(),
        domain: domain.trim(),
        accessToken: accessToken.trim(),
        platformId,
      });

      toast.success('Shop created successfully!');
      setIsDialogOpen(false);
      router.refresh();
      
      // Reset form
      setName('');
      setDomain('');
      setAccessToken('');
      setPlatformId('');
      setIsPlatformInitiated(false);
      
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
    setIsPlatformInitiated(false);
    setIsReverseOAuthFlow(false);
    setClientId('');
    setClientSecret('');
    setAppName('');
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isReverseOAuthFlow 
              ? 'Connect Openfront Store' 
              : isPlatformInitiated 
                ? 'Confirm Shop Connection' 
                : 'Create Shop'
            }
          </DialogTitle>
          <DialogDescription>
            {isReverseOAuthFlow
              ? 'Setting up your OpenFront integration. We\'ll create the platform if needed and connect your store.'
              : isPlatformInitiated 
                ? 'Confirm the details below to connect your OpenFront store to Openship.'
                : 'Complete your shop setup with the OAuth credentials received.'
            }
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

          {!isPlatformInitiated && !isReverseOAuthFlow && (
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

          {isReverseOAuthFlow && (
            <div className="text-sm bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
              <p className="font-medium text-green-900 dark:text-green-100 mb-1">
                ✅ OpenFront Integration Ready
              </p>
              <p className="text-green-700 dark:text-green-300 text-xs">
                OAuth completed successfully. We'll automatically find or create the platform and connect your store.
              </p>
            </div>
          )}

          {isPlatformInitiated && (
            <div className="text-sm bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                🚀 Platform-initiated setup
              </p>
              <p className="text-blue-700 dark:text-blue-300 text-xs">
                This connection was initiated from your OpenFront store. 
                After confirming, you'll be redirected to authorize the connection.
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
            onClick={handleShopCreation}
            disabled={isLoading}
          >
            {isLoading 
              ? (isReverseOAuthFlow ? 'Connecting...' : isPlatformInitiated ? 'Setting up...' : 'Creating...') 
              : (isReverseOAuthFlow ? 'Connect Store' : isPlatformInitiated ? 'Connect & Authorize' : 'Create Shop')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
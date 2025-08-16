"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createShop, initiateOAuthFlow } from "../actions/createShop";
import { createShopPlatform } from "../actions/createShopPlatform";
import { getShopPlatformByClientId } from "../actions/getShopPlatformByClientId";
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

interface OAuthInstallDialogProps {
  searchParams?: {
    showCreateShop?: string;
    client_id?: string;
    scope?: string;
    redirect_uri?: string;
    state?: string;
    domain?: string;
  };
}

export function OAuthInstallDialog({ searchParams }: OAuthInstallDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [platform, setPlatform] = useState<any>(null);
  const router = useRouter();
  
  // Form fields
  const [shopName, setShopName] = useState('');
  const [shopDomain, setShopDomain] = useState('');

  useEffect(() => {
    if (!searchParams?.showCreateShop || !searchParams?.client_id) return;

    const checkAndShowDialog = async () => {
      try {
        // Check if platform exists for this client_id
        const existingPlatform = await getShopPlatformByClientId(searchParams.client_id!);
        
        if (existingPlatform) {
          setPlatform(existingPlatform);
        } else {
          // Create platform automatically
          const newPlatform = await createShopPlatform({
            name: `${searchParams.domain} Shop`,
            clientId: searchParams.client_id!,
            scopes: searchParams.scope?.split(' ') || [],
            redirectUri: searchParams.redirect_uri!,
            domain: searchParams.domain!
          });
          
          if (newPlatform.success) {
            setPlatform(newPlatform.data);
          } else {
            toast.error('Failed to create shop platform');
            return;
          }
        }

        // Pre-fill shop fields
        setShopDomain(searchParams.domain || '');
        setShopName(searchParams.domain?.replace(/^https?:\/\//, '') || '');
        
        // Show dialog
        setIsDialogOpen(true);

        // Clean URL
        const newUrl = new URL(window.location.href);
        ['showCreateShop', 'client_id', 'scope', 'redirect_uri', 'state', 'domain'].forEach(param => {
          newUrl.searchParams.delete(param);
        });
        router.replace(newUrl.pathname + newUrl.search);

      } catch (error) {
        console.error('Error setting up OAuth install dialog:', error);
        toast.error('Failed to set up installation');
      }
    };

    checkAndShowDialog();
  }, [searchParams, router]);

  const handleInstallApp = async () => {
    if (!shopName.trim() || !shopDomain.trim() || !platform) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      // Create the shop first (with temporary access token)
      const shopResult = await createShop({
        name: shopName.trim(),
        domain: shopDomain.trim(),
        accessToken: 'oauth-pending', // Temporary - will be replaced by OAuth
        platformId: platform.id,
      });

      if (shopResult.success) {
        toast.success('Shop created! Redirecting for OAuth authorization...');
        
        // Now initiate the actual OAuth flow using the platform's OAuth function
        // This will redirect to the external platform (OpenFront) for authorization
        await initiateOAuthFlow(platform.id, shopDomain.trim());
        
        // Note: The redirect happens in initiateOAuthFlow, so code after this won't execute
        // After OAuth completes, user will be redirected back via the callback route
        
      } else {
        toast.error(shopResult.error || 'Failed to create shop');
      }
      
    } catch (error) {
      console.error('Error installing app:', error);
      toast.error('Failed to install application');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    // Redirect back to OpenFront with error
    if (searchParams?.redirect_uri && searchParams?.state) {
      const params = new URLSearchParams({
        error: 'access_denied',
        error_description: 'User cancelled authorization',
        state: searchParams.state
      });
      window.location.href = `${searchParams.redirect_uri}?${params.toString()}`;
    }
  };

  if (!searchParams?.showCreateShop || !searchParams?.client_id) {
    return null;
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Install {searchParams.domain} App</DialogTitle>
          <DialogDescription>
            Create a shop connection and authorize access to your OpenShip account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm bg-muted/50 p-3 rounded-lg">
            <p className="font-medium mb-2">This app will request access to:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              {searchParams.scope?.split(' ').map((scope) => (
                <li key={scope}>{scope.replace(':', ' ')}</li>
              ))}
            </ul>
          </div>

          <div>
            <Label htmlFor="shopName">Shop Name</Label>
            <Input
              id="shopName"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Enter shop name"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="shopDomain">Shop Domain</Label>
            <Input
              id="shopDomain"
              value={shopDomain}
              onChange={(e) => setShopDomain(e.target.value)}
              placeholder="shop.example.com"
              disabled={isLoading}
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
            onClick={handleInstallApp}
            disabled={isLoading}
          >
            {isLoading ? 'Creating & Installing...' : 'Create Platform & Install App'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
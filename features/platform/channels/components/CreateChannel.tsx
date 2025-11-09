"use client";
import React, { useState } from "react";
import { useRouter } from 'next/navigation';
import { useQueryClient } from "@tanstack/react-query";
import { Button, buttonVariants } from "@/components/ui/button";
import { CirclePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { createChannel, initiateOAuthFlow } from "../actions/createChannel";
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
import { ChannelPlatformSelect } from "./ChannelPlatformSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateChannelProps {
  onChannelCreated?: () => void;
  trigger?: React.ReactElement;
}

export function CreateChannel({ onChannelCreated, trigger }: CreateChannelProps = {}) {
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

  const handleChannelCreation = async () => {
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

      console.log('Creating channel with:', {
        name,
        domain,
        accessToken,
        platformId: selectedPlatform
      });

      const result = await createChannel({
        name,
        domain,
        accessToken,
        platformId: selectedPlatform
      });

      if (result.success) {
        toast.success('Channel created successfully');
        setIsDialogOpen(false);
        // Invalidate React Query cache to refetch channels
        // Use exact: false to match all queries that start with this key
        await queryClient.invalidateQueries({
          queryKey: ['lists', 'Channel', 'items'],
          exact: false
        });
        onChannelCreated?.();
      } else {
        toast.error(result.error || 'Failed to create channel');
      }
    } catch (error) {
      console.error('Error creating channel:', error);
      toast.error('An error occurred while creating the channel');
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
            <span className="hidden lg:inline">Create Channel</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
          <DialogDescription>
            Connect a new sales channel to your platform
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <ChannelPlatformSelect 
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
                    placeholder="your-channel-domain.com"
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
                      placeholder="Channel name"
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
                      placeholder="your-channel-domain.com"
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
            onClick={handleChannelCreation}
          >
            {isLoading ? "Creating..." : 
             (selectedPlatformData?.oAuthFunction && selectedPlatformData?.oAuthCallbackFunction && selectedPlatformData?.appKey && selectedPlatformData?.appSecret
              ? `Install App on ${selectedPlatformData.name}` : "Create Channel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
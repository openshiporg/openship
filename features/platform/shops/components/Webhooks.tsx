"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2, Plus, Info, CircleAlert } from "lucide-react";
import { 
  createShopWebhook, 
  deleteShopWebhook 
} from "../actions/webhooks";



const WebhookItem = ({ webhook, onRefresh, shopId }: {
  webhook: any;
  onRefresh: () => void;
  shopId: string;
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDisable = async () => {
    setLoading(true);
    try {
      const response = await deleteShopWebhook(shopId, webhook.id);

      if (response.success) {
        toast({
          title: "Webhook disabled successfully",
        });
        onRefresh();
      } else {
        toast({
          title: "Failed to disable webhook",
          description: response.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Failed to disable webhook",
        description: err.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Header like code editor */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          {/* Green animated pulse icon for enabled webhooks */}
          <div className="rounded-full text-green-400 bg-green-400/20 p-1">
            <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
          </div>
          <span className="text-sm font-medium">{webhook.topic}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="text-muted-foreground w-3 h-3" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-64">
                <p>Webhook is currently enabled and active</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={handleDisable}
          disabled={loading}
        >
          {loading ? "Disabling..." : "Disable"}
        </Button>
      </div>
      
      {/* Code area with callback URL */}
      <div className="p-4 font-mono text-sm bg-background">
        <div className="text-muted-foreground break-all">
          {webhook.callbackUrl}
        </div>
      </div>
    </div>
  );
};

const RecommendedWebhookItem = ({ webhook, onRefresh, shopId }: {
  webhook: any;
  onRefresh: () => void;
  shopId: string;
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleEnable = async () => {
    console.log("🔥 [WEBHOOK UI] Button clicked - Starting webhook creation");
    console.log("🔥 [WEBHOOK UI] shopId:", shopId);
    console.log("🔥 [WEBHOOK UI] webhook.topic:", webhook.topic);
    console.log("🔥 [WEBHOOK UI] webhook.callbackUrl:", webhook.callbackUrl);
    
    // Get base URL and prepend to relative callback URL
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : "https://macbook-pro-3.tail272f03.ts.net";
    const finalEndpoint = `${baseUrl}${webhook.callbackUrl}`;
    console.log("🔥 [WEBHOOK UI] baseUrl:", baseUrl);
    console.log("🔥 [WEBHOOK UI] finalEndpoint:", finalEndpoint);
    
    setLoading(true);
    try {
      console.log("🔥 [WEBHOOK UI] Calling createShopWebhook with:", {
        shopId,
        topic: webhook.topic,
        endpoint: finalEndpoint
      });
      
      const response = await createShopWebhook(
        shopId,
        webhook.topic,
        finalEndpoint
      );

      console.log("🔥 [WEBHOOK UI] Response received:", response);

      if (response.success) {
        console.log("🔥 [WEBHOOK UI] Success! Webhook created with ID:", response.data?.webhookId);
        toast({
          title: "Webhook enabled successfully",
        });
        onRefresh();
      } else {
        console.error("🔥 [WEBHOOK UI] Failed to create webhook:", response.error);
        toast({
          title: "Failed to enable webhook",
          description: response.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("🔥 [WEBHOOK UI] Exception caught:", err);
      console.error("🔥 [WEBHOOK UI] Exception stack:", err.stack);
      toast({
        title: "Failed to enable webhook",
        description: err.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Header like code editor */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          {/* Red animated pulse icon for disabled webhooks */}
          <div className="rounded-full text-red-400 bg-red-400/20 p-1">
            <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
          </div>
          <span className="text-sm font-medium">{webhook.topic}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="text-muted-foreground w-3 h-3" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-64">
                <p>{webhook.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={handleEnable}
          disabled={loading}
        >
          {loading ? "Enabling..." : "Enable"}
        </Button>
      </div>
      
      {/* Code area with callback URL */}
      <div className="p-4 font-mono text-sm bg-background">
        <div className="text-muted-foreground break-all">
          {(typeof window !== 'undefined' ? window.location.origin : '')}{webhook.callbackUrl}
        </div>
      </div>
    </div>
  );
};

export const Webhooks = ({ shopId, shop }: { shopId: string; shop?: any }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  
  const webhookData = shop?.webhooks;
  const webhooks = webhookData?.data?.webhooks || [];
  const recommendedWebhooks = webhookData?.recommendedWebhooks || [];

  const loadWebhooks = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!webhookData) {
    return <div>Loading webhooks...</div>;
  }

  if (!webhookData.success) {
    return (
      <div className="rounded-md border border-red-500/50 px-4 py-3 text-red-600">
        <p className="text-sm">
          <CircleAlert
            className="me-3 -mt-0.5 inline-flex opacity-60"
            size={16}
            aria-hidden="true"
          />
          Error loading webhooks: {webhookData?.error || "Unknown error"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Enabled webhooks */}
      {webhooks.length > 0 && (
        <div className="space-y-3">
          {webhooks.map((webhook: any) => (
            <WebhookItem
              key={webhook.id}
              webhook={webhook}
              onRefresh={loadWebhooks}
              shopId={shopId}
            />
          ))}
        </div>
      )}

      {/* Disabled/Recommended webhooks */}
      <div className="space-y-3">
        {recommendedWebhooks.map((webhook: any) => {
          const fullRecommendedUrl = (typeof window !== 'undefined' ? window.location.origin : '') + webhook.callbackUrl;

          const existingWebhook = webhooks.find(
            (w: any) => {
              const existingTopic = Array.isArray(w.topic) ? w.topic[0] : w.topic;
              return existingTopic === webhook.topic &&
                w.callbackUrl === fullRecommendedUrl;
            }
          );
          
          return !existingWebhook ? (
            <RecommendedWebhookItem
              key={`${webhook.topic}-${fullRecommendedUrl}`}
              webhook={webhook}
              onRefresh={loadWebhooks}
              shopId={shopId}
            />
          ) : null;
        })}
      </div>
    </div>
  );
};
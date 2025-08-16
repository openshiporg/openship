"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Settings, Key, ExternalLink } from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EditItemDrawerClientWrapper } from "@/features/platform/components/EditItemDrawerClientWrapper";
import type { ApiKey } from "../actions/getApiKeys";
import {
  differenceInHours,
  format,
  parseISO,
  differenceInMinutes,
} from "date-fns";

interface ApiKeyDetailsComponentProps {
  apiKey: ApiKey;
  loadingActions?: Record<string, Record<string, boolean>>;
  removeEditItemButton?: boolean;
  renderButtons?: () => React.ReactNode;
}

export const ApiKeyDetailsComponent = ({
  apiKey,
  loadingActions = {},
  removeEditItemButton,
  renderButtons,
}: ApiKeyDetailsComponentProps) => {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  const currentAction = Object.entries(loadingActions).find(
    ([_, value]) => value[apiKey.id]
  )?.[0];

  const getLoadingText = (action: string) => {
    switch (action) {
      case "deleteApiKey":
        return "Deleting API Key";
      default:
        return "Loading";
    }
  };

  const usageCount = apiKey.usageCount?.total || 0;
  const isExpired = apiKey.expiresAt && new Date() > new Date(apiKey.expiresAt);

  function formatDate(dateString: string) {
    const date = parseISO(dateString);
    const now = new Date();
    const minutesDifference = differenceInMinutes(now, date);
    const hoursDifference = differenceInHours(now, date);

    if (minutesDifference < 60) {
      return `${minutesDifference} minutes ago`;
    } else if (hoursDifference < 24) {
      return `${hoursDifference} hours ago`;
    } else {
      return format(date, "PPP");
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "inactive":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "revoked":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  }

  return (
    <>
      <div className="group relative rounded-xl overflow-hidden border bg-background/50 backdrop-blur-sm transition-all duration-200">
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/40 to-transparent dark:from-background/10 dark:via-background/5 dark:to-transparent pointer-events-none" />
        <div className="relative px-4 py-4 flex gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="self-start">
              <Badge
                color="orange"
                className="uppercase tracking-wide border-2 text-xl flex items-center justify-center w-14 h-14 font-medium rounded-[calc(theme(borderRadius.xl)-1px)]"
              >
                {apiKey.name.slice(0, 2)}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <h3 className="mr-2">{apiKey.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(apiKey.status)}`}>
                  {apiKey.status}
                </span>
                {isExpired && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    Expired
                  </span>
                )}
              </div>

              <div className="flex flex-wrap flex-col sm:flex-row sm:items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm">
                <div className="text-muted-foreground/75 flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {apiKey.tokenPreview}
                  </code>
                </div>
                <span className="hidden sm:block size-1 rounded-full bg-muted-foreground/50" />
                <div className="text-muted-foreground text-xs">
                  {apiKey.scopes.length} scope{apiKey.scopes.length !== 1 ? 's' : ''}
                </div>
                <span className="hidden sm:block size-1 rounded-full bg-muted-foreground/50" />
                <div className="text-muted-foreground text-xs">
                  {usageCount} request{usageCount !== 1 ? 's' : ''}
                </div>
                <span className="hidden sm:block size-1 rounded-full bg-muted-foreground/50" />
                <p className="text-muted-foreground text-sm font-light">
                  {apiKey.lastUsedAt 
                    ? `Last used ${formatDate(apiKey.lastUsedAt)}`
                    : "Never used"
                  }
                </p>
              </div>

              {apiKey.scopes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {apiKey.scopes.slice(0, 3).map((scope) => (
                    <span
                      key={scope}
                      className="px-2 py-1 text-xs bg-muted rounded-md text-muted-foreground"
                    >
                      {scope}
                    </span>
                  ))}
                  {apiKey.scopes.length > 3 && (
                    <span className="px-2 py-1 text-xs bg-muted rounded-md text-muted-foreground">
                      +{apiKey.scopes.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="border [&_svg]:size-3 h-6 w-6"
              onClick={() => setIsEditDrawerOpen(true)}
            >
              <MoreVertical />
            </Button>
          </div>
        </div>
      </div>

      <EditItemDrawerClientWrapper
        listKey="apiKeys"
        itemId={apiKey.id}
        open={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
      />
    </>
  );
};
"use client";

import React from "react";
import { PlatformTabs } from "./PlatformTabs";

interface Platform {
  id: string;
  name: string;
  count?: number;
}

interface PlatformWrapperProps {
  platforms: Platform[];
  totalCount: number;
  onAddPlatform?: () => void;
  onEditPlatform?: (platformId: string) => void;
  renderAddButton?: () => React.ReactNode;
  renderEditButton?: (platform: Platform) => React.ReactNode;
  children?: React.ReactNode;
}

export function PlatformWrapper({ 
  platforms,
  totalCount,
  onAddPlatform,
  onEditPlatform,
  renderAddButton,
  renderEditButton,
  children
}: PlatformWrapperProps) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-800">
      <PlatformTabs
        platforms={platforms}
        totalCount={totalCount}
        onAddPlatform={onAddPlatform}
        onEditPlatform={onEditPlatform}
        renderAddButton={renderAddButton}
        renderEditButton={renderEditButton}
      />
      
      {children && (
        <div className="px-4 md:px-6 pb-4">
          {children}
        </div>
      )}
    </div>
  );
}

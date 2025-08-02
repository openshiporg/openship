"use client";
import React from "react";
import { PlatformCard } from "./PlatformCard";
import { useRouter, useSearchParams } from "next/navigation";

interface PlatformSectionProps {
  platforms: any[];
  initialSelectedPlatform: string | null;
}

export function PlatformSection({ platforms, initialSelectedPlatform }: PlatformSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setSelectedPlatform = (platformId: string | null) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (platformId) {
      params.set("platform", platformId);
    } else {
      params.delete("platform");
    }
    params.set("page", "1"); // Reset to first page
    router.push(`/dashboard/platform/shops?${params.toString()}`);
  };

  return (
    <PlatformCard
      platforms={platforms}
      setSelectedPlatform={setSelectedPlatform}
    />
  );
}
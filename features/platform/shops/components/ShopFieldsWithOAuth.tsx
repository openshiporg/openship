'use client';

import React from 'react';
import { Fields } from "@/features/dashboard/components/Fields";
import { getFilteredProps } from "./CreatePlatform";

interface ShopFieldsWithOAuthProps {
  platform: {
    id: string;
    name: string;
    oAuthFunction?: string;
    oAuthCallbackFunction?: string;
    appKey?: string;
    appSecret?: string;
  };
  props: any;
}

export function ShopFieldsWithOAuth({ platform, props }: ShopFieldsWithOAuthProps) {
  let modifications = [];

  // Follow V3 logic exactly
  if (
    platform.appKey &&
    platform.appSecret &&
    platform.oAuthFunction &&
    platform.oAuthCallbackFunction
  ) {
    // OAuth platform - only show domain, hide name and accessToken
    modifications = [{ key: "domain" }];
  } else {
    // Manual platform - show name, domain, accessToken
    modifications = [
      { key: "name" },
      { key: "domain" },
      { key: "accessToken" },
    ];
  }

  const filteredProps = getFilteredProps(props, modifications, false);

  if (!filteredProps?.fields) return null;

  return <Fields {...filteredProps} />;
}
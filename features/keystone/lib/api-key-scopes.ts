/**
 * API Key Scopes to Permission Mapping
 * 
 * This file maps API key scopes (used by external integrations) to internal permissions.
 * When an API key has a certain scope, it grants the mapped permissions.
 */

import type { ApiKeyScope } from '../models/ApiKey';

export type OpenseaPermission = 
  | "canSeeOtherUsers"
  | "canEditOtherUsers"
  | "canManageUsers"
  | "canManageRoles"
  | "canAccessDashboard"
  | "canSeeOtherShops"
  | "canManageShops"
  | "canCreateShops"
  | "canSeeOtherChannels"
  | "canManageChannels"
  | "canCreateChannels"
  | "canSeeOtherOrders"
  | "canManageOrders"
  | "canProcessOrders"
  | "canSeeOtherMatches"
  | "canManageMatches"
  | "canCreateMatches"
  | "canSeeOtherLinks"
  | "canManageLinks"
  | "canCreateLinks"
  | "canManagePlatforms"
  | "canViewPlatformMetrics"
  | "canManageApiKeys"
  | "canCreateApiKeys"
  | "canAccessAnalytics"
  | "canExportData"
  | "canManageWebhooks";

/**
 * Maps API key scopes to internal permissions
 */
export const SCOPE_TO_PERMISSIONS: Record<ApiKeyScope, OpenseaPermission[]> = {
  // Orders
  "read_orders": ["canSeeOtherOrders"],
  "write_orders": ["canSeeOtherOrders", "canManageOrders", "canProcessOrders"],
  
  // Products (these don't have direct permissions but follow the pattern)
  "read_products": [],
  "write_products": [],
  
  // Shops
  "read_shops": ["canSeeOtherShops"],
  "write_shops": ["canSeeOtherShops", "canManageShops", "canCreateShops"],
  
  // Channels
  "read_channels": ["canSeeOtherChannels"],
  "write_channels": ["canSeeOtherChannels", "canManageChannels", "canCreateChannels"],
  
  // Matches
  "read_matches": ["canSeeOtherMatches"],
  "write_matches": ["canSeeOtherMatches", "canManageMatches", "canCreateMatches"],
  
  // Links
  "read_links": ["canSeeOtherLinks"],
  "write_links": ["canSeeOtherLinks", "canManageLinks", "canCreateLinks"],
  
  // Platforms
  "read_platforms": ["canViewPlatformMetrics"],
  "write_platforms": ["canViewPlatformMetrics", "canManagePlatforms"],
  
  // Webhooks
  "read_webhooks": ["canManageWebhooks"], // Read webhooks requires manage permission
  "write_webhooks": ["canManageWebhooks"],
  
  // Analytics
  "read_analytics": ["canAccessAnalytics", "canExportData"],
  
  // Users
  "read_users": ["canSeeOtherUsers"],
  "write_users": ["canSeeOtherUsers", "canEditOtherUsers", "canManageUsers", "canManageRoles"],
};

/**
 * Gets all permissions for a given set of API key scopes
 */
export function getPermissionsForApiKeyScopes(scopes: ApiKeyScope[]): OpenseaPermission[] {
  const permissions = new Set<OpenseaPermission>();
  
  scopes.forEach(scope => {
    const scopePermissions = SCOPE_TO_PERMISSIONS[scope];
    if (scopePermissions) {
      scopePermissions.forEach(permission => permissions.add(permission));
    }
  });
  
  return Array.from(permissions);
}

/**
 * Checks if a set of API key scopes grants a specific permission
 */
export function hasApiKeyPermission(scopes: ApiKeyScope[], permission: OpenseaPermission): boolean {
  return getPermissionsForApiKeyScopes(scopes).includes(permission);
}

/**
 * Helper function to check if API key scopes grant a permission
 */
export function checkApiKeyPermission(session: any, permission: OpenseaPermission): boolean {
  if (!session?.apiKeyScopes) return false;
  
  const scopes = session.apiKeyScopes as ApiKeyScope[];
  return hasApiKeyPermission(scopes, permission);
}
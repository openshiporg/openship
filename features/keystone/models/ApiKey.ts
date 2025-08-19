import {
  text,
  password,
  relationship,
  multiselect,
  select,
  timestamp,
  json,
} from "@keystone-6/core/fields";
import { list } from "@keystone-6/core";
import { isSignedIn, rules, permissions } from "../access";
import { trackingFields } from "./trackingFields";
import { generateApiKeyTokenSync, hashApiKeySync } from "../lib/crypto-utils";

// Define available API key scopes (using underscore format like OpenFront)
export const API_KEY_SCOPES = {
  // Orders
  "read_orders": "View orders",
  "write_orders": "Manage orders",
  
  // Products  
  "read_products": "View products",
  "write_products": "Manage products",
  
  // Shops
  "read_shops": "View shops", 
  "write_shops": "Manage shops",
  
  // Channels
  "read_channels": "View channels",
  "write_channels": "Manage channels",
  
  // Matches
  "read_matches": "View product matches",
  "write_matches": "Manage product matches",
  
  // Links
  "read_links": "View automation links",
  "write_links": "Manage automation links",
  
  // Platforms
  "read_platforms": "View platform configurations",
  "write_platforms": "Manage platform configurations",
  
  // Webhooks
  "read_webhooks": "View webhook configurations",
  "write_webhooks": "Manage webhook configurations",
  
  // Analytics
  "read_analytics": "View analytics data",
  
  // Users
  "read_users": "View users",
  "write_users": "Manage users and permissions",
} as const;

export type ApiKeyScope = keyof typeof API_KEY_SCOPES;

// Generate secure API key token
function generateApiKeyToken(): string {
  return generateApiKeyTokenSync();
}

// Hash API key for secure storage
function hashApiKey(key: string): string {
  return hashApiKeySync(key);
}

export const ApiKey = list({
  access: {
    operation: {
      query: isSignedIn,
      create: permissions.canCreateApiKeys,
      update: permissions.canManageApiKeys,
      delete: permissions.canManageApiKeys,
    },
    filter: {
      query: rules.canReadApiKeys,
      update: rules.canManageApiKeys,
      delete: rules.canManageApiKeys,
    },
  },
  hooks: {
    validate: {
      create: async ({ resolvedData, addValidationError }) => {
        if (!resolvedData.scopes || resolvedData.scopes.length === 0) {
          addValidationError('At least one scope is required for API keys');
        }
      },
    },
    resolveInput: {
      create: async ({ resolvedData, context }) => {
        // Auto-assign user relationship
        return {
          ...resolvedData,
          user: resolvedData.user || (context.session?.itemId ? { connect: { id: context.session.itemId } } : undefined),
        };
      },
    },
  },
  fields: {
    name: text({
      validation: { isRequired: true },
      ui: {
        description: "A descriptive name for this API key (e.g. 'Production Bot', 'Analytics Dashboard')",
      },
    }),
    
    tokenSecret: password({
      validation: { isRequired: true },
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "hidden" },
        listView: { fieldMode: "hidden" },
        description: "Secure API key token (hashed and never displayed)",
      },
    }),
    
    tokenPreview: text({
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
        listView: { fieldMode: "read" },
        description: "Preview of the API key (actual key is hidden for security)",
      },
    }),
    
    scopes: json({
      defaultValue: [],
      ui: {
        description: "Array of scopes for this API key. Available scopes: orders:read, orders:write, shops:read, shops:write, channels:read, channels:write, etc.",
      },
    }),
    
    status: select({
      type: 'enum',
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Revoked", value: "revoked" },
      ],
      defaultValue: "active",
      ui: {
        description: "Current status of this API key",
      },
    }),
    
    expiresAt: timestamp({
      ui: {
        description: "When this API key expires (optional - leave blank for no expiration)",
      },
    }),
    
    lastUsedAt: timestamp({
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
        description: "Last time this API key was used",
      },
    }),
    
    usageCount: json({
      defaultValue: { total: 0, daily: {} },
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
        description: "Usage statistics for this API key",
      },
    }),
    
    restrictedToIPs: json({
      defaultValue: [],
      ui: {
        description: "Optional: Restrict this key to specific IP addresses (array of IPs)",
      },
    }),
    
    user: relationship({
      ref: "User.apiKeys",
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
      },
    }),
    
    ...trackingFields,
  },
  
  ui: {
    labelField: "name",
    listView: {
      initialColumns: ["name", "tokenPreview", "scopes", "status", "lastUsedAt", "expiresAt"],
    },
    description: "Secure API keys for programmatic access to Openship",
  },
});

// Helper function to validate API key tokens using password field
export async function validateApiKeyToken(
  apiKeyId: string,
  token: string,
  context: any
): Promise<boolean> {
  try {
    // Use Keystone's built-in password verification through createAuth
    // This is a simplified approach - we'll handle this in the authentication layer
    const result = await context.query.ApiKey.authenticateItemWithPassword({
      identifier: apiKeyId,
      secret: token,
      identityField: 'id',
      secretField: 'tokenSecret'
    });
    
    return result.success;
  } catch (error) {
    return false;
  }
}

// Simplified validation function for API keys
export async function validateApiKey(
  token: string,
  requiredScopes: ApiKeyScope[] = [],
  context: any
): Promise<{
  valid: boolean;
  user?: any;
  scopes?: ApiKeyScope[];
  error?: string;
}> {
  if (!token || !token.startsWith('osp_')) {
    return { valid: false, error: 'Invalid API key format' };
  }
  
  // This will be handled differently - we'll need to update the keystone/index.ts
  // authentication logic to use the password field directly
  // For now, return a placeholder that will be updated in the auth layer
  return { valid: false, error: 'API key validation moved to auth layer' };
}

// Scope validation helper
export function hasScope(userScopes: ApiKeyScope[], requiredScope: ApiKeyScope): boolean {
  // Check for specific scope
  return userScopes.includes(requiredScope);
}

// Check if user has any of the required scopes
export function hasAnyScope(userScopes: ApiKeyScope[], requiredScopes: ApiKeyScope[]): boolean {
  return requiredScopes.some(scope => hasScope(userScopes, scope));
}

// Map scopes to Openship permissions
export function getPermissionsForScopes(scopes: ApiKeyScope[]): string[] {
  const permissions = new Set<string>();
  
  scopes.forEach(scope => {
    switch (scope) {
      case 'read_orders':
        permissions.add('canReadOrders');
        break;
      case 'write_orders':
        permissions.add('canReadOrders');
        permissions.add('canManageOrders');
        permissions.add('canProcessOrders');
        break;
      case 'read_products':
        // Add product read permissions
        break;
      case 'write_products':
        // Add product write permissions
        break;
      case 'read_shops':
        permissions.add('canReadShops');
        break;
      case 'write_shops':
        permissions.add('canReadShops');
        permissions.add('canManageShops');
        permissions.add('canCreateShops');
        break;
      case 'read_channels':
        permissions.add('canReadChannels');
        break;
      case 'write_channels':
        permissions.add('canReadChannels');
        permissions.add('canManageChannels');
        permissions.add('canCreateChannels');
        break;
      case 'read_users':
        permissions.add('canReadUsers');
        break;
      case 'write_users':
        permissions.add('canReadUsers');
        permissions.add('canManageUsers');
        permissions.add('canManageRoles');
        break;
    }
  });
  
  return Array.from(permissions);
}
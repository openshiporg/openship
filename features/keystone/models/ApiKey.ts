import {
  text,
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
      create: async ({ listKey, operation, inputData, item, resolvedData, context }) => {
        // Note: item is undefined for create operations per KeystoneJS docs
        if (operation !== 'create') {
          throw new Error('This hook should only run for create operations');
        }
        
        // Generate secure token and hash it
        const token = generateApiKeyToken();
        const tokenHash = hashApiKey(token);
        
        // Store the token in context so we can return it in the mutation
        (context as any)._createdApiKeyToken = token;
        
        return {
          ...resolvedData,
          tokenHash,
          tokenPreview: `${token.substring(0, 12)}...${token.substring(token.length - 4)}`,
          token: token, // Store the full token in the database field
          user: resolvedData.user || (context.session?.itemId ? { connect: { id: context.session.itemId } } : undefined),
        };
      },
    },
    afterOperation: {
      create: async ({ listKey, operation, item, resolvedData, context }) => {
        // Add the real token to the returned item so GraphQL can access it
        if (operation === 'create' && (context as any)._createdApiKeyToken) {
          return {
            ...item,
            token: (context as any)._createdApiKeyToken
          };
        }
        return item;
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
    
    tokenHash: text({
      validation: { isRequired: true },
      isIndexed: "unique",
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "hidden" },
        listView: { fieldMode: "hidden" },
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
    
    token: text({
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "hidden" },
        listView: { fieldMode: "hidden" },
        description: "Full API key token (only available during creation)",
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

// Helper functions for API key validation
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
  
  const tokenHash = hashApiKeySync(token);
  
  const apiKey = await context.query.ApiKey.findOne({
    where: { tokenHash },
    query: `
      id
      name
      scopes
      status
      expiresAt
      usageCount
      restrictedToIPs
      user { id name email }
    `,
  });
  
  if (!apiKey) {
    return { valid: false, error: 'API key not found' };
  }
  
  if (apiKey.status !== 'active') {
    return { valid: false, error: `API key is ${apiKey.status}` };
  }
  
  if (apiKey.expiresAt && new Date() > new Date(apiKey.expiresAt)) {
    // Auto-revoke expired keys
    await context.query.ApiKey.updateOne({
      where: { id: apiKey.id },
      data: { status: 'revoked' },
    });
    return { valid: false, error: 'API key has expired' };
  }
  
  // Check if key has required scopes
  const keyScopes = apiKey.scopes || [];
  const missingScopes = requiredScopes.filter(scope => !keyScopes.includes(scope));
  
  if (missingScopes.length > 0) {
    return { 
      valid: false, 
      error: `Missing required scopes: ${missingScopes.join(', ')}` 
    };
  }
  
  // Update usage statistics
  const today = new Date().toISOString().split('T')[0];
  const usage = apiKey.usageCount || { total: 0, daily: {} };
  usage.total = (usage.total || 0) + 1;
  usage.daily[today] = (usage.daily[today] || 0) + 1;
  
  // Update last used and usage count (async, don't wait)
  context.query.ApiKey.updateOne({
    where: { id: apiKey.id },
    data: {
      lastUsedAt: new Date(),
      usageCount: usage,
    },
  }).catch(console.error);
  
  return {
    valid: true,
    user: apiKey.user,
    scopes: keyScopes,
  };
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
      case 'orders:read':
        permissions.add('canReadOrders');
        break;
      case 'orders:write':
        permissions.add('canReadOrders');
        permissions.add('canManageOrders');
        permissions.add('canProcessOrders');
        break;
      case 'products:read':
        // Add product read permissions
        break;
      case 'products:write':
        // Add product write permissions
        break;
      case 'shops:read':
        permissions.add('canReadShops');
        break;
      case 'shops:write':
        permissions.add('canReadShops');
        permissions.add('canManageShops');
        permissions.add('canCreateShops');
        break;
      case 'channels:read':
        permissions.add('canReadChannels');
        break;
      case 'channels:write':
        permissions.add('canReadChannels');
        permissions.add('canManageChannels');
        permissions.add('canCreateChannels');
        break;
      case 'users:read':
        permissions.add('canReadUsers');
        break;
      case 'users:write':
        permissions.add('canReadUsers');
        permissions.add('canManageUsers');
        permissions.add('canManageRoles');
        break;
    }
  });
  
  return Array.from(permissions);
}
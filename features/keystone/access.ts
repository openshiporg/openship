// Keystone 6 Access Control - Following Official Documentation
// https://keystonejs.com/docs/config/access-control

import { checkApiKeyPermission, type OpenseaPermission } from './lib/api-key-scopes';

export type Session = {
  itemId: string
  listKey: string
  data: {
    id: string
    name: string
    email: string
    role: {
      id: string
      name: string
      // Basic Dashboard Permissions
      canSeeOtherUsers: boolean
      canEditOtherUsers: boolean
      canManageUsers: boolean
      canManageRoles: boolean
      canAccessDashboard: boolean
      
      // E-commerce Platform Permissions
      // Shop Management
      canSeeOtherShops: boolean
      canManageShops: boolean
      canCreateShops: boolean
      
      // Channel Management
      canSeeOtherChannels: boolean
      canManageChannels: boolean
      canCreateChannels: boolean
      
      // Order Management
      canSeeOtherOrders: boolean
      canManageOrders: boolean
      canProcessOrders: boolean
      
      // Product & Inventory Management
      canSeeOtherMatches: boolean
      canManageMatches: boolean
      canCreateMatches: boolean
      
      // Linking System
      canSeeOtherLinks: boolean
      canManageLinks: boolean
      canCreateLinks: boolean
      
      // Platform Integration
      canManagePlatforms: boolean
      canViewPlatformMetrics: boolean
      
      // API Key Management
      canManageApiKeys: boolean
      canCreateApiKeys: boolean
      
      // Advanced Features
      canAccessAnalytics: boolean
      canExportData: boolean
      canManageWebhooks: boolean
    }
  }
}

// Standard Keystone Access Control Arguments
type OperationAccessArgs = {
  session?: Session
  context: any
  listKey: string
  operation: string
}

type FilterAccessArgs = {
  session?: Session
  context: any
  listKey: string
  operation: string
}

type ItemAccessArgs = {
  session?: Session
  context: any
  listKey: string
  operation: string
  inputData?: any
  item?: any
}

type FieldAccessArgs = {
  session?: Session
  context: any
  listKey: string
  fieldKey: string
  operation: string
  inputData?: any
  item?: any
}

// Basic Authentication Check
export const isSignedIn = ({ session }: OperationAccessArgs): boolean => {
  return Boolean(session)
}

// An API key gets its owner's role, limited to the key's scopes.
function hasPermission(session: any, permission: OpenseaPermission): boolean {
  if (!session?.data?.role?.[permission]) return false;
  return !session.apiKeyScopes || checkApiKeyPermission(session, permission);
}

// Any signed-in user; an API key also needs a scope that maps to `permission`.
// Filter rules still limit what the user can see or change.
export const isSignedInFor = (permission: OpenseaPermission) =>
  ({ session }: OperationAccessArgs): boolean =>
    Boolean(session) &&
    (!(session as any).apiKeyScopes || checkApiKeyPermission(session, permission));

// Permission Functions - Operation Level Access Control
export const permissions = {
  // Basic Dashboard Permissions
  canSeeOtherUsers: ({ session }: OperationAccessArgs): boolean => 
    hasPermission(session, "canSeeOtherUsers"),
  
  canEditOtherUsers: ({ session }: OperationAccessArgs): boolean => 
    hasPermission(session, "canEditOtherUsers"),
  
  canManageUsers: ({ session }: OperationAccessArgs): boolean => 
    hasPermission(session, "canManageUsers"),
  
  canManageRoles: ({ session }: OperationAccessArgs): boolean => 
    hasPermission(session, "canManageRoles"),
  
  canAccessDashboard: ({ session }: OperationAccessArgs): boolean => 
    hasPermission(session, "canAccessDashboard"),
  
  // E-commerce Platform Permissions
  // Shop Management
  canSeeOtherShops: ({ session }: OperationAccessArgs): boolean => 
    hasPermission(session, "canSeeOtherShops"),
  
  canManageShops: ({ session }: OperationAccessArgs): boolean => 
    hasPermission(session, "canManageShops"),
  
  canCreateShops: ({ session }: OperationAccessArgs): boolean => 
    hasPermission(session, "canCreateShops"),
  
  // Channel Management
  canSeeOtherChannels: ({ session }: OperationAccessArgs): boolean => 
    hasPermission(session, "canSeeOtherChannels"),
  
  canManageChannels: ({ session }: OperationAccessArgs): boolean => 
    hasPermission(session, "canManageChannels"),
  
  canCreateChannels: ({ session }: OperationAccessArgs): boolean => 
    hasPermission(session, "canCreateChannels"),
  
  canUpdateChannels: ({ session }: OperationAccessArgs): boolean => 
    hasPermission(session, "canManageChannels"),
  
  // Order Management
  canSeeOtherOrders: ({ session }: OperationAccessArgs): boolean => 
    hasPermission(session, "canSeeOtherOrders"),
  
  canManageOrders: ({ session }: OperationAccessArgs): boolean => 
    hasPermission(session, "canManageOrders"),
  
  canProcessOrders: ({ session }: OperationAccessArgs): boolean => 
    hasPermission(session, "canProcessOrders"),
  
  // Product & Inventory Management
  canSeeOtherMatches: ({ session }: OperationAccessArgs): boolean => 
    hasPermission(session, "canSeeOtherMatches"),
  
  canManageMatches: ({ session }: OperationAccessArgs): boolean => 
    hasPermission(session, "canManageMatches"),
  
  canCreateMatches: ({ session }: OperationAccessArgs): boolean => 
    hasPermission(session, "canCreateMatches"),
  
  // Linking System
  canSeeOtherLinks: ({ session }: OperationAccessArgs): boolean => 
    hasPermission(session, "canSeeOtherLinks"),
  
  canManageLinks: ({ session }: OperationAccessArgs): boolean => 
    hasPermission(session, "canManageLinks"),
  
  canCreateLinks: ({ session }: OperationAccessArgs): boolean => 
    hasPermission(session, "canCreateLinks"),
  
  // Platform Integration
  canManagePlatforms: ({ session }: OperationAccessArgs): boolean => 
    hasPermission(session, "canManagePlatforms"),
  
  canViewPlatformMetrics: ({ session }: OperationAccessArgs): boolean => 
    hasPermission(session, "canViewPlatformMetrics"),
  
  // API Key Management
  canManageApiKeys: ({ session }: OperationAccessArgs): boolean => 
    hasPermission(session, "canManageApiKeys"),
  
  canCreateApiKeys: ({ session }: OperationAccessArgs): boolean => 
    hasPermission(session, "canCreateApiKeys"),
  
  // Advanced Features
  canAccessAnalytics: ({ session }: OperationAccessArgs): boolean => 
    hasPermission(session, "canAccessAnalytics"),
  
  canExportData: ({ session }: OperationAccessArgs): boolean => 
    hasPermission(session, "canExportData"),
  
  canManageWebhooks: ({ session }: OperationAccessArgs): boolean => 
    hasPermission(session, "canManageWebhooks"),
}

// Filter Rules - Filter Level Access Control
export const rules = {
  // User Rules
  canReadPeople: ({ session }: FilterAccessArgs) => {
    if (!session) return false

    // Admin can see all users
    if (session.data.role?.canSeeOtherUsers) return true

    // Users can only see themselves
    return { id: { equals: session.itemId } }
  },
  
  canUpdatePeople: ({ session }: FilterAccessArgs) => {
    if (!session) return false

    // Admin can edit all users
    if (session.data.role?.canEditOtherUsers) return true

    // Users can only edit themselves
    return { id: { equals: session.itemId } }
  },
  
  // E-commerce Multi-tenant Rules
  // Shop Rules - users can only access their own shops unless they have permission
  canReadShops: ({ session }: FilterAccessArgs) => {
    if (!session) return false
    
    // Admin can see all shops
    if (session.data.role?.canSeeOtherShops) return true
    
    // Users can only see their own shops
    return { user: { id: { equals: session.itemId } } }
  },
  
  canManageShops: ({ session }: FilterAccessArgs) => {
    if (!session) return false
    
    // Admin can manage all shops
    if (session.data.role?.canManageShops) return true
    
    // Users can only manage their own shops
    return { user: { id: { equals: session.itemId } } }
  },
  
  // Channel Rules
  canReadChannels: ({ session }: FilterAccessArgs) => {
    if (!session) return false
    
    // Admin can see all channels
    if (session.data.role?.canSeeOtherChannels) return true
    
    // Users can only see their own channels
    return { user: { id: { equals: session.itemId } } }
  },
  
  canManageChannels: ({ session }: FilterAccessArgs) => {
    if (!session) return false
    
    // Admin can manage all channels
    if (session.data.role?.canManageChannels) return true
    
    // Users can only manage their own channels
    return { user: { id: { equals: session.itemId } } }
  },
  
  canUpdateChannels: ({ session }: FilterAccessArgs) => {
    if (!session) return false
    
    // Admin can update all channels
    if (session.data.role?.canManageChannels) return true
    
    // Users can only update their own channels
    return { user: { id: { equals: session.itemId } } }
  },
  
  // Order Rules
  canReadOrders: ({ session }: FilterAccessArgs) => {
    if (!session) return false
    
    // Admin can see all orders
    if (session.data.role?.canSeeOtherOrders) return true
    
    // Users can only see their own orders
    return { user: { id: { equals: session.itemId } } }
  },
  
  canManageOrders: ({ session }: FilterAccessArgs) => {
    if (!session) return false
    
    // Admin can manage all orders
    if (session.data.role?.canManageOrders) return true
    
    // Users can only manage their own orders
    return { user: { id: { equals: session.itemId } } }
  },
  
  // Match Rules (Product Matching)
  canReadMatches: ({ session }: FilterAccessArgs) => {
    if (!session) return false
    
    // Admin can see all matches
    if (session.data.role?.canSeeOtherMatches) return true
    
    // Users can only see their own matches
    return { user: { id: { equals: session.itemId } } }
  },
  
  canUpdateMatches: ({ session }: FilterAccessArgs) => {
    if (!session) return false
    
    // Admin can manage all matches
    if (session.data.role?.canManageMatches) return true
    
    // Users can only manage their own matches
    return { user: { id: { equals: session.itemId } } }
  },
  
  canManageMatches: ({ session }: FilterAccessArgs) => {
    if (!session) return false
    
    // Admin can manage all matches
    if (session.data.role?.canManageMatches) return true
    
    // Users can only manage their own matches
    return { user: { id: { equals: session.itemId } } }
  },
  
  // Link Rules (Shop-Channel Linking)
  canReadLinks: ({ session }: FilterAccessArgs) => {
    if (!session) return false
    
    // Admin can see all links
    if (session.data.role?.canSeeOtherLinks) return true
    
    // Users can only see their own links
    return { user: { id: { equals: session.itemId } } }
  },
  
  canManageLinks: ({ session }: FilterAccessArgs) => {
    if (!session) return false
    
    // Admin can manage all links
    if (session.data.role?.canManageLinks) return true
    
    // Users can only manage their own links
    return { user: { id: { equals: session.itemId } } }
  },

  // API Key Rules
  canReadApiKeys: ({ session }: FilterAccessArgs) => {
    if (!session) return false
    
    // Admin can see all API keys
    if (session.data.role?.canManageApiKeys) return true
    
    // Users can only see their own API keys
    return { user: { id: { equals: session.itemId } } }
  },
  
  canManageApiKeys: ({ session }: FilterAccessArgs) => {
    if (!session) return false
    
    // Admin can manage all API keys
    if (session.data.role?.canManageApiKeys) return true
    
    // Users can only manage their own API keys
    return { user: { id: { equals: session.itemId } } }
  },
}

// Item-Level Access Control Functions
export const itemRules = {
  canUpdateUser: ({ session, item }: ItemAccessArgs): boolean => {
    if (!session) return false
    
    // Admin can edit any user
    if (session.data.role?.canEditOtherUsers) return true
    
    // Users can only edit themselves
    return session.itemId === item.id
  },
  
  canDeleteUser: ({ session }: ItemAccessArgs): boolean => {
    if (!session) return false
    
    // Only admin can delete users
    return Boolean(session.data.role?.canManageUsers)
  },
}

// Field-Level Access Control Functions
export const fieldRules = {
  canReadUserPassword: (): boolean => false, // Never allow reading passwords
  
  canUpdateUserPassword: ({ session, item }: FieldAccessArgs): boolean => {
    if (!session) return false
    
    // Admin can update any password
    if (session.data.role?.canManageUsers) return true
    
    // Users can only update their own password
    return session.itemId === item?.id
  },
  
  canManageUserRole: ({ session }: FieldAccessArgs): boolean => {
    if (!session) return false
    
    // Only admin can manage roles
    return Boolean(session.data.role?.canManageUsers)
  },
}
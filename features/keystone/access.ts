// Keystone 6 Access Control - Following Official Documentation
// https://keystonejs.com/docs/config/access-control

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

// Permission Functions - Operation Level Access Control
export const permissions = {
  // Basic Dashboard Permissions
  canSeeOtherUsers: ({ session }: OperationAccessArgs): boolean => 
    Boolean(session?.data.role?.canSeeOtherUsers),
  
  canEditOtherUsers: ({ session }: OperationAccessArgs): boolean => 
    Boolean(session?.data.role?.canEditOtherUsers),
  
  canManageUsers: ({ session }: OperationAccessArgs): boolean => 
    Boolean(session?.data.role?.canManageUsers),
  
  canManageRoles: ({ session }: OperationAccessArgs): boolean => 
    Boolean(session?.data.role?.canManageRoles),
  
  canAccessDashboard: ({ session }: OperationAccessArgs): boolean => 
    Boolean(session?.data.role?.canAccessDashboard),
  
  // E-commerce Platform Permissions
  // Shop Management
  canSeeOtherShops: ({ session }: OperationAccessArgs): boolean => 
    Boolean(session?.data.role?.canSeeOtherShops),
  
  canManageShops: ({ session }: OperationAccessArgs): boolean => 
    Boolean(session?.data.role?.canManageShops),
  
  canCreateShops: ({ session }: OperationAccessArgs): boolean => 
    Boolean(session?.data.role?.canCreateShops),
  
  // Channel Management
  canSeeOtherChannels: ({ session }: OperationAccessArgs): boolean => 
    Boolean(session?.data.role?.canSeeOtherChannels),
  
  canManageChannels: ({ session }: OperationAccessArgs): boolean => 
    Boolean(session?.data.role?.canManageChannels),
  
  canCreateChannels: ({ session }: OperationAccessArgs): boolean => 
    Boolean(session?.data.role?.canCreateChannels),
  
  // Order Management
  canSeeOtherOrders: ({ session }: OperationAccessArgs): boolean => 
    Boolean(session?.data.role?.canSeeOtherOrders),
  
  canManageOrders: ({ session }: OperationAccessArgs): boolean => 
    Boolean(session?.data.role?.canManageOrders),
  
  canProcessOrders: ({ session }: OperationAccessArgs): boolean => 
    Boolean(session?.data.role?.canProcessOrders),
  
  // Product & Inventory Management
  canSeeOtherMatches: ({ session }: OperationAccessArgs): boolean => 
    Boolean(session?.data.role?.canSeeOtherMatches),
  
  canManageMatches: ({ session }: OperationAccessArgs): boolean => 
    Boolean(session?.data.role?.canManageMatches),
  
  canCreateMatches: ({ session }: OperationAccessArgs): boolean => 
    Boolean(session?.data.role?.canCreateMatches),
  
  // Linking System
  canSeeOtherLinks: ({ session }: OperationAccessArgs): boolean => 
    Boolean(session?.data.role?.canSeeOtherLinks),
  
  canManageLinks: ({ session }: OperationAccessArgs): boolean => 
    Boolean(session?.data.role?.canManageLinks),
  
  canCreateLinks: ({ session }: OperationAccessArgs): boolean => 
    Boolean(session?.data.role?.canCreateLinks),
  
  // Platform Integration
  canManagePlatforms: ({ session }: OperationAccessArgs): boolean => 
    Boolean(session?.data.role?.canManagePlatforms),
  
  canViewPlatformMetrics: ({ session }: OperationAccessArgs): boolean => 
    Boolean(session?.data.role?.canViewPlatformMetrics),
  
  // API Key Management
  canManageApiKeys: ({ session }: OperationAccessArgs): boolean => 
    Boolean(session?.data.role?.canManageApiKeys),
  
  canCreateApiKeys: ({ session }: OperationAccessArgs): boolean => 
    Boolean(session?.data.role?.canCreateApiKeys),
  
  // Advanced Features
  canAccessAnalytics: ({ session }: OperationAccessArgs): boolean => 
    Boolean(session?.data.role?.canAccessAnalytics),
  
  canExportData: ({ session }: OperationAccessArgs): boolean => 
    Boolean(session?.data.role?.canExportData),
  
  canManageWebhooks: ({ session }: OperationAccessArgs): boolean => 
    Boolean(session?.data.role?.canManageWebhooks),
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
import { config } from '@keystone-6/core'
import { createAuth } from '@keystone-6/auth'
import { statelessSessions } from '@keystone-6/core/session'
import { models } from '@/features/keystone/models'
import { extendGraphqlSchema } from '@/features/keystone/extendGraphqlSchema'
import { permissionsList } from '@/features/keystone/models/fields'
import type { KeystoneContext } from '@keystone-6/core/types'

// Test database URL - uses a separate test database
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/openship_test'

const sessionConfig = {
  maxAge: 60 * 60 * 24 * 360,
  secret: 'test-secret-for-testing-only',
}

const { withAuth } = createAuth({
  listKey: 'User',
  identityField: 'email',
  secretField: 'password',
  initFirstItem: {
    fields: ['name', 'email', 'password'],
    itemData: {
      role: {
        create: {
          name: 'Test Admin',
          canSeeOtherUsers: true,
          canEditOtherUsers: true,
          canManageUsers: true,
          canManageRoles: true,
          canAccessDashboard: true,
          canSeeOtherShops: true,
          canManageShops: true,
          canCreateShops: true,
          canSeeOtherChannels: true,
          canManageChannels: true,
          canCreateChannels: true,
          canSeeOtherOrders: true,
          canManageOrders: true,
          canProcessOrders: true,
          canSeeOtherMatches: true,
          canManageMatches: true,
          canCreateMatches: true,
          canSeeOtherLinks: true,
          canManageLinks: true,
          canCreateLinks: true,
          canManagePlatforms: true,
          canViewPlatformMetrics: true,
          canManageApiKeys: true,
          canCreateApiKeys: true,
          canAccessAnalytics: true,
          canExportData: true,
          canManageWebhooks: true,
        },
      },
    },
  },
  sessionData: `id name email role { id name ${permissionsList.join(' ')} }`,
})

export const testKeystoneConfig = withAuth(
  config({
    db: {
      provider: 'postgresql',
      url: TEST_DATABASE_URL,
      enableLogging: false, // Disable logging in tests
    },
    lists: models,
    ui: {
      isAccessAllowed: ({ session }) => session?.data.role?.canAccessDashboard ?? false,
    },
    session: statelessSessions(sessionConfig),
    graphql: {
      extendGraphqlSchema,
    },
  })
)

let keystoneContext: KeystoneContext | null = null

export async function getTestContext(): Promise<KeystoneContext> {
  if (!keystoneContext) {
    // Dynamic import to avoid issues with Next.js
    const { getContext } = await import('@keystone-6/core/context')
    keystoneContext = getContext(testKeystoneConfig)
  }
  return keystoneContext
}

export async function resetTestDatabase() {
  const context = await getTestContext()
  
  // Get all list keys
  const listKeys = Object.keys(context.db)
  
  // Delete all records in dependency order (to avoid foreign key constraints)
  const deletionOrder = [
    'CartItem',
    'LineItem', 
    'Match',
    'ShopItem',
    'ChannelItem',
    'Order',
    'Channel',
    'Shop',
    'Platform',
    'User',
    'Role',
  ]
  
  for (const listKey of deletionOrder) {
    if (listKeys.includes(listKey)) {
      await context.db[listKey].deleteMany({})
    }
  }
}

export async function closeTestDatabase() {
  if (keystoneContext) {
    // Close the database connection
    await keystoneContext.prisma.$disconnect()
    keystoneContext = null
  }
}
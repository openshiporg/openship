import { createAuth } from "@keystone-6/auth";
import { config } from "@keystone-6/core";
import "dotenv/config";
import { models } from "./models";
import { extendGraphqlSchema } from "./extendGraphqlSchema";
import { permissionsList } from "./models/fields";
import { sendPasswordResetEmail } from "./lib/mail";
import Iron from "@hapi/iron";
import * as cookie from "cookie";
import { hashApiKeySync } from "./lib/crypto-utils";
import bcryptjs from "bcryptjs";

const databaseURL = process.env.DATABASE_URL || "file:./keystone.db";

const sessionConfig = {
  maxAge: 60 * 60 * 24 * 360, // How long they stay signed in?
  secret:
    process.env.SESSION_SECRET || "this secret should only be used in testing",
};

const listKey = "User";

export function statelessSessions({
  secret,
  maxAge = 60 * 60 * 24 * 360,
  path = "/",
  secure = process.env.NODE_ENV === "production",
  ironOptions = Iron.defaults,
  domain,
  sameSite = "lax" as const,
  cookieName = "keystonejs-session",
}: {
  secret: string;
  maxAge?: number;
  path?: string;
  secure?: boolean;
  ironOptions?: any;
  domain?: string;
  sameSite?: "lax" | "none" | "strict" | boolean;
  cookieName?: string;
}) {
  if (!secret) {
    throw new Error("You must specify a session secret to use sessions");
  }
  if (secret.length < 32) {
    throw new Error("The session secret must be at least 32 characters long");
  }

  return {
    async get({ context }: { context: any }) {
      if (!context?.req) return;
      
      // Check for OAuth Bearer token authentication
      const authHeader = context.req.headers.authorization;
      console.log('🔑 AUTH HEADER:', authHeader);
      
      if (authHeader?.startsWith("Bearer ")) {
        const accessToken = authHeader.replace("Bearer ", "");
        console.log('🔑 ACCESS TOKEN:', accessToken);
        
        // Try to validate as API key first
        if (accessToken.startsWith("osp_")) {
          console.log('🔑 API KEY DETECTED, VALIDATING...');
          try {
            // Get all active API keys and test the token against each one
            const apiKeys = await context.sudo().query.ApiKey.findMany({
              where: { status: { equals: 'active' } },
              query: `
                id
                name
                scopes
                status
                expiresAt
                usageCount
                tokenSecret { isSet }
                user { id }
              `,
            });
            
            console.log('🔑 CHECKING AGAINST', apiKeys.length, 'ACTIVE API KEYS');
            
            let matchingApiKey = null;
            
            // Test token against each API key using bcryptjs (same as Keystone's default KDF)
            for (const apiKey of apiKeys) {
              try {
                if (!apiKey.tokenSecret?.isSet) continue;
                
                // Get the full API key item with the tokenSecret value
                const fullApiKey = await context.sudo().db.ApiKey.findOne({
                  where: { id: apiKey.id },
                });
                
                if (!fullApiKey || typeof fullApiKey.tokenSecret !== 'string') {
                  continue;
                }
                
                // Use bcryptjs to compare - this is exactly what Keystone does internally
                const isValid = await bcryptjs.compare(accessToken, fullApiKey.tokenSecret);
                
                if (isValid) {
                  matchingApiKey = apiKey;
                  console.log('🔑 FOUND MATCHING API KEY:', apiKey.id);
                  break;
                }
              } catch (error) {
                console.log('🔑 ERROR VERIFYING API KEY:', error);
                // Continue to next API key if this one doesn't match
                continue;
              }
            }
            
            if (!matchingApiKey) {
              console.log('🔑 NO MATCHING API KEY FOUND');
              return; // API key not found or invalid
            }
            
            if (matchingApiKey.status !== 'active') {
              console.log('🔑 API KEY NOT ACTIVE:', matchingApiKey.status);
              return; // API key is inactive
            }
            
            if (matchingApiKey.expiresAt && new Date() > new Date(matchingApiKey.expiresAt)) {
              console.log('🔑 API KEY EXPIRED');
              // Auto-revoke expired keys
              await context.sudo().query.ApiKey.updateOne({
                where: { id: matchingApiKey.id },
                data: { status: 'revoked' },
              });
              return; // API key has expired
            }
            
            // Update usage statistics (async, don't wait)
            const today = new Date().toISOString().split('T')[0];
            const usage = matchingApiKey.usageCount || { total: 0, daily: {} };
            usage.total = (usage.total || 0) + 1;
            usage.daily[today] = (usage.daily[today] || 0) + 1;
            
            context.sudo().query.ApiKey.updateOne({
              where: { id: matchingApiKey.id },
              data: {
                lastUsedAt: new Date(),
                usageCount: usage,
              },
            }).catch(console.error);
            
            // Return user session with API key scopes attached
            if (matchingApiKey.user?.id) {
              const session = { 
                itemId: matchingApiKey.user.id, 
                listKey,
                apiKeyScopes: matchingApiKey.scopes || [] // Attach scopes for permission checking
              };
              console.log('🔑 RETURNING SESSION:', JSON.stringify(session, null, 2));
              return session;
            }
          } catch (err) {
            console.log('🔑 API Key validation error:', err);
            return;
          }
        }
        
        // If not API key, try as regular session token
        try {
          return await Iron.unseal(accessToken, secret, ironOptions);
        } catch (err) {}
      }
      
      // Check for session cookie
      const cookies = cookie.parse(context.req.headers.cookie || "");
      const token = cookies[cookieName];
      if (!token) return;
      try {
        return await Iron.unseal(token, secret, ironOptions);
      } catch (err) {}
    },
    async end({ context }: { context: any }) {
      if (!context?.res) return;

      context.res.setHeader(
        "Set-Cookie",
        cookie.serialize(cookieName, "", {
          maxAge: 0,
          expires: new Date(),
          httpOnly: true,
          secure,
          path,
          sameSite,
          domain,
        })
      );
    },
    async start({ context, data }: { context: any; data: any }) {
      if (!context?.res) return;

      const sealedData = await Iron.seal(data, secret, {
        ...ironOptions,
        ttl: maxAge * 1000,
      });
      context.res.setHeader(
        "Set-Cookie",
        cookie.serialize(cookieName, sealedData, {
          maxAge,
          expires: new Date(Date.now() + maxAge * 1000),
          httpOnly: true,
          secure,
          path,
          sameSite,
          domain,
        })
      );

      return sealedData;
    },
  };
}

const { withAuth } = createAuth({
  listKey,
  identityField: "email",
  secretField: "password",
  initFirstItem: {
    fields: ["name", "email", "password"],
    itemData: {
      role: {
        create: {
          name: "Admin",
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
  passwordResetLink: {
    async sendToken(args) {
      // send the email
      await sendPasswordResetEmail(args.token, args.identity);
    },
  },
  sessionData: `id name email role { id name ${permissionsList.join(" ")} }`,
});

export default withAuth(
  config({
    db: {
      provider: "postgresql",
      url: databaseURL,
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
);
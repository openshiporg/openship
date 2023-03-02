import { config } from "@keystone-6/core";
import * as cookie from "cookie";
import Iron from "@hapi/iron";
import { createAuth } from "@keystone-6/auth";
import { Role } from "./schemas/Role";
import { User } from "./schemas/User";
import { apiKey } from "./schemas/apiKey";
import { Order } from "./schemas/Order";
import { TrackingDetail } from "./schemas/TrackingDetail";
import { LineItem } from "./schemas/LineItem";
import { CartItem } from "./schemas/CartItem";
import { Shop } from "./schemas/Shop";
import { Channel } from "./schemas/Channel";
import { ChannelMetafield } from "./schemas/ChannelMetafield";
import { ShopMetafield } from "./schemas/ShopMetafield";
import { ChannelItem } from "./schemas/ChannelItem";
import { ShopItem } from "./schemas/ShopItem";
import { Match } from "./schemas/Match";
import { Link } from "./schemas/Link";
import { extendGraphqlSchema } from "./mutations";
import { sendPasswordResetEmail } from "./lib/mail";
import "dotenv/config";

const TOKEN_NAME = "keystonejs-session";
const MAX_AGE = 60 * 60 * 8; // 8 hours
const listKey = "User";

export function statelessSessions({
  secret,
  maxAge = MAX_AGE,
  path = "/",
  secure = process.env.NODE_ENV === "production",
  ironOptions = Iron.defaults,
  domain,
  sameSite = "lax",
}) {
  if (!secret) {
    throw new Error("You must specify a session secret to use sessions");
  }
  if (secret.length < 32) {
    throw new Error("The session secret must be at least 32 characters long");
  }
  return {
    async get({ req, createContext }) {
      const apiKey = req.headers["x-api-key"];
      if (apiKey) {
        const sudoContext = createContext({ sudo: true });
        try {
          const data = await sudoContext.query.apiKey.findOne({
            where: {
              id: apiKey,
            },
            query: `id user { id }`,
          });

          if (!data?.user?.id) return;
          return { itemId: data.user.id, listKey };
        } catch (err) {
          return;
        }
      }
      const cookies = cookie.parse(req.headers.cookie || "");
      const bearer = req.headers.authorization?.replace("Bearer ", "");
      const token = bearer || cookies[TOKEN_NAME];
      if (!token) return;
      try {
        return await Iron.unseal(token, secret, ironOptions);
      } catch (err) {}
    },
    async end({ res }) {
      res.setHeader(
        "Set-Cookie",
        cookie.serialize(TOKEN_NAME, "", {
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
    async start({ res, data }) {
      const sealedData = await Iron.seal(data, secret, {
        ...ironOptions,
        ttl: maxAge * 1000,
      });

      res.setHeader(
        "Set-Cookie",
        cookie.serialize(TOKEN_NAME, sealedData, {
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

const sessionConfig = {
  maxAge: 60 * 60 * 24 * 30, // How long they stay signed in?
  secret:
    process.env.SESSION_SECRET || "this secret should only be used in testing",
};

const { withAuth } = createAuth({
  listKey: "User",
  identityField: "email",
  secretField: "password",
  initFirstItem: {
    fields: ["name", "email", "password"],
    itemData: {
      /*
        This creates a related role with full permissions, so that when the first user signs in
        they have complete access to the system (without this, you couldn't do anything)
      */
      role: {
        create: {
          name: "Admin",
          // canCreateTodos: true,
          // canManageAllTodos: true,
          canSeeOtherUsers: true,
          canManageUsers: true,
          canManageRoles: true,
          canSeeOtherOrders: true,
          canManageOrders: true,
          canSeeOtherShops: true,
          canManageShops: true,
          canSeeOtherChannels: true,
          canManageChannels: true,
          canSeeOtherMatches: true,
          canManageMatches: true,
          canSeeOtherLinks: true,
          canManageLinks: true,
        },
      },
    },
  },
  sessionData: `
      name
      role {
        id
        name
        canSeeOtherUsers
        canManageUsers
        canManageRoles
        canSeeOtherOrders
        canManageOrders
        canSeeOtherShops
        canManageShops
        canSeeOtherChannels
        canManageChannels
        canSeeOtherMatches
        canManageMatches
        canSeeOtherLinks
        canManageLinks
      }
      `,
  passwordResetLink: {
    sendToken: async ({ itemId, identity, token, context }) => {
      await sendPasswordResetEmail(token, identity);
    },
    tokensValidForMins: 60,
  },
});

// withAuth applies the signin functionality to the keystone config
export default withAuth(
  config({
    // db: { provider: 'sqlite', url: 'file:./app.db' },
    // server: {
    //   cors: { origin: false },
    // },
    db: {
      provider: "postgresql" ?? process.env.DATABASE_PROVIDER,
      url: process.env.DATABASE_URL,
      useMigrations: true,
    },
    lists: {
      // Schema items go in here
      User,
      apiKey,
      Role,
      Order,
      TrackingDetail,
      LineItem,
      CartItem,
      Channel,
      ChannelMetafield,
      ChannelItem,
      Shop,
      ShopMetafield,
      ShopItem,
      Match,
      Link,
    },
    extendGraphqlSchema,
    ui: {
      isAccessAllowed: ({ session }) => !!session,
    },
    session: statelessSessions(sessionConfig),
    experimental: {
      enableNextJsGraphqlApiEndpoint: true,
      generateNextGraphqlAPI: true,
      generateNodeAPI: true,
    },
    graphql: {
      playground: true,
      apolloConfig: {
        introspection: true,
      },
    },
  })
);

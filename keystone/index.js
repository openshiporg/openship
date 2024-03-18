import { createAuth } from "@keystone-6/auth";
import { config } from "@keystone-6/core";
import Iron from "@hapi/iron";
import * as cookie from "cookie";
// import { statelessSessions } from "@keystone-6/core/session";
import { permissionsList } from "./models/fields";
import "dotenv/config";
import { extendGraphqlSchema } from "./mutations";
import { models } from "./models";
import { sendPasswordResetEmail } from "./utils/mail";

const databaseURL = process.env.DATABASE_URL || "file:./keystone.db";

const listKey = "User";

const sessionConfig = {
  maxAge: 60 * 60 * 24 * 360, // How long they stay signed in?
  secret:
    process.env.SESSION_SECRET || "this secret should only be used in testing",
};

export function statelessSessions({
  secret,
  maxAge = MAX_AGE,
  path = "/",
  secure = process.env.NODE_ENV === "production",
  ironOptions = Iron.defaults,
  domain,
  sameSite = "lax",
  cookieName = 'keystonejs-session',
}) {
  if (!secret) {
    throw new Error("You must specify a session secret to use sessions");
  }
  if (secret.length < 32) {
    throw new Error("The session secret must be at least 32 characters long");
  }
  return {
    async get({ context }) {
      if (!context?.req) return;
      const apiKey = context.req.headers["x-api-key"];
      if (apiKey) {
        try {
          const data = await context.sudo().query.apiKey.findOne({
            where: {
              id: apiKey,
            },
            query: `id user { id }`,
          });
          // console.log({ data });
          if (!data?.user?.id) return;
          return { itemId: data.user.id, listKey };
        } catch (err) {
          return;
        }
      }
      const cookies = cookie.parse(context.req.headers.cookie || "");
      const bearer = context.req.headers.authorization?.replace("Bearer ", "");
      const token = bearer || cookies[cookieName];
      if (!token) return;
      try {
        return await Iron.unseal(token, secret, ironOptions);
      } catch (err) {}
    },
    async end({ context }) {
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
    async start({ context, data }) {
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
  sessionData: `id name email role { ${permissionsList.join(" ")} }`,
  passwordResetLink: {
    sendToken: async ({ itemId, identity, token, context }) => {
      await sendPasswordResetEmail(token, identity);
    },
    tokensValidForMins: 60,
  },
});

export default withAuth(
  config({
    // db: { provider: 'sqlite', url: 'file:./app.db' },
    // server: {
    //   cors: { origin: false },
    // },
    db: {
      provider: "postgresql" ?? process.env.DATABASE_PROVIDER,
      url: databaseURL,
      useMigrations: true,
    },
    lists: models,
    extendGraphqlSchema,
    ui: {
      isAccessAllowed: ({ session }) => !!session,
      basePath: "/dashboard"
    },
    session: statelessSessions(sessionConfig),
    experimental: {
      generateNextGraphqlAPI: true,
      generateNodeAPI: true,
    },
  })
);

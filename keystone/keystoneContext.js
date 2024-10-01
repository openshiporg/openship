import { getContext } from "@keystone-6/core/context";
import config from "./index";
import * as PrismaModule from ".prisma/client";

// Making sure multiple prisma clients are not created during hot reloading
export const keystoneContext =
  globalThis.keystoneContext ?? getContext(config, PrismaModule);

if (process.env.NODE_ENV !== "production") {
  globalThis.keystoneContext = keystoneContext;
}

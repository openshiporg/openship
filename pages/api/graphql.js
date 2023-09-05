import { keystoneContext } from "@keystone/keystoneContext";
import { createYoga } from "graphql-yoga";
import processRequest from "graphql-upload/processRequest.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const contentType = req.headers["content-type"];
  if (contentType?.startsWith("multipart/form-data")) {
    req.body = await processRequest(req, res);
  }
  return createYoga({
    graphqlEndpoint: "/api/graphql",
    schema: keystoneContext.graphql.schema,
    context: ({ req, res }) => keystoneContext.withRequest(req, res),
    multipart: false,
  })(req, res);
}

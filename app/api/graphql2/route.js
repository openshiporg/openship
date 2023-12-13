import { createYoga } from "graphql-yoga";
import { keystoneContext } from "@keystone/keystoneContext";
import processRequest from "graphql-upload/processRequest.js";

const { handleRequest } = createYoga({
  schema: keystoneContext.graphql.schema,
  graphqlEndpoint: "/api/graphql",
  context: ({ req, res }) => keystoneContext.withRequest(req, res),
  multipart: false,
  fetchAPI: { Response }
});

export async function POST(req, res) {
  const contentType = req.headers.get("content-type");
  if (contentType?.startsWith("multipart/form-data")) {
    req.body = await processRequest(req, res);
  }

  return handleRequest(req, res);
}

export { handleRequest as GET, handleRequest as OPTIONS };

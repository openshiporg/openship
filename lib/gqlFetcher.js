import { request } from "graphql-request";

export const gqlFetcher = (query, variables) =>
  request("/api/graphql", query, variables && JSON.parse(variables));

import { GraphQLClient, gql } from "graphql-request";

export const checkAuth = async (req) => {
  const client = gqlClient(req);

  const query = gql`
    query authenticatedItem {
      authenticatedItem {
        ... on User {
          id
        }
      }
      redirectToInit
    }
  `;

  const { authenticatedItem, redirectToInit } = await client.request(query);
  return { authenticatedItem, redirectToInit };
};

export function gqlClient(req) {
  return new GraphQLClient(`${process.env.FRONTEND_URL}/api/graphql`, {
    headers: req ? { cookie: req.headers.cookie } : undefined,
  });
}

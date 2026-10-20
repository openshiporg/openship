import type { FetchLike } from "@modelcontextprotocol/sdk/shared/transport.js";

function canonicalEndpoint(url: URL) {
  const endpoint = new URL(url);
  endpoint.hash = "";
  return endpoint.href;
}

/**
 * Creates a request-local fetch for exactly one internal MCP endpoint.
 *
 * The dashboard cookie is never installed on process-global fetch, redirects
 * are not followed, and every unexpected destination is rejected before I/O.
 */
export function createScopedMcpFetch(
  mcpEndpoint: URL,
  cookie: string,
  baseFetch: FetchLike = fetch,
): FetchLike {
  const allowedEndpoint = canonicalEndpoint(mcpEndpoint);
  const requestCookie = cookie.trim();

  return async (input, init = {}) => {
    const target = new URL(input);
    if (canonicalEndpoint(target) !== allowedEndpoint) {
      throw new Error("MCP transport attempted a request outside the request-scoped MCP endpoint.");
    }

    const headers = new Headers(init.headers);
    if (requestCookie) headers.set("cookie", requestCookie);
    else headers.delete("cookie");

    return baseFetch(target, {
      ...init,
      headers,
      redirect: "manual",
    });
  };
}

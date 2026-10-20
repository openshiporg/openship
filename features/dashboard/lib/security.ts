/** Never serialize an Error: ClientError.message itself includes request variables. */
export const PUBLIC_REQUEST_ERROR = 'Unable to complete the request. Please try again.';

const SAFE_CODES = new Set([
  'UNAUTHENTICATED', 'FORBIDDEN', 'BAD_USER_INPUT', 'GRAPHQL_VALIDATION_FAILED',
  'INTERNAL_SERVER_ERROR', 'KS_ACCESS_DENIED', 'KS_VALIDATION_FAILURE',
  'KS_AUTHENTICATION_FAILURE', 'KS_USER_INPUT_ERROR',
]);

export function safeErrorSummary(error: unknown): { message: string; codes: string[] } {
  const errors = (error as { response?: { errors?: unknown } } | null)?.response?.errors;
  const codes = Array.isArray(errors)
    ? errors.flatMap((entry) => {
        const code = entry?.extensions?.code;
        return typeof code === 'string' && SAFE_CODES.has(code) ? [code] : [];
      })
    : [];
  // Deliberately use a fixed message, not error.message or GraphQL/provider text.
  return { message: PUBLIC_REQUEST_ERROR, codes: [...new Set(codes)] };
}

/** Only root-relative, same-site navigation; also reject encoded bypasses. */
export function sanitizeDashboardRedirect(value: unknown): string {
  if (typeof value !== 'string') return '/dashboard';
  let decoded = value;
  try {
    for (let i = 0; i < 8; i++) {
      if (!decoded.startsWith('/') || decoded.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(decoded)) {
        return '/dashboard';
      }
      const next = decodeURIComponent(decoded);
      if (next === decoded) return value;
      decoded = next;
    }
  } catch {
    return '/dashboard';
  }
  return '/dashboard';
}

/** Optional deployment-owned origin. Invalid configuration fails closed. */
export function configuredInternalOrigin(value: string | undefined): string | undefined {
  if (value === undefined || value === '') return undefined;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
        url.pathname !== '/' || url.search || url.hash) throw new Error();
    return url.origin;
  } catch {
    throw new Error('OPENFRONT_INTERNAL_ORIGIN must be an HTTP(S) origin');
  }
}

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

// Keystone codes whose messages are written for the person filling the form.
const USER_FACING_CODES = new Set([
  'KS_VALIDATION_FAILURE', 'KS_USER_INPUT_ERROR', 'KS_ACCESS_DENIED', 'KS_EXTENSION_ERROR',
]);
// Anything that looks like database, driver or stack output stays server-side.
const UNSAFE_DETAIL = /prisma|invocation|\bat\s+\S+\s*\(|\bat\s+\/|node_modules|postgres(ql)?:\/\/|\bSQL\b|ECONN|query engine|\.ts:\d+|\.js:\d+/i;
const MAX_MESSAGE_LENGTH = 400;

function cleanMessage(message: string): string | null {
  // Keystone lists failures as "  - List.field: message"; keep only the message
  const text = message.replace(/^\s*-\s*\w+(\.\w+)+:\s*/gm, '').replace(/\s+\n/g, '\n').trim();
  if (!text || text.length > MAX_MESSAGE_LENGTH || UNSAFE_DETAIL.test(text)) return null;
  return text;
}

/**
 * The message a dashboard user should see for a failed GraphQL request: Keystone's own
 * validation, input and access messages (and unique-constraint failures, by field name only).
 * Everything else, including Prisma debug output and stacks, falls back to PUBLIC_REQUEST_ERROR.
 */
export function publicGraphQLErrorMessage(error: unknown): string {
  const errors = (error as { response?: { errors?: unknown } } | null)?.response?.errors;
  if (!Array.isArray(errors)) return PUBLIC_REQUEST_ERROR;
  const messages: string[] = [];
  for (const entry of errors) {
    const code = entry?.extensions?.code;
    const message = typeof entry?.message === 'string' ? entry.message : '';
    if (code === 'KS_PRISMA_ERROR') {
      const fields = /Unique constraint failed on the fields: \(([^)]*)\)/.exec(message)?.[1];
      const names = fields?.split(',').map((field) => field.replace(/[`'"\s]/g, '')).filter((field) => /^\w+$/.test(field));
      if (names?.length) messages.push(`A record with this ${names.join(' and ')} already exists.`);
      continue;
    }
    if (typeof code !== 'string' || !USER_FACING_CODES.has(code)) continue;
    const cleaned = cleanMessage(message);
    if (cleaned) messages.push(cleaned);
  }
  return messages.length ? [...new Set(messages)].join('\n') : PUBLIC_REQUEST_ERROR;
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


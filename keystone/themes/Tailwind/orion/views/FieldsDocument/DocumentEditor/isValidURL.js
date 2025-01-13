import { sanitizeUrl } from "@braintree/sanitize-url";

export function isValidURL(url) {
  return url === sanitizeUrl(url);
}

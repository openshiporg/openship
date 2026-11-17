// Run: npx tsx --test tests/fable-audit-fixes.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { verifyShopifyWebhook } from "../features/integrations/lib/webhook-verification";
import { permissions, isSignedInFor } from "../features/keystone/access";

const sign = (body: string, secret: string) =>
  crypto.createHmac("sha256", secret).update(body, "utf8").digest("base64");

test("Shopify webhook: only a body signed with the app secret passes", () => {
  const body = JSON.stringify({ id: 1, line_items: [] });
  assert.equal(verifyShopifyWebhook(body, sign(body, "s3cret"), "s3cret"), true);
  assert.equal(verifyShopifyWebhook(body, sign(body, "other"), "s3cret"), false);
  assert.equal(verifyShopifyWebhook(body, "present-but-wrong", "s3cret"), false);
  assert.equal(verifyShopifyWebhook(body + " ", sign(body, "s3cret"), "s3cret"), false);
  assert.equal(verifyShopifyWebhook(body, "", "s3cret"), false);
});

const adminRole = {
  canSeeOtherShops: true, canSeeOtherOrders: true, canManageOrders: true,
  canProcessOrders: true, canManageUsers: true, canCreateApiKeys: true,
};

test("API key: limited to its scopes even when the owner is an admin", () => {
  const key = { itemId: "u1", data: { role: adminRole }, apiKeyScopes: ["read_shops"] } as any;
  assert.equal(permissions.canSeeOtherShops({ session: key } as any), true);
  assert.equal(permissions.canManageUsers({ session: key } as any), false);
  assert.equal(permissions.canCreateApiKeys({ session: key } as any), false);
  assert.equal(isSignedInFor("canManageOrders")({ session: key } as any), false);
  assert.equal(isSignedInFor("canProcessOrders")({ session: key } as any), false);
  const orders = { ...key, apiKeyScopes: ["write_orders"] };
  assert.equal(isSignedInFor("canManageOrders")({ session: orders } as any), true);
});

test("API key: a scope never grants more than the owner's role", () => {
  const key = { itemId: "u1", data: { role: {} }, apiKeyScopes: ["write_users"] } as any;
  assert.equal(permissions.canManageUsers({ session: key } as any), false);
});

test("Signed-in user without see-others still passes the list gate (filter limits to own rows)", () => {
  const user = { itemId: "u2", data: { role: { canSeeOtherShops: false } } } as any;
  assert.equal(permissions.canSeeOtherShops({ session: user } as any), false);
  assert.equal(isSignedInFor("canSeeOtherShops")({ session: user } as any), true);
  assert.equal(isSignedInFor("canSeeOtherShops")({ session: undefined } as any), false);
});

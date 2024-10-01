export const channelAdapters = {
  shopify: () => import("./shopify"),
  bigcommerce: () => import("./bigcommerce"),
  woocommerce: () => import("./woocommerce"),
};

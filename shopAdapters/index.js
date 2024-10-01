export const shopAdapters = {
  shopify: () => import("./shopify"),
  bigcommerce: () => import("./bigcommerce"),
  woocommerce: () => import("./woocommerce"),
};

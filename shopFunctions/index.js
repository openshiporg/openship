const shopFunctions = {
  shopify: () => import("./shopify"),
  bigcommerce: () => import("./bigcommerce"),
  woocommerce: () => import("./woocommerce"),
};

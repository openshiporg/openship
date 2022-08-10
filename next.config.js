const { withKeystone } = require("@keystone-6/core/next");
const withPWA = require("next-pwa");
const runtimeCaching = require("next-pwa/cache");

module.exports = withKeystone(
  withPWA({
    pwa: {
      dest: "public",
      runtimeCaching,
    },
  })
);

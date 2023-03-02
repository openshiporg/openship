const { withKeystone } = require("@keystone-6/core/next");
const withPWA = require("next-pwa");
const runtimeCaching = require("next-pwa/cache");
const prod = process.env.NODE_ENV === 'production'

module.exports = withKeystone(
  withPWA({
    pwa: {
      dest: "public",
      runtimeCaching,
      disable: prod ? false : true
    },
  })
);

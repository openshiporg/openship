const fs = require("fs");
const jsconfig = require("./jsconfig.json");

const theme = process.env.ADMIN_THEME || "KeystoneUI";

const themeAliases = {
  "@keystone/components": `keystone/themes/${theme}/components`,
  "@keystone/screens": `keystone/themes/${theme}/screens`,
  "@keystone/views": `keystone/themes/${theme}/views`,
  "@keystone/primitives": `keystone/themes/${theme}/primitives`,
};

function valueToArray(obj) {
  const newObj = {};
  for (const key in obj) {
    newObj[`${key}/*`] = [`${obj[key]}/*`];
  }
  return newObj;
}

function updateJsconfigAliases() {
  jsconfig.compilerOptions.paths = {
    ...jsconfig.compilerOptions.paths,
    ...valueToArray(themeAliases),
  };

  fs.writeFileSync("jsconfig.json", JSON.stringify(jsconfig, null, 2));
}

function configureWebpack(config, { isServer }) {
  config.externals = [
    ...(config.externals || []),
    ".prisma/client",
    "@aws-sdk/signature-v4-multi-region",
  ];

  config.resolve.alias = {
    ...config.resolve.alias,
    ...themeAliases,
  };

  return config;
}

if (process.env.NODE_ENV !== "production") {
  updateJsconfigAliases();
}

const nextConfig = {
  webpack: configureWebpack,
  experimental: {
    serverComponentsExternalPackages: ["graphql"],
  },
  async redirects() {
    return [
      {
        source: "/admin/api/graphql",
        destination: "/api/graphql",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;

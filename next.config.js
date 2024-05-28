function configureWebpack(config, { isServer }) {
  config.externals = [
    ...(config.externals || []),
    ".prisma/client",
    "@aws-sdk/signature-v4-multi-region",
  ];

  config.resolve.alias = {
    ...config.resolve.alias,
    // "@keystone/screens": `keystone/themes/${theme}/screens`,
  };

  return config;
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





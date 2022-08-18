import { gql, GraphQLClient } from "graphql-request";

const handler = async (req, res) => {
  const { platform } = req.query;
  if (!transformer[platform]) {
    return res
      .status(400)
      .json({ error: "Search products endpoint for platform not found" });
  }

  try {
    const { error, products } = await transformer[platform](req, res);

    if (error) {
      return res.status(400).json({ error });
    } else {
      return res.status(200).json({
        products,
      });
    }
  } catch (err) {
    return res.status(500).json({
      error: `${platform} search products endpoint failed, please try again.`,
    });
  }
};

export default handler;

const transformer = {
  shopify: async (req, res) => {
    const shopifyClient = new GraphQLClient(
      `https://${req.query.domain}/admin/api/graphql.json`,
      {
        headers: {
          "X-Shopify-Access-Token": req.query.accessToken,
        },
      }
    );

    const { productVariants } = await shopifyClient.request(
      gql`
        query ($query: String) {
          productVariants(first: 15, query: $query) {
            edges {
              node {
                id
                availableForSale
                image {
                  originalSrc
                }
                price
                title
                product {
                  id
                  handle
                  title
                  images(first: 1) {
                    edges {
                      node {
                        originalSrc
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `,
      { query: req.query.variantId || req.query.searchEntry }
    );

    const arr = [];

    productVariants?.edges.forEach(
      ({ node: { id, image, price, product, availableForSale } }) => {
        const newData = {
          image: image?.originalSrc || product.images.edges[0].node.originalSrc,
          title: product.title,
          productId: product.id.split("/").pop(),
          variantId: id.split("/").pop(),
          price,
          availableForSale,
          // productLink: `https://${req.query.domain}/admin/products/${product.id
          //   .split("/")
          //   .pop()}`,
          productLink: `https://${req.query.domain}/products/${product.handle}`,
        };

        arr.push(newData);
      }
    );
    return { products: arr };
  },
  stockandtrace: async (req, res) => {
    const { searchEntry, productId, variantId } = req.query;

    const allProducts = [
      {
        image:
          "https://images.pexels.com/photos/531844/pexels-photo-531844.jpeg?cs=srgb&dl=pexels-pixabay-531844.jpg&fm=jpg&h=120&w=100&fit=crop",
        title: "Pocket Book",
        productId: "887262",
        variantId: "0",
        price: "9.99",
        availableForSale: true,
      },
    ];
    if (searchEntry) {
      const products = allProducts.filter((product) =>
        product.title.includes(searchEntry)
      );
      return { products };
    }
    if (productId && variantId) {
      const products = allProducts.filter(
        (product) =>
          product.productId === productId && product.variantId === variantId
      );
      if (products.length > 0) {
        return { products };
      }
      return { error: "Not found" };
    }
    return { products: allProducts };
  },
};

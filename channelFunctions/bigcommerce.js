export async function searchProducts({
  domain,
  accessToken,
  variantId,
  productId,
  searchEntry,
}) {
  const products = [];

  // Helper function to format product data
  function formatProductData(variant, product) {
    return {
      image: variant.image_url || product.images[0]?.url_thumbnail || "",
      title: `${product.name} ${
        variant.option_values?.length > 0
          ? `(${variant.option_values.map(o => o.label).join(", ")})`
          : ""
      }`,
      productId: product.id.toString(),
      variantId: variant.id.toString(),
      price: variant.price?.toString() || product.price?.toString() || "0",
      availableForSale: product.availability === "available",
      inventory: variant.inventory_level,
      inventoryTracked: variant.inventory_tracking !== "none",
    };
  }

  const includeFields = 'images,variants';

  if (productId && variantId) {
    const variantResponse = await fetch(
      `https://api.bigcommerce.com/stores/${domain}/v3/catalog/products/${productId}/variants/${variantId}`,
      {
        method: "GET",
        headers: {
          "X-Auth-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );
    const variant = await variantResponse.json();

    const productResponse = await fetch(
      `https://api.bigcommerce.com/stores/${domain}/v3/catalog/products/${productId}?include=${includeFields}`,
      {
        method: "GET",
        headers: {
          "X-Auth-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );
    const product = await productResponse.json();

    products.push(formatProductData(variant.data, product.data));

    return { products };
  } else {
    const queryParams = new URLSearchParams({
      include: includeFields,
    });
    if (variantId) queryParams.set('variant_ids:in', variantId);
    if (productId) queryParams.set('id', productId);
    if (searchEntry) queryParams.set('name:like', searchEntry);

    const response = await fetch(
      `https://api.bigcommerce.com/stores/${domain}/v3/catalog/products?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          "X-Auth-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );
    const responseData = await response.json();

    responseData.data.forEach(product => {
      product.variants.forEach(variant => {
        products.push(formatProductData(variant, product));
      });
    });

    return { products };
  }
}

// Create Purchase
export async function createPurchase({
  domain,
  accessToken,
  cartItems,
  email,
  address,
  orderId,
}) {
  const shopItems = cartItems.map(({ productId, quantity }) => ({
    product_id: productId,
    quantity,
  }));

  const response = await fetch(
    `https://api.bigcommerce.com/stores/${domain}/v2/orders`,
    {
      method: "POST",
      headers: {
        "X-Auth-Token": accessToken,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        billing_address: {
          first_name: address.first_name,
          last_name: address.last_name,
          street_1: address.streetAddress1,
          city: address.city,
          state: address.state,
          zip: address.zip,
          country: "United States", // Adapt country code as needed
          country_iso2: "US",
          email,
        },
        shipping_addresses: [
          {
            first_name: address.first_name,
            last_name: address.last_name,
            street_1: address.streetAddress1,
            street_2: address.streetAddress2,
            city: address.city,
            state: address.state,
            zip: address.zip,
            country: "United States", // Adapt country code as needed
            country_iso2: "US",
            email,
            shipping_method: "Free Shipping", // Adapt shipping method as needed
          },
        ],
        status_id: 11, // Completed status
        staff_notes: `Openship order placed (Order ID: ${orderId})`,
        products: shopItems,
        customer_id: 0, // Guest customer
      }),
    }
  );

  const data = await response.json();

  if (data[0]?.status >= 400) {
    throw new Error(`Error creating order: ${data[0].title}`);
  }

  return {
    purchaseId: data.id.toString(),
  };
}

// Create Webhook
export async function createWebhook({ domain, accessToken, topic, endpoint }) {
  const mapTopic = {
    ORDER_CREATED: "store/order/created",
    ORDER_CANCELLED: "store/order/archived",
    ORDER_CHARGEBACKED: "store/order/refund/created",
    TRACKING_CREATED: "store/shipment/created",
  };

  if (!mapTopic[topic]) {
    throw new Error("Topic not mapped yet");
  }

  const response = await fetch(
    `https://api.bigcommerce.com/stores/${domain}/v3/hooks`,
    {
      method: "POST",
      headers: {
        "X-Auth-Token": accessToken,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        scope: mapTopic[topic],
        destination: `${process.env.FRONTEND_URL}${endpoint}`,
        is_active: true,
        events_history_enabled: true,
        headers: {
          custom: "JSON",
        },
      }),
    }
  );

  const data = await response.json();

  if (data.title) {
    throw new Error(`Error creating webhook: ${data.title}`);
  }

  return { success: "Webhook created", webhookId: data.id };
}

// Delete Webhook
export async function deleteWebhook({ domain, accessToken, webhookId }) {
  const response = await fetch(
    `https://api.bigcommerce.com/stores/${domain}/v3/hooks/${webhookId}`,
    {
      method: "DELETE",
      headers: {
        "X-Auth-Token": accessToken,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );

  const data = await response.json();

  if (data.title) {
    throw new Error(`Error deleting webhook: ${data.title}`);
  }

  return { success: "Webhook deleted" };
}

// Get Webhooks
export async function getWebhooks({ domain, accessToken }) {
  const mapTopic = {
    "store/order/created": "ORDER_CREATED",
    "store/order/archived": "ORDER_CANCELLED",
    "store/order/refund/created": "ORDER_CHARGEBACKED",
    "store/shipment/created": "TRACKING_CREATED",
  };

  const response = await fetch(
    `https://api.bigcommerce.com/stores/${domain}/v3/hooks`,
    {
      method: "GET",
      headers: {
        "X-Auth-Token": accessToken,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );

  const { data } = await response.json();

  const webhooks = data.map(({ id, destination, created_at, scope }) => ({
    id,
    createdAt: created_at,
    callbackUrl: destination.replace(process.env.FRONTEND_URL, ""),
    topic: mapTopic[scope],
    includeFields: [],
  }));

  return { webhooks };
}

// export async function searchProducts({
//   domain,
//   accessToken,
//   variantId,
//   productId,
//   searchEntry,
// }) {
//   const products = [];

//   if (productId && variantId) {
//     const variantResponse = await fetch(
//       `https://api.bigcommerce.com/stores/${domain}/v3/catalog/products/${productId}/variants/${variantId}`,
//       {
//         method: "GET",
//         headers: {
//           "X-Auth-Token": accessToken,
//           "Content-Type": "application/json",
//         },
//       }
//     );
//     const variant = await variantResponse.json();

//     const productResponse = await fetch(
//       `https://api.bigcommerce.com/stores/${domain}/v3/catalog/products/${productId}?include=images`,
//       {
//         method: "GET",
//         headers: {
//           "X-Auth-Token": accessToken,
//           "Content-Type": "application/json",
//         },
//       }
//     );
//     const product = await productResponse.json();

//     const mergedData = { ...variant.data, ...product.data };
//     const newData = {
//       image: mergedData.image_url || mergedData.images[0]?.url_thumbnail || "",
//       title: `${mergedData.name} ${
//         mergedData.option_values?.length > 0
//           ? `(${mergedData.option_values.map((o) => o.label).join("/")})`
//           : ""
//       }`,
//       productId,
//       variantId,
//       price: mergedData.price?.toString() || 0,
//       availableForSale: mergedData.availability === "available",
//     };
//     products.push(newData);

//     return { products };
//   } else if (variantId) {
//     const response = await fetch(
//       `https://api.bigcommerce.com/stores/${domain}/v3/catalog/products?include=variants&variant_ids:in=${variantId}`,
//       {
//         method: "GET",
//         headers: {
//           "X-Auth-Token": accessToken,
//           "Content-Type": "application/json",
//         },
//       }
//     );
//     const responseData = await response.json();
//     const data = responseData.data;

//     data.forEach(
//       ({
//         id,
//         base_variant_id,
//         price,
//         primary_image,
//         name,
//         availability,
//         images,
//         variants,
//       }) => {
//         variants.forEach(
//           ({
//             id,
//             product_id,
//             image_url,
//             price: variantPrice,
//             option_values,
//           }) => {
//             const newData = {
//               image: image_url || images[0]?.url_thumbnail || "",
//               title: `${name} ${
//                 option_values.length > 0
//                   ? `(${option_values.map((o) => o.label).join("/")})`
//                   : ""
//               }`,
//               productId: product_id.toString(),
//               variantId: id.toString(),
//               price: variantPrice?.toString() || price?.toString() || 0,
//               availableForSale: availability === "available",
//             };
//             products.push(newData);
//           }
//         );
//       }
//     );

//     return { products };
//   } else if (productId) {
//     const response = await fetch(
//       `https://api.bigcommerce.com/stores/${domain}/v3/catalog/products/${productId}?include=images,variants`,
//       {
//         method: "GET",
//         headers: {
//           "X-Auth-Token": accessToken,
//           "Content-Type": "application/json",
//         },
//       }
//     );
//     const data = [await response.json()];

//     data.forEach(
//       ({
//         id,
//         base_variant_id,
//         price,
//         primary_image,
//         name,
//         availability,
//         images,
//         variants,
//       }) => {
//         variants.forEach(
//           ({
//             id,
//             product_id,
//             image_url,
//             price: variantPrice,
//             option_values,
//           }) => {
//             const newData = {
//               image: image_url || images[0]?.url_thumbnail || "",
//               title: `${name} ${
//                 option_values.length > 0
//                   ? `(${option_values.map((o) => o.label).join("/")})`
//                   : ""
//               }`,
//               productId: product_id.toString(),
//               variantId: id.toString(),
//               price: variantPrice?.toString() || price?.toString() || 0,
//               availableForSale: availability === "available",
//             };
//             products.push(newData);
//           }
//         );
//       }
//     );

//     return { products };
//   } else if (searchEntry) {
//     const response = await fetch(
//       `https://api.bigcommerce.com/stores/${domain}/v3/catalog/products?include=images,variants&name:like=${searchEntry}`,
//       {
//         method: "GET",
//         headers: {
//           "X-Auth-Token": accessToken,
//           "Content-Type": "application/json",
//         },
//       }
//     );
//     const responseData = await response.json();
//     const data = responseData.data;

//     data.forEach(
//       ({
//         id,
//         base_variant_id,
//         price,
//         primary_image,
//         name,
//         availability,
//         images,
//         variants,
//       }) => {
//         variants.forEach(
//           ({
//             id,
//             product_id,
//             image_url,
//             price: variantPrice,
//             option_values,
//           }) => {
//             const newData = {
//               image: image_url || images[0]?.url_thumbnail || "",
//               title: `${name} ${
//                 option_values.length > 0
//                   ? `(${option_values.map((o) => o.label).join("/")})`
//                   : ""
//               }`,
//               productId: product_id.toString(),
//               variantId: id.toString(),
//               price: variantPrice?.toString() || price?.toString() || 0,
//               availableForSale: availability === "available",
//             };
//             products.push(newData);
//           }
//         );
//       }
//     );

//     return { products };
//   }
// }
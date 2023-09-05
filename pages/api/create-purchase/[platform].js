import { gql, GraphQLClient } from "graphql-request";
import FormData from "form-data";

const handler = async (req, res) => {
  const { platform } = req.query;
  if (!transformer[platform]) {
    return res
      .status(400)
      .json({ error: "Create purchase endpoint for platform not found" });
  }

  try {
    const { error, url, purchaseId } = await transformer[platform](req, res);
    if (error) {
      return res.status(400).json({ error });
    } else {
      return res.status(200).json({
        url,
        purchaseId,
      });
    }
  } catch (err) {
    console.log({ err });
    return res.status(500).json({
      error: `${platform} create purchase endpoint failed, please try again.`,
    });
  }
};

export default handler;

const transformer = {
  shopify: async (req, res) => {
    const shopifyClient = new GraphQLClient(
      `https://${req.body.domain}/admin/api/graphql.json`,
      {
        headers: {
          "X-Shopify-Access-Token": req.body.accessToken,
        },
      }
    );

    const shopItems = req.body.cartItems.map(({ variantId, quantity }) => ({
      variantId: `gid://shopify/ProductVariant/${variantId}`,
      quantity,
    }));

    const input = {
      email: req.body.metafields.Email || req.body.email,
      note: "Openship order placed",
      shippingAddress: {
        firstName: req.body.address.first_name,
        lastName: req.body.address.last_name,
        address1: req.body.address.streetAddress1,
        address2: req.body.address.streetAddress2,
        city: req.body.address.city,
        province: req.body.address.state,
        zip: req.body.address.zip,
        countryCode: "US",
      },
      lineItems: shopItems,
      customAttributes: [{ key: "openship_order_id", value: req.body.orderId }],
      shippingLine: {
        title: "Free shipping",
        price: "0",
      },
    };

    const {
      draftOrderCreate: { draftOrder, userErrors },
    } = await shopifyClient.request(
      gql`
        mutation draftOrderCreate($input: DraftOrderInput!) {
          draftOrderCreate(input: $input) {
            draftOrder {
              id
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      { input }
    );

    const { draftOrderComplete } = await shopifyClient.request(
      gql`
        mutation draftOrderComplete($id: ID!, $paymentPending: Boolean) {
          draftOrderComplete(id: $id, paymentPending: $paymentPending) {
            draftOrder {
              order {
                id
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      {
        id: draftOrder.id,
        paymentPending: false,
      }
    );

    const orderRes = await fetch(
      `https://${
        req.body.domain
      }/admin/api/2020-04/orders/${draftOrderComplete.draftOrder.order.id
        .split("/")
        .pop()}.json`,
      {
        headers: {
          "X-Shopify-Access-Token": req.body.accessToken,
        },
      }
    );

    const {
      order: { order_status_url },
    } = await orderRes.json();

    return {
      url: order_status_url,
      purchaseId: draftOrderComplete.draftOrder.order.id.split("/").pop(),
    };
  },
  stockandtrace: async (req, res) => {
    const lineItems = req.body.cartItems.map(
      ({ productId, variantId, quantity, sku }) => ({
        // partNumber: `${productId}-${variantId}`,
        partNumber: sku.replace("\r\n", ""),
        quantity,
      })
    );

    const carrierMap = {
      shopify: "Free shipping",
      usps: "USPS",
      dhl_express: "DHL Express",
      ups_shipping: "UPS",
      fedex: "FedEx",
    };

    const STReqBody = {
      shippingOrders: [
        {
          supplier: req.body.metafields.Account,
          warehouse: req.body.metafields.Warehouse,
          shipTo: req.body.metafields.ShipTo,
          carrier: carrierMap[req.body.shippingMethod[0].source],
          purchaseOrder: req.body.orderName,
          lineItems,
          shipAddressDetails: {
            name: `${req.body.address.first_name} ${req.body.address.last_name}`,
            street1: req.body.address.streetAddress1,
            street2: req.body.address.streetAddress2,
            city: req.body.address.city,
            state: req.body.address.state,
            zip: req.body.address.zip,
            country: req.body.address.country,
            phone: req.body.address.phoneNumber,
            email: req.body.email,
          },
          notes: `Shopify Order:${req.body.shopOrderId} Service Level:${req.body.shippingMethod[0].title} `,
        },
      ],
    };

    const STResponse = await fetch(
      `https://${req.body.domain}/api/v2/shippingorders/create`,
      {
        credentials: "same-origin",
        mode: "cors",
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-type": "application/json",
          "X-Requested-With": "Fetch",
          Authorization: `WSSE profile=UsernameToken`,
          "X-WSSE": `/UsernameToken Token="${req.body.accessToken}"`,
        },
        body: JSON.stringify(STReqBody),
      }
    );
    console.log({ STResponse });
    console.log("ok?", STResponse.ok);
    if (!STResponse.ok) {
      const response = await STResponse.json();
      console.log({ response });

      return {
        error: `Error ${STResponse.status}: ${
          response.errors
            ? JSON.stringify(response.errors)
            : STResponse.statusText
        }`,
      };
    }

    const rfesponse = await STResponse.json();

    return {
      url: `https://${req.body.domain}/shipping/express/load/${rfesponse.shippingOrders[0].id}`,
      purchaseId: req.body.orderName.toString(),
    };
  },
  woocommerce: async (req, res) => {
    const {
      domain,
      accessToken,
      email,
      metafields,
      cartItems,
      address: {
        first_name,
        last_name,
        streetAddress1,
        streetAddress2,
        city,
        state,
        zip,
        country,
      },
    } = req.body;

    const line_items = cartItems.map((item) => ({
      product_id: item.productId,
      variation_id: item.variantId,
      quantity: item.quantity,
    }));
    const shipping = {
      first_name,
      last_name,
      address_1: streetAddress1,
      address_2: streetAddress2,
      city,
      state,
      postcode: zip,
      country,
    };
    const orderData = {
      line_items,
      shipping,
      status: "completed",
    };
    const createOrderResponse = await fetch(`${domain}/wp-json/wc/v3/orders`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(accessToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    const orderJson = await createOrderResponse.json();

    console.log({ orderJson });

    // 3. Handle errors and return success response
    if (createOrderResponse.status >= 400) {
      return {
        error: `Order creation failed.`,
      };
    } else {
      return {
        purchaseId: orderJson.id.toString(),
        url: `${domain}/wp-admin/post.php?post=${orderJson.id}&action=edit`,
      };
    }
  },
  bigcommerce: async (req, res) => {
    const shopItems = req.body.cartItems.map(({ productId, quantity }) => ({
      product_id: productId,
      quantity,
    }));

    // const customerResponse = await fetch(
    //   `https://api.bigcommerce.com/stores/${req.body.domain}/v2/customers?email=${req.body.email}`,
    //   {
    //     method: "GET",
    //     headers: {
    //       "X-Auth-Token": req.body.accessToken,
    //       "Content-Type": "application/json",
    //       Accept: "application/json",
    //     },
    //   }
    // );

    // const customer = await customerResponse.json();

    // console.log(req.body.address);

    const response = await fetch(
      `https://api.bigcommerce.com/stores/${req.body.domain}/v2/orders`,
      {
        method: "POST",
        headers: {
          "X-Auth-Token": req.body.accessToken,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          billing_address: {
            first_name: req.body.address.first_name,
            last_name: req.body.address.last_name,
            street_1: req.body.address.streetAddress1,
            city: req.body.address.city,
            state: req.body.address.state,
            zip: req.body.address.zip,
            country: "United States",
            country_iso2: "US",
            email: req.body.metafields.Email || req.body.email,
          },
          shipping_addresses: [
            {
              first_name: req.body.address.first_name,
              last_name: req.body.address.last_name,
              street_1: req.body.address.streetAddress1,
              street_2: req.body.address.streetAddress2,
              company: "",
              phone: "",
              city: req.body.address.city,
              state: req.body.address.state,
              zip: req.body.address.zip,
              country: "United States",
              country_iso2: "US",
              email: req.body.metafields.Email || req.body.email,
              shipping_method: "Free Shipping",
            },
          ],
          status_id: 11,
          staff_notes: "Openship order placed",
          products: shopItems,
          customer_id: 0,
        }),
      }
    );

    const data = await response.json();

    console.log({ data });
    // console.log("hello", data[0].details.errors[0].product.missing_option);
    // console.log({
    //   url: `https://store-${req.body.domain}.mybigcommerce.com/manage/orders/${data.id}`,
    //   purchaseId: data.id,
    // });

    if (data[0]?.status >= 400) {
      return {
        error: `Order creation failed.`,
      };
    } else {
      return {
        url: `https://store-${req.body.domain}.mybigcommerce.com/manage/orders/${data.id}`,
        purchaseId: data.id.toString(),
      };
    }
  },
};

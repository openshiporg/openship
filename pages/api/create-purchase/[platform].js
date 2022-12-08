import { gql, GraphQLClient, request } from "graphql-request";

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
  bigcommerce: async (req, res) => {
    console.log("****data*****",req.body.domain,req.body.orderId)

    const query = gql`
      {
        order (
          where: {
            id: "${req.body.orderId}"
          }
        ) {
          orderId
        }
      }
    `
    console.log("^^^^^^query^^^^^",query);

    const data = await request("https://michael.myopenship.com/api/graphql", query);

    console.log("!!!!!!!!!!!!!!",data)

    const order_id = data.order.orderId;

    console.log("~~~~orderid~~~~~",order_id)

    const orderResponse = await fetch(
      `https://api.bigcommerce.com/stores/${req.body.domain}/v2/orders/${order_id}`,
      {
        method: "GET",
        headers: {
          "X-Auth-Token": req.body.accessToken,
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      }
    )
    const orderData = await orderResponse.json();
    console.log("-------OrderData---------", orderData)

    const shippingResponse = await fetch(
      orderData.shipping_addresses.url,
      {
        method: "GET",
        headers: {
          "X-Auth-Token": req.body.accessToken,
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      }
    )

    const shippingData = await shippingResponse.json();

    const productsResponse = await fetch(
      `https://api.bigcommerce.com/stores/${req.body.domain}/v2/orders/${order_id}/products`,
      {
        method: "GET",
        headers: {
          "X-Auth-Token": req.body.accessToken,
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      }
    )

    const productsData = await productsResponse.json()

    const shopItems = req.body.cartItems.map((value, index) => {
      const product = productsData.filter(({product_id}) => (product_id === value.variantId))
      return {
        order_product_id: product[0].id,
        quantity: value.quantity > product[0].quantity ? product[0].quantity : value.quantity
      }
    });

    const response = await fetch(
      `https://api.bigcommerce.com/stores/${req.body.domain}/v2/orders/${order_id}/shipments`,
      {
        method: "POST",
        headers: {
          "X-Auth-Token": req.body.accessToken,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        data: {
          order_address_id: shippingData[0].id,
          shipping_method: shippingData[0].shipping_method,
          shipping_provider: shippingData[0].shipping_provider ? shippingData[0].shipping_provider : "usps",
          comments: "Openship order placed",
          items: shopItems
        }
      }
    )

    const result = await response.json()

    return {
      url: `https://store-${req.body.domain}.mybigcommerce.com/manage/orders`,
      purchaseId: order_id,
    };
  },
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
};

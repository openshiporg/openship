import Stripe from "stripe";

const stripeConfig = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2020-08-27",
});

export default stripeConfig;

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const endpoint = await stripe.webhookEndpoints.create({
  url: "https://marketplace-sand-rho.vercel.app/api/stripe/webhook",
  connect: true,
  enabled_events: ["checkout.session.completed", "account.updated"],
});

console.log("Signing secret:", endpoint.secret);

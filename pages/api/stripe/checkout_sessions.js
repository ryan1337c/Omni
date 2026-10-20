import { stripe } from "@/lib/stripe";
import { supabaseServerClient } from "@/lib/supaBaseServer";
import { getOrCreateStripeCustomer } from "@/lib/stripeCustomer";

const PRICES = {
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
  pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { plan } = req.body;
    const price = PRICES[plan];

    if (!price) {
      return res.status(400).json({ error: "Invalid subscription plan" });
    }

    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      data: { user },
      error,
    } = await supabaseServerClient.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const origin = req.headers.origin ?? process.env.NEXT_PUBLIC_APP_URL;

    const customerId = await getOrCreateStripeCustomer(user);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      client_reference_id: user.id,
      customer: customerId,
      // customer_email: user.email,
      metadata: {
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
      },
      line_items: [{ price, quantity: 1 }],
      success_url: `${origin}/pages/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pages/pricing`,
      allow_promotion_codes: true,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);

    return res.status(500).json({
      error: "Unable to create checkout session",
    });
  }
}

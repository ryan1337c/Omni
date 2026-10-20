import { stripe } from "@/lib/stripe";
import { supabaseServerClient } from "@/lib/supaBaseServer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: { message: "Unauthorized" } });
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseServerClient.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: { message: "Unauthorized" } });
    }

    // Get Stripe customer id
    const { data: entitlement, error: entitlementError } =
      await supabaseServerClient
        .from("user_entitlements")
        .select("stripe_customer_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (entitlementError) throw entitlementError;

    const customerId = entitlement?.stripe_customer_id;

    if (!customerId) {
      return res.status(404).json({
        error: {
          message: "No billing account found. Subscribe to a plan first.",
        },
      });
    }

    // It guarantees that origin variable always holds a usable URL string.
    const origin = req.headers.origin ?? process.env.NEXT_PUBLIC_APP_URL;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/pages/home?settings=billing`,
    });

    return res.status(200).json({ url: portalSession.url });
  } catch (error) {
    console.error("Stripe billing portal session error:", error);
    return res.status(500).json({
      error: {
        message: "Internal server error: Unable to open billing portal.",
      },
    });
  }
}

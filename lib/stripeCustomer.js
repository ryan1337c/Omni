import { stripe } from "@/lib/stripe";
import { supabaseServerClient } from "@/lib/supaBaseServer";

export async function getOrCreateStripeCustomer(user) {
  // 1. Read user_entitlements.stripe_customer_id
  const { data: entitlement } = await supabaseServerClient
    .from("user_entitlements")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (entitlement?.stripe_customer_id) {
    return entitlement.stripe_customer_id;
  }

  // 2. Fallback: any past subscription row (for users not backfilled yet)
  const { data: sub } = await supabaseServerClient
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .not("stripe_customer_id", "is", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (sub?.stripe_customer_id) {
    await supabaseServerClient
      .from("user_entitlements")
      .update({ stripe_customer_id: sub.stripe_customer_id })
      .eq("user_id", user.id);
    return sub.stripe_customer_id;
  }

  // 3. First-time payer: create once in Stripe
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { user_id: user.id },
  });

  await supabaseServerClient
    .from("user_entitlements")
    .update({ stripe_customer_id: customer.id })
    .eq("user_id", user.id);

  return customer.id;
}

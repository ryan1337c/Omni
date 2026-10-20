import { stripe } from "@/lib/stripe";
import { supabaseServerClient } from "@/lib/supaBaseServer";

const CANCELLABLE_STATUSES = ["active", "trialing", "past_due"];

function toIsoDate(unixTimestamp) {
  return unixTimestamp ? new Date(unixTimestamp * 1000).toISOString() : null;
}

function getSubscriptionPeriodEnd(subscription) {
  const item = subscription.items?.data?.[0];

  return subscription.current_period_end ?? item?.current_period_end ?? null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseServerClient.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: subscription, error: subscriptionError } =
      await supabaseServerClient
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .in("status", CANCELLABLE_STATUSES)
        .order("current_period_end", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (subscriptionError) {
      throw subscriptionError;
    }

    if (!subscription) {
      return res.status(404).json({ error: "No active subscription found" });
    }

    const updatedSubscription = await stripe.subscriptions.update(
      subscription.id,
      { cancel_at_period_end: true },
    );

    const currentPeriodEnd = toIsoDate(
      getSubscriptionPeriodEnd(updatedSubscription),
    );

    const { error: updateError } = await supabaseServerClient
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        current_period_end: currentPeriodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id);

    if (updateError) {
      throw updateError;
    }

    return res.status(200).json({
      cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
      currentPeriodEnd,
    });
  } catch (error) {
    console.error("Stripe cancellation error:", error);
    return res.status(500).json({
      error: "Unable to cancel subscription",
    });
  }
}

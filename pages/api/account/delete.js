import { stripe } from "@/lib/stripe";
import { supabaseServerClient } from "@/lib/supaBaseServer";

const CANCELLABLE_STATUSES = ["active", "trialing", "past_due"];

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

    const userId = user.id;
    const now = new Date().toISOString();

    // 1. Find subscriptions for this user
    const { data: subscriptions, error: subscriptionError } =
      await supabaseServerClient
        .from("subscriptions")
        .select("id, status")
        .eq("user_id", userId);

    if (subscriptionError) throw subscriptionError;

    // 2. Cancel active Stripe subscriptions immediately
    for (const sub of subscriptions ?? []) {
      if (!CANCELLABLE_STATUSES.includes(sub.status)) continue;

      try {
        await stripe.subscriptions.cancel(sub.id);
      } catch (error) {
        // Already canceled in Stripe — safe to continue
        const code = error?.code ?? error?.raw?.code;
        if (code !== "resource_missing") {
          console.error("Stripe cancel failed:", sub.id, error);
          throw error;
        }
      }
    }

    // 3. Update subscription rows (keep as billing history)
    if (subscriptions?.length) {
      const { error: updateError } = await supabaseServerClient
        .from("subscriptions")
        .update({
          status: "canceled",
          canceled_at: now,
          cancel_at_period_end: false,
          updated_at: now,
        })
        .eq("user_id", userId);

      if (updateError) throw updateError;
    }

    // 4. Delete auth user — cascades app data, SET NULL on subscriptions.user_id
    const { error: deleteError } =
      await supabaseServerClient.auth.admin.deleteUser(userId);

    if (deleteError) throw deleteError;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Account deletion error:", error);
    return res.status(500).json({ error: "Unable to delete account" });
  }
}

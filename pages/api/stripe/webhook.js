import { stripe } from "@/lib/stripe";
import { supabaseServerClient } from "@/lib/supaBaseServer";

export const config = {
  api: {
    bodyParser: false,
  },
};

const PRICE_TIERS = new Map(
  [
    [process.env.STRIPE_PRICE_PRO_MONTHLY, "pro"],
    [process.env.STRIPE_PRICE_PRO_YEARLY, "pro"],
  ].filter(([priceId]) => Boolean(priceId)),
);

const ENTITLED_STATUSES = ["active", "trialing", "past_due"];
const TIER_PRIORITY = {
  pro: 1,
  enterprise: 2,
};

async function readRawBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

function toIsoDate(unixTimestamp) {
  return unixTimestamp ? new Date(unixTimestamp * 1000).toISOString() : null;
}

function getSubscriptionPeriod(subscription) {
  const item = subscription.items.data[0];

  return {
    start: subscription.current_period_start ?? item?.current_period_start,
    end: subscription.current_period_end ?? item?.current_period_end,
  };
}

async function updateEntitlement(userId) {
  const { data: activeSubscriptions, error: subscriptionsError } =
    await supabaseServerClient
      .from("subscriptions")
      .select("id, tier, current_period_end")
      .eq("user_id", userId)
      .in("status", ENTITLED_STATUSES);

  if (subscriptionsError) {
    throw subscriptionsError;
  }

  const sourceSubscription = (activeSubscriptions ?? []).sort((a, b) => {
    const tierDifference =
      (TIER_PRIORITY[b.tier] ?? 0) - (TIER_PRIORITY[a.tier] ?? 0);

    if (tierDifference !== 0) return tierDifference;

    return (
      new Date(b.current_period_end ?? 0).getTime() -
      new Date(a.current_period_end ?? 0).getTime()
    );
  })[0];

  const { error: entitlementError } = await supabaseServerClient
    .from("user_entitlements")
    .upsert(
      {
        user_id: userId,
        tier: sourceSubscription?.tier ?? "free",
        source_subscription_id: sourceSubscription?.id ?? null,
        tier_expires_at: sourceSubscription?.current_period_end ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (entitlementError) {
    throw entitlementError;
  }
}

async function syncSubscription(subscription) {
  const userId = subscription.metadata?.user_id;
  const priceId = subscription.items.data[0]?.price?.id;
  const tier = PRICE_TIERS.get(priceId);

  if (!userId) {
    throw new Error(
      `Stripe subscription ${subscription.id} has no user_id metadata`,
    );
  }

  if (!tier) {
    throw new Error(
      `Stripe subscription ${subscription.id} has an unknown Price ID`,
    );
  }

  const period = getSubscriptionPeriod(subscription);

  const isScheduledToCancel =
    subscription.cancel_at_period_end ||
    (subscription.cancel_at !== null && subscription.cancel_at !== undefined);

  const { error: subscriptionError } = await supabaseServerClient
    .from("subscriptions")
    .upsert(
      {
        id: subscription.id,
        user_id: userId,
        stripe_customer_id: subscription.customer,
        stripe_price_id: priceId,
        tier,
        status: subscription.status,
        current_period_start: toIsoDate(period.start),
        current_period_end: toIsoDate(period.end),
        cancel_at_period_end: isScheduledToCancel,
        canceled_at: toIsoDate(subscription.canceled_at),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

  if (subscriptionError) {
    throw subscriptionError;
  }

  await supabaseServerClient
    .from("user_entitlements")
    .update({
      stripe_customer_id: subscription.customer,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .is("stripe_customer_id", null); // only if not set yet

  await updateEntitlement(userId);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const signature = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || Array.isArray(signature)) {
    return res.status(400).send("Missing Stripe signature");
  }

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return res.status(500).send("Webhook is not configured");
  }

  let event;

  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return res.status(400).send("Invalid webhook signature");
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription,
          );
          await syncSubscription(subscription);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        // const currentSubscription = await stripe.subscriptions.retrieve(
        //   event.data.object.id,
        // );
        await syncSubscription(event.data.object);
        break;
      }

      case "customer.subscription.deleted":
        await syncSubscription(event.data.object);
        break;

      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error(`Failed to process Stripe event ${event.id}:`, error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}

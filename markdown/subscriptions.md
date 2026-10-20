# Omni Subscription Schema & Workflow

## Overview

Stripe is the billing source of truth. Supabase stores synchronized entitlement data for fast UI and API checks.

| Table | Purpose |
|---|---|
| `subscriptions` | Stripe subscription history (one row per Stripe subscription) |
| `user_entitlements` | Current effective tier per user (one row per user) |
| `features` | Catalog of app features |
| `plan_features` | Which features each tier includes |
| `credit_usage` | Credits consumed per user per UTC period (day or month) |

Optional later: `entitlement_grants` for trials, gifts, and add-ons.

---

## Table Schemas

### 1. `subscriptions`

Stores Stripe billing records. A user can have multiple rows over time (cancel → resubscribe = new Stripe subscription ID).

```sql
CREATE TABLE public.subscriptions (
  id text PRIMARY KEY,                          -- Stripe subscription ID: sub_...
  user_id uuid NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,

  stripe_customer_id text NOT NULL,
  stripe_price_id text NOT NULL,

  tier text NOT NULL,                           -- 'pro' | 'enterprise'
  status text NOT NULL,                         -- Stripe status: active, trialing, past_due, canceled, etc.

  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  canceled_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX subscriptions_user_id_idx
  ON public.subscriptions(user_id);

CREATE INDEX subscriptions_user_status_idx
  ON public.subscriptions(user_id, status);
```

**Written by:** Stripe webhooks only (service-role key).  
**Not created on signup** — free users have no Stripe subscription.

---

### 2. `user_entitlements`

One row per user. This is what `AuthContext` and `getSubscription()` read.

```sql
CREATE TABLE public.user_entitlements (
  user_id uuid PRIMARY KEY
    REFERENCES auth.users(id) ON DELETE CASCADE,

  tier text NOT NULL DEFAULT 'free',            -- 'free' | 'pro' | 'enterprise'

  source_subscription_id text
    REFERENCES public.subscriptions(id) ON DELETE SET NULL,

  tier_expires_at timestamptz,                  -- optional; for scheduled downgrades
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Written by:**

- Signup trigger → `tier = 'free'`
- Stripe webhook handler → updates tier when subscription changes

**RLS:** Users can `SELECT` their own row only. No client `INSERT`/`UPDATE`.

---

### 3. `features`

Global feature catalog. Seeded once, not per user.

```sql
CREATE TABLE public.features (
  feature_key text PRIMARY KEY,
  name text NOT NULL,
  description text,

  value_type text NOT NULL CHECK (
    value_type IN ('boolean', 'integer')
  ),

  aggregation text NOT NULL CHECK (
    aggregation IN ('boolean_or', 'maximum', 'sum')
  ),

  created_at timestamptz NOT NULL DEFAULT now()
);
```

**Example seed:**

```sql
INSERT INTO public.features (feature_key, name, value_type, aggregation) VALUES
  ('chat_access',          'Chat',               'boolean', 'boolean_or'),
  ('resume_tailor_access', 'Resume Tailor',      'boolean', 'boolean_or'),
  ('flashcards_access',    'Flashcards',         'boolean', 'boolean_or'),
  ('quiz_access',          'Quizzes',            'boolean', 'boolean_or');
```

---

### 4. `plan_features`

Maps tiers to features. Seeded once.

```sql
CREATE TABLE public.plan_features (
  tier text NOT NULL,
  feature_key text NOT NULL
    REFERENCES public.features(feature_key) ON DELETE CASCADE,

  boolean_value boolean,
  integer_value integer,

  PRIMARY KEY (tier, feature_key),

  CHECK (
    (boolean_value IS NOT NULL AND integer_value IS NULL)
    OR
    (boolean_value IS NULL AND integer_value IS NOT NULL)
  )
);
```

**Example seed (Free = chat only; Pro/Enterprise = all features):**

```sql
INSERT INTO public.plan_features (tier, feature_key, boolean_value, integer_value) VALUES
  ('free',       'chat_access',          true,  null),
  ('free',       'resume_tailor_access', false, null),
  ('free',       'flashcards_access',    false, null),
  ('free',       'quiz_access',          false, null),

  ('pro',        'chat_access',          true,  null),
  ('pro',        'resume_tailor_access', true,  null),
  ('pro',        'flashcards_access',    true,  null),
  ('pro',        'quiz_access',          true,  null),

  ('enterprise', 'chat_access',          true,  null),
  ('enterprise', 'resume_tailor_access', true,  null),
  ('enterprise', 'flashcards_access',    true,  null),
  ('enterprise', 'quiz_access',          true,  null);
```

---

### 5. `credit_usage`

One row per user per UTC period. Free users use a daily key (`YYYY-MM-DD`, limit 20). Pro and Enterprise use a monthly key (`YYYY-MM`, limit 2500). Periods are calendar UTC, not Stripe billing dates.

The **limit is not stored on the row**. Pass the current tier’s limit at consume time so a Free→Pro upgrade starts a new monthly key with 2500 (daily Free usage is not carried over). A Pro→Free downgrade starts a new daily key; leftover Pro monthly credits do not apply.

```sql
CREATE TABLE public.credit_usage (
  user_id uuid NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  period_key text NOT NULL,          -- 'YYYY-MM-DD' (free) or 'YYYY-MM' (pro/enterprise)
  credits_used int NOT NULL DEFAULT 0 CHECK (credits_used >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, period_key)
);
```

**Written by:** service-role RPCs `consume_credits` and `refund_credits` only.  
**Read by:** authenticated users (own rows) and the server usage API (service-role).

**RLS:** Users can `SELECT` their own rows only. No client `INSERT`/`UPDATE`/`DELETE`.

Runnable script (table + RPCs + grants + RLS): [`sql/credit_usage.sql`](../sql/credit_usage.sql). Paste it into the Supabase SQL editor.

---

## Credit usage RPCs

Run the table (above), RPCs, grants, and RLS in the Supabase SQL editor — or apply [`sql/credit_usage.sql`](../sql/credit_usage.sql) as a single script. Writes go through these functions so concurrent generate requests cannot double-spend.

`consume_credits` atomically increments usage **only if** `credits_used + amount <= limit`. If that would exceed the cap, no row is updated and the function returns `NULL` (treat as insufficient credits). The first insert on a period also rejects `amount > limit`.

`refund_credits` subtracts, floored at 0. Used when OpenAI/DeepSeek fails after a reservation. Missing rows return `0` (nothing to refund).

Both functions are `SECURITY DEFINER` with an empty `search_path`. Execute is revoked from `anon` / `authenticated` and granted only to `service_role` (same pattern as Stripe webhook writes).

```sql
CREATE OR REPLACE FUNCTION public.consume_credits(
  p_user_id uuid,
  p_period_key text,
  p_amount integer,
  p_limit integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_credits_used integer;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id is required';
  END IF;
  IF p_period_key IS NULL OR length(trim(p_period_key)) = 0 THEN
    RAISE EXCEPTION 'p_period_key is required';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'p_amount must be positive';
  END IF;
  IF p_limit IS NULL OR p_limit < 0 THEN
    RAISE EXCEPTION 'p_limit must be non-negative';
  END IF;

  -- New period row: INSERT is not gated by the ON CONFLICT WHERE clause.
  IF p_amount > p_limit THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.credit_usage AS cu (user_id, period_key, credits_used, updated_at)
  VALUES (p_user_id, p_period_key, p_amount, now())
  ON CONFLICT (user_id, period_key) DO UPDATE
    SET
      credits_used = cu.credits_used + EXCLUDED.credits_used,
      updated_at = now()
    WHERE cu.credits_used + EXCLUDED.credits_used <= p_limit
  RETURNING cu.credits_used INTO v_credits_used;

  -- NULL when the WHERE clause skipped the update (over cap).
  RETURN v_credits_used;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_credits(
  p_user_id uuid,
  p_period_key text,
  p_amount integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_credits_used integer;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id is required';
  END IF;
  IF p_period_key IS NULL OR length(trim(p_period_key)) = 0 THEN
    RAISE EXCEPTION 'p_period_key is required';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'p_amount must be positive';
  END IF;

  UPDATE public.credit_usage
  SET
    credits_used = GREATEST(public.credit_usage.credits_used - p_amount, 0),
    updated_at = now()
  WHERE user_id = p_user_id
    AND period_key = p_period_key
  RETURNING public.credit_usage.credits_used INTO v_credits_used;

  RETURN COALESCE(v_credits_used, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.consume_credits(uuid, text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_credits(uuid, text, integer, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_credits(uuid, text, integer, integer) TO service_role;

REVOKE ALL ON FUNCTION public.refund_credits(uuid, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_credits(uuid, text, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_credits(uuid, text, integer) TO service_role;
```

**Call from the server** (service-role client in `lib/supaBaseServer.ts`):

```ts
const { data: creditsUsed, error } = await supabaseServerClient.rpc(
  "consume_credits",
  { p_user_id, p_period_key, p_amount, p_limit }
);
// creditsUsed === null → insufficient credits (HTTP 402)

await supabaseServerClient.rpc("refund_credits", {
  p_user_id,
  p_period_key,
  p_amount,
});
```

---

## Signup Trigger

When a user is created in `auth.users`, insert a free entitlement row:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user_entitlement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_entitlements (user_id, tier)
  VALUES (NEW.id, 'free')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_entitlement();
```

---

## RLS Policies

Enable RLS on all tables:

```sql
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_usage ENABLE ROW LEVEL SECURITY;
```

**User-specific tables (read own data only):**

```sql
CREATE POLICY "Users can view own entitlement"
ON public.user_entitlements
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can view own subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

REVOKE ALL ON TABLE public.credit_usage FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.credit_usage TO authenticated;
GRANT ALL ON TABLE public.credit_usage TO postgres, service_role;

CREATE POLICY "Users can view own credit usage"
ON public.credit_usage
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);
```

**Reference tables (publicly readable):**

```sql
CREATE POLICY "Features are publicly readable"
ON public.features
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Plan features are publicly readable"
ON public.plan_features
FOR SELECT
TO anon, authenticated
USING (true);
```

No client `INSERT`/`UPDATE`/`DELETE` policies on user-specific tables. Stripe webhooks and credit RPCs write using the service-role key (bypasses RLS).

---

## Subscription Workflow

### Phase 1: Signup

```text
User signs up (email or OAuth)
  → Supabase inserts auth.users
  → Trigger inserts user_entitlements (tier = 'free')
  → User logs in → AuthContext loads tier from user_entitlements
  → Home page shows lock icons on Resume, Quiz, Flashcards
```

### Phase 2: Paywall (in-app)

```text
Free user clicks locked feature (e.g. Resume)
  → Upgrade modal opens (blurred backdrop)
  → User selects Pro (or Enterprise link)
  → Client calls POST /api/stripe/checkout_sessions
  → Server creates Stripe Checkout Session (mode: subscription)
  → Browser redirects to checkout.stripe.com
```

**Before redirect:** store intended feature, e.g. `sessionStorage.setItem("pendingFeature", "resume")`.

### Phase 3: Payment & webhook

```text
User completes payment on Stripe
  → Stripe sends webhook events to your server:
      • checkout.session.completed
      • customer.subscription.created
      • customer.subscription.updated
  → Webhook handler (service-role):
      1. Verify Stripe signature
      2. Map stripe_price_id → tier ('pro' | 'enterprise')
      3. Upsert subscriptions row (id = Stripe sub ID)
      4. Update user_entitlements (tier, source_subscription_id)
  → Stripe redirects user to success_url
      e.g. /pages/success?session_id=...
      or /pages/home?checkout=success&feature=resume
```

**Status → tier mapping (webhook logic):**

| Stripe `status` | Effective tier |
|---|---|
| `active`, `trialing` | Paid tier from price ID |
| `past_due` | Paid tier (grace period — your choice) |
| `canceled`, `unpaid`, `incomplete_expired` | `free` |

If `cancel_at_period_end = true`, keep paid tier until `current_period_end`, then downgrade.

### Phase 4: Return to app

```text
User lands on success page / home
  → AuthContext refetches user_entitlements (or Supabase Realtime)
  → tier !== 'free' → lock icons disappear
  → setChatMode(pendingFeature) → open Resume/Quiz/Flashcards
```

### Phase 5: Cancellation / resubscribe

```text
User cancels via Stripe Customer Portal
  → customer.subscription.updated (cancel_at_period_end = true)
  → Keep pro until period end
  → customer.subscription.deleted at period end
  → user_entitlements.tier = 'free'

User resubscribes later
  → New Stripe subscription ID (sub_...)
  → New row in subscriptions
  → user_entitlements updated to new tier
```

---

## Data Flow Diagram

```text
┌─────────────┐     webhook      ┌──────────────────┐
│   Stripe    │ ───────────────► │  subscriptions   │
└─────────────┘                  └────────┬─────────┘
       ▲                                  │
       │ checkout                         │ sync
       │                                  ▼
┌──────┴──────┐                  ┌──────────────────┐
│  Your App   │ ◄── read tier ── │ user_entitlements│
│ AuthContext │                  └────────┬─────────┘
└─────────────┘                           │
       │                                  │ tier
       │                                  ▼
       │                         ┌──────────────────┐
       └── feature check ───────►│  plan_features   │
                                 └────────┬─────────┘
                                          │
                                          ▼
                                 ┌──────────────────┐
                                 │     features     │
                                 └──────────────────┘
```

---

## Tier → Feature Access

| Feature | Free | Pro | Enterprise |
|---|---|---|---|
| Chat | Yes | Yes | Yes |
| Resume Tailor | No | Yes | Yes |
| Quizzes | No | Yes | Yes |
| Flashcards | No | Yes | Yes |

Effective access = `user_entitlements.tier` → lookup in `plan_features`.

---

## App Integration (current codebase)

| Component | Role |
|---|---|
| `app/context/AuthContext.tsx` | Loads `tier` from `user_entitlements` on login |
| `lib/publicServices.js` → `getSubscription()` | Queries `user_entitlements.tier` |
| `app/pages/home/page.tsx` | Paywall UI + lock icons for free tier |
| `pages/api/stripe/checkout_sessions.js` | Creates Stripe Checkout Session |
| Webhook handler (to build) | Syncs Stripe → `subscriptions` + `user_entitlements` |

---

## Security Rules

1. **Never** trust client-side `tier` for API authorization — verify server-side.
2. **Never** expose `SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_SECRET_KEY` to the browser.
3. Webhook handler must verify `STRIPE_WEBHOOK_SECRET` on every event.
4. RLS on `user_entitlements` and `credit_usage`: users read own rows only; writes via service role.
5. Block `/api/generateResume`, `/api/generateQuiz`, `/api/generateDeck` for free users.
6. Credit consume/refund only through `consume_credits` / `refund_credits` (service-role). Never increment `credit_usage` from the client.

---

## Optional: `entitlement_grants` (trials, gifts, add-ons)

Use when you need feature-specific expirations separate from billing:

```sql
CREATE TABLE public.entitlement_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_key text NOT NULL REFERENCES public.features(feature_key) ON DELETE CASCADE,
  source text NOT NULL CHECK (
    source IN ('subscription_addon', 'one_time_addon', 'support_gift', 'trial', 'admin')
  ),
  source_id text NOT NULL,
  boolean_value boolean,
  integer_value integer,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, source_id, feature_key)
);
```

Effective access = base tier from `plan_features` **plus** active grants where `expires_at > now()` and `revoked_at IS NULL`.

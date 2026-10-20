import type { NextApiRequest } from "next";
import type { User } from "@supabase/supabase-js";
import { supabaseServerClient } from "@/lib/supaBaseServer";

const TIER_RANK = {
  free: 0,
  pro: 1,
  enterprise: 2,
} as const;

export type Tier = keyof typeof TIER_RANK;

function normalizeTier(tier: string): Tier {
  if (tier === "pro" || tier === "enterprise" || tier === "free") {
    return tier;
  }
  return "free";
}

export async function getEffectiveTier(userId: string, now = Date.now()): Promise<Tier> {
  const { data, error } = await supabaseServerClient
    .from("user_entitlements")
    .select("tier, tier_expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (
    data?.tier_expires_at &&
    Date.parse(data.tier_expires_at) < now
  ) {
    return "free";
  }

  return normalizeTier(data?.tier ?? "free");
}

export type AuthResult =
  | { ok: true; user: User }
  | { ok: false; status: 401; error: string };

export type EntitlementResult =
  | { ok: true; tier: string }
  | { ok: false; status: 403; error: string; tier: string };

function getBearerToken(req: NextApiRequest): string | null {
  const raw = req.headers.authorization;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const match = value?.match(/^Bearer\s+(\S+)/i);
  return match?.[1] ?? null;
}

export async function requireUser(req: NextApiRequest): Promise<AuthResult> {
  const token = getBearerToken(req);
  if (!token) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const {
    data: { user },
    error,
  } = await supabaseServerClient.auth.getUser(token);

  if (error || !user) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  return { ok: true, user };
}

export async function requireEntitlement(
  userId: string,
  minTier: Exclude<Tier, "free"> = "pro",
): Promise<EntitlementResult> {
  const tier = await getEffectiveTier(userId);

  if (TIER_RANK[tier] < TIER_RANK[minTier]) {
    return {
      ok: false,
      status: 403,
      error: "This feature requires a Pro plan",
      tier,
    };
  }

  return { ok: true, tier };
}

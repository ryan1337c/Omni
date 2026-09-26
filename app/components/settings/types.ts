export type SettingsSection = "general" | "billing" | "account";

export type AccountDialog = "name" | "delete" | null;

export type CheckoutPlan = "pro_monthly" | "pro_yearly";

export type BillingSummary = {
  tier: string;
  tier_expires_at: string | null;
  source_subscription_id: string | null;
  status?: string;
  cancel_at_period_end?: boolean;
};

import { supabaseServerClient } from "@/lib/supaBaseServer";

export interface ICreditLedger {
  consume(
    userId: string,
    periodKey: string,
    amount: number,
    limit: number,
  ): Promise<number | null>;
  refund(userId: string, periodKey: string, amount: number): Promise<number>;
  getUsage(userId: string, periodKey: string): Promise<number>;
}

export class SupabaseCreditLedger implements ICreditLedger {
  constructor(private readonly client = supabaseServerClient) {}

  async consume(
    userId: string,
    periodKey: string,
    amount: number,
    limit: number,
  ): Promise<number | null> {
    const { data, error } = await this.client.rpc("consume_credits", {
      p_user_id: userId,
      p_period_key: periodKey,
      p_amount: amount,
      p_limit: limit,
    });

    if (error) {
      throw error;
    }

    return data as number | null;
  }

  async refund(
    userId: string,
    periodKey: string,
    amount: number,
  ): Promise<number> {
    const { data, error } = await this.client.rpc("refund_credits", {
      p_user_id: userId,
      p_period_key: periodKey,
      p_amount: amount,
    });

    if (error) {
      throw error;
    }

    return (data as number | null) ?? 0;
  }

  async getUsage(userId: string, periodKey: string): Promise<number> {
    const { data, error } = await this.client
      .from("credit_usage")
      .select("credits_used")
      .eq("user_id", userId)
      .eq("period_key", periodKey)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data?.credits_used ?? 0;
  }
}

export const creditLedger: ICreditLedger = new SupabaseCreditLedger();

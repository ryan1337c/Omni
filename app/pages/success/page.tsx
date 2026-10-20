import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { redirect } from "next/navigation";

import { stripe } from "@/lib/stripe";

type SuccessPageProps = {
  searchParams: Promise<{
    session_id?: string;
  }>;
};

export default async function SuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    redirect("/pages/pricing");
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.status !== "complete") {
    redirect("/pages/pricing");
  }

  const customerEmail = session.customer_details?.email;

  return (
    <main className="flex min-h-screen items-center justify-center bg-landingPageLight px-4 text-slate-900 dark:bg-landingPage dark:text-white">
      <section className="w-full max-w-lg rounded-2xl border border-violet-200 bg-white p-8 text-center shadow-xl dark:border-purple-400/20 dark:bg-slate-900">
        <CheckCircle2
          aria-hidden="true"
          className="mx-auto h-16 w-16 text-green-500"
        />

        <h1 className="mt-5 text-3xl font-bold">Subscription successful</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Welcome to Omni Pro. Your checkout has been completed.
        </p>

        {customerEmail && (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Stripe will send a confirmation receipt to {customerEmail}.
          </p>
        )}

        <Link
          href="/pages/home"
          className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3 font-semibold text-white transition hover:-translate-y-0.5"
        >
          Continue to Omni
        </Link>
      </section>
    </main>
  );
}
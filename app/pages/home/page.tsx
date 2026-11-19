import { Suspense } from "react";
import HomePage from "@/app/components/home";
import AppLoading from "@/app/components/AppLoading";

export type { RecentChat } from "@/app/components/home";

export default function Page() {
  return (
    <Suspense fallback={<AppLoading />}>
      <HomePage />
    </Suspense>
  );
}
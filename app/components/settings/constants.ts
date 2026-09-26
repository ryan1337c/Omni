import {
  CreditCard,
  Settings2,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";

import type { SettingsSection } from "./types";

export const sections = [
  { id: "general", label: "General", icon: SlidersHorizontal },
  { id: "billing", label: "Billing & Plan", icon: CreditCard },
  { id: "account", label: "Account", icon: UserRound },
] satisfies Array<{
  id: SettingsSection;
  label: string;
  icon: typeof Settings2;
}>;

export const themes = [
  { id: "system", label: "System" },
  { id: "dark", label: "Dark" },
  { id: "light", label: "Light" },
] as const;

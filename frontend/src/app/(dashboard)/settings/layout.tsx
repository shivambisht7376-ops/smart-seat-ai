import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Settings",
  description: "Manage account preferences, theme, notifications and system configuration",
};
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

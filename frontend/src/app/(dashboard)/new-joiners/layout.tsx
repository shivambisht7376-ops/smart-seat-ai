import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "New Joiners",
  description: "Manage seat allocation queue for incoming employees",
};
export default function NewJoinersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

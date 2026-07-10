import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Allocations",
  description: "Track and manage seat allocations, releases and transfers",
};
export default function AllocationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

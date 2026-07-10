import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Seats",
  description: "Manage seats, floors, zones and building layout with utilization tracking",
};
export default function SeatsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

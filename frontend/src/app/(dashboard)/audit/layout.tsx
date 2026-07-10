import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Audit Logs",
  description: "Full audit trail of all system actions — employee, seat, project and allocation changes",
};
export default function AuditLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

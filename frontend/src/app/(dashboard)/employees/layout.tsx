import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Employees",
  description: "Manage all employees — directory, search, allocation status and project assignments",
};

export default function EmployeesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

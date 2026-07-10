import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description: "Manage all projects — team members, allocation, timeline and budget tracking",
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

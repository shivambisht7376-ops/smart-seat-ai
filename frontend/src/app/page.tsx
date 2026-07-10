import { redirect } from "next/navigation";

/**
 * Root page — redirects to dashboard if authenticated, else login.
 * Authentication check happens in middleware.ts
 */
export default function RootPage() {
  redirect("/dashboard");
}

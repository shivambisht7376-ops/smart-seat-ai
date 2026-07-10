import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SmartSeat AI — Enterprise Workforce Management",
    template: "%s | SmartSeat AI",
  },
  description:
    "Intelligent seat allocation and project mapping platform for enterprise workforce management. Manage 5,000+ employees, projects, and office seats with AI-powered insights.",
  keywords: [
    "seat allocation",
    "workforce management",
    "employee management",
    "project mapping",
    "office management",
    "HR platform",
  ],
  authors: [{ name: "SmartSeat AI Team" }],
  creator: "SmartSeat AI",
  robots: {
    index: false, // enterprise app — not for public indexing
    follow: false,
  },
  openGraph: {
    title: "SmartSeat AI",
    description: "Enterprise Seat Allocation & Project Mapping Platform",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                classNames: {
                  toast:
                    "glass-card border-border text-foreground text-sm",
                  success: "border-success/40",
                  error: "border-destructive/40",
                  warning: "border-warning/40",
                  info: "border-primary/40",
                },
              }}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

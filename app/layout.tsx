import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/components/posthog-provider";
import { DevAdminBadge } from "@/components/dev-admin-badge";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Carnatic Artist Portal",
  description: "A portal for Carnatic musicians based in The Netherlands",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PostHogProvider>{children}</PostHogProvider>
        <DevAdminBadge />
      </body>
    </html>
  );
}

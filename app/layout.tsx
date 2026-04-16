import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/components/posthog-provider";
import { SiteFooter } from "@/components/site-footer";
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
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <PostHogProvider>{children}</PostHogProvider>
        </div>
        <SiteFooter />
        <DevAdminBadge />
      </body>
    </html>
  );
}

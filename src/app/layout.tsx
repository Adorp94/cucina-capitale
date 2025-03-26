"use client";

import type { Metadata, Viewport } from "next";

export const dynamic = "force-dynamic";
import ClientLayout from "@/app/client-layout";

export const metadata: Metadata = {
  title: "Cucina Capitale",
  description: "Sistema de gestión para carpintería residencial",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ClientLayout>{children}</ClientLayout>;
}

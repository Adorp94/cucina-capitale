import type { Metadata } from "next";
import ClientLayout from "@/app/client-layout";

export const metadata: Metadata = {
  title: "Cucina Capitale",
  description: "Sistema de gestión para carpintería residencial",
  viewport: "width=device-width, initial-scale=1",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ClientLayout>{children}</ClientLayout>;
}

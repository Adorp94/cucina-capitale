import type { Metadata, Viewport } from "next";
import ClientClerkProvider from "@/components/providers/clerk-provider";
import { Inter } from "next/font/google";
import "./globals.css";
import "react-day-picker/dist/style.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

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
  return (
    <html lang="es">
      <body className={`${inter.variable} antialiased flex flex-col min-h-screen`}>
        <ClientClerkProvider>
          {children}
        </ClientClerkProvider>
      </body>
    </html>
  );
}

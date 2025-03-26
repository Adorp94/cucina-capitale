'use client';

import { Auth0Provider } from '@auth0/auth0-react';
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function AuthProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN || 'dev-av1unzc74ll0psau.us.auth0.com';
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || 'epieg4ZG5ZP0MgdE134GuBqFsE3110Gz';

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: typeof window !== 'undefined' ? window.location.origin : undefined,
      }}
    >
      <Header />
      <div className="flex-1 flex flex-col">
        {children}
      </div>
      <Footer />
      <Toaster />
    </Auth0Provider>
  );
} 
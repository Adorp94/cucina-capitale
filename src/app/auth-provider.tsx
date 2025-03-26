'use client';

import { Auth0Provider } from '@auth0/auth0-react';
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import BasicLayout from "@/components/layout/basic-layout";
import { useState, useEffect } from 'react';

export default function AuthProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN || 'dev-av1unzc74ll0psau.us.auth0.com';
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || 'epieg4ZG5ZP0MgdE134GuBqFsE3110Gz';
  
  // Use client-side only rendering for Auth0Provider
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    // Return a basic layout without Auth0 dependencies during initial loading
    return (
      <BasicLayout>
        <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </BasicLayout>
    );
  }

  // Use a callback URL that matches one of your Auth0 settings
  const callbackUrl = `${window.location.origin}/callback`;

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: callbackUrl,
      }}
      cacheLocation="localstorage"
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
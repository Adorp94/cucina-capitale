'use client';

import Image from "next/image";
import LogoutButton from "./logout-button";
import { useState, useEffect } from "react";
import { useSafeAuth0 } from "@/hooks/use-safe-auth0";

export default function UserProfile() {
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated, isLoading } = useSafeAuth0();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Only use Auth0 data after client-side mount
  const shouldShow = mounted && !isLoading;

  if (!shouldShow) {
    return <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Ensure the user picture URL is valid
  const pictureUrl = user.picture || '';

  return (
    <div className="relative group">
      <button className="h-8 w-8 rounded-full overflow-hidden border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
        {pictureUrl ? (
          <Image
            src={pictureUrl}
            alt={user.name || "User profile"}
            width={32}
            height={32}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-blue-500 text-white">
            {user.name?.charAt(0) || "U"}
          </div>
        )}
      </button>
      
      <div className="absolute right-0 top-full mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 hidden group-hover:block z-10">
        <div className="py-2 px-4 border-b">
          <p className="font-medium">{user.name}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
        <div className="py-1">
          <LogoutButton className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
            Cerrar sesión
          </LogoutButton>
        </div>
      </div>
    </div>
  );
} 
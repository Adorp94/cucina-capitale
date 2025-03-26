'use client';

import { useSafeAuth0 } from "@/hooks/use-safe-auth0";

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function LogoutButton({ className, children }: LogoutButtonProps) {
  const { logout } = useSafeAuth0();

  return (
    <button 
      onClick={() => logout({ 
        logoutParams: { 
          returnTo: window.location.origin 
        } 
      })} 
      className={className}
    >
      {children ? children : "Salir"}
    </button>
  );
} 
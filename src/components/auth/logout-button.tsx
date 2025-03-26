'use client';

import { useAuth0 } from "@auth0/auth0-react";

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function LogoutButton({ className, children }: LogoutButtonProps) {
  const { logout } = useAuth0();

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
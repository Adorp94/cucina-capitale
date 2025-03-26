'use client';

import { useAuth0 } from "@auth0/auth0-react";

interface LoginButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function LoginButton({ className, children }: LoginButtonProps) {
  const { loginWithRedirect } = useAuth0();

  return (
    <button 
      onClick={() => loginWithRedirect()} 
      className={className}
    >
      {children ? children : "Ingresar"}
    </button>
  );
} 
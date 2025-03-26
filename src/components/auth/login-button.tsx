'use client';

import { useSafeAuth0 } from "@/hooks/use-safe-auth0";

interface LoginButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function LoginButton({ className, children }: LoginButtonProps) {
  const { loginWithRedirect } = useSafeAuth0();

  return (
    <button 
      onClick={() => loginWithRedirect()} 
      className={className}
    >
      {children ? children : "Ingresar"}
    </button>
  );
} 
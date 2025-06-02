'use client';

import { useSafeAuth0 } from "@/hooks/use-safe-auth0";

interface LoginButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function LoginButton({ className, children }: LoginButtonProps) {
  const { loginWithRedirect } = useSafeAuth0();

  const handleLogin = () => {
    loginWithRedirect({
      authorizationParams: {
        screen_hint: "login", // Forces login, not sign up
      },
    });
  };

  return (
    <button onClick={handleLogin} className={className}>
      {children ? children : "Ingresar"}
    </button>
  );
} 
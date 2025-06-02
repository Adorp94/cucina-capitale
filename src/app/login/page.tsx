"use client";

import LoginButton from "@/components/auth/login-button";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-4">Bienvenido a Cucina Capitale</h1>
        <p className="mb-6 text-gray-600">
          Inicia sesión para acceder a la plataforma. Solo usuarios invitados pueden ingresar.
        </p>
        <LoginButton className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold text-lg">
          Iniciar sesión
        </LoginButton>
      </div>
    </div>
  );
} 
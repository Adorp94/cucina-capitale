import { SignIn } from "@clerk/nextjs";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Login | Cucina Capitale",
  description: "Login to your account",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-[480px] mx-auto px-4">
      <div className="p-6 sm:p-8 bg-white rounded-xl shadow-lg w-full overflow-hidden">
        <div className="flex flex-col items-center mb-6">
          <Image 
            src="/logo-completo.png" 
            alt="Cucina Capitale Logo" 
            width={160} 
            height={40} 
            className="object-contain mb-5"
            priority
          />
          <h1 className="text-xl font-bold text-center text-gray-800">Iniciar sesión</h1>
          <p className="text-gray-500 text-center mt-2 text-sm max-w-xs mx-auto">
            Accede a tu cuenta para gestionar tus proyectos
          </p>
        </div>
        <div className="w-full">
          <SignIn 
            routing="path" 
            path="/login" 
            redirectUrl={`${process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || '/dashboard'}`}
          />
        </div>
      </div>
    </div>
  );
} 
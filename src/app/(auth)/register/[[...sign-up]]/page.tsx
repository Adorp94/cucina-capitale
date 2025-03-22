import { SignUp } from "@clerk/nextjs";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Ingresar | Cucina Capitale",
  description: "Crear una cuenta para acceder a la plataforma",
};

export default function RegisterPage() {
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
          <h1 className="text-xl font-bold text-center text-gray-800">Ingresar</h1>
          <p className="text-gray-500 text-center mt-2 text-sm max-w-xs mx-auto">
            Crea tu cuenta para acceder a nuestra plataforma de gestión para carpintería residencial
          </p>
        </div>
        <div className="w-full">
          <SignUp 
            routing="path" 
            path="/register" 
            redirectUrl={`${process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || '/dashboard'}`}
          />
        </div>
      </div>
    </div>
  );
} 
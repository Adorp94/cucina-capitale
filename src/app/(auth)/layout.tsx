import { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { userId } = await auth();
  
  // If user is already signed in, redirect to dashboard
  if (userId) {
    redirect("/dashboard");
  }
  
  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 flex items-center justify-center py-6">
        {children}
      </main>
      <footer className="border-t py-3">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <p className="text-xs text-gray-400 text-center">
            © 2024 Cucina Capitale
          </p>
        </div>
      </footer>
    </div>
  );
} 
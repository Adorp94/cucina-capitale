import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default async function Home() {
  // Get the auth session
  const { userId } = await auth();
  
  // If user is already signed in, redirect to dashboard
  if (userId) {
    redirect('/dashboard');
  }
  
  return (
    <main className="flex-1 flex items-center justify-center">
      <section className="w-full py-12 md:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center justify-center space-y-10 text-center">
            <Image 
              src="/logo-completo.png" 
              alt="Cucina Capitale Logo" 
              width={280} 
              height={70} 
              className="object-contain"
              priority
            />
            <div className="space-y-4 max-w-3xl mx-auto">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Sistema de gestión
              </h1>
              <p className="text-gray-500 md:text-lg mx-auto">
                Diseñado especialmente para empresas de carpintería residencial, administre presupuestos y proyectos de forma eficiente.
              </p>
            </div>
            <div className="pt-4">
              <Button asChild size="lg" className="px-10 py-6 text-base">
                <Link href="/register">Ingresar</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

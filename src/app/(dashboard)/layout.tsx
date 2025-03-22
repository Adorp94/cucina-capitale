import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/');
  }
  
  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <main className="flex-1 container max-w-7xl mx-auto px-4 md:px-6 py-6">
        {children}
      </main>
    </div>
  );
}

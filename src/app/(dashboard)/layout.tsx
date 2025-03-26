import { ReactNode } from 'react';
import DashboardAuth0Wrapper from '@/components/dashboard/auth0-wrapper';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DashboardAuth0Wrapper>
      <div className="flex-1 flex flex-col bg-gray-50">
        <main className="flex-1 container max-w-7xl mx-auto px-4 md:px-6 py-6">
          {children}
        </main>
      </div>
    </DashboardAuth0Wrapper>
  );
}

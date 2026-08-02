import React from 'react';
import DashboardPanel from '@/features/dashboard/components/DashboardPanel';

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col gap-8">
      <h1 className="text-4xl font-extrabold tracking-tight text-white">System Dashboard</h1>
      <DashboardPanel />
    </div>
  );
}

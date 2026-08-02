import React from 'react';
import MarketPanel from '@/features/market/components/MarketPanel';

export default function MarketPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-widest text-accent-cyan font-bold">Feature Workspace</span>
        <h1 className="text-4xl font-extrabold tracking-tight text-white">Market View</h1>
      </div>
      <MarketPanel />
    </div>
  );
}

import React from 'react';
import ResearchPanel from '@/features/research/components/ResearchPanel';

export default function ResearchPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-widest text-accent-cyan font-bold">Feature Workspace</span>
        <h1 className="text-4xl font-extrabold tracking-tight text-white">Research View</h1>
      </div>
      <ResearchPanel />
    </div>
  );
}

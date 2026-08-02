import React from 'react';
import { 
  Sparkles, Layers, Sliders, ShieldCheck, Zap, 
  Database, DatabaseBackup, Command, BookOpen, 
  Presentation, BarChart3, Settings, Shield, UserCheck 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const modulesList = [
    { name: 'Authentication', icon: UserCheck, desc: 'OAuth & role-based route guard profiles.', path: '/auth' },
    { name: 'Analytics Dashboard', icon: BarChart3, desc: 'High fidelity chart views & pipelines.', path: '/dashboard' },
    { name: 'Asset Market', icon: Layers, desc: 'Browse and trade premium generated digital assets.', path: '/market' },
    { name: 'Research Lab', icon: Zap, desc: 'Market intelligence and structural search analysis.', path: '/research' },
    { name: 'NotebookLM Integration', icon: BookOpen, desc: 'Synthesize document sources into active prompts.', path: '/notebooklm' },
    { name: 'Slides Generator', icon: Presentation, desc: 'Automate high-quality slide decks via AI layouts.', path: '/slides' },
    { name: 'Asset Engine', icon: Sparkles, desc: 'Generate multi-format commercial assets on command.', path: '/asset' },
    { name: 'Prompt Studio', icon: Command, desc: 'Fine-tuned prompt parameters & vector embedding.', path: '/prompt' },
    { name: 'Automation Pipeline', icon: Sliders, desc: 'Trigger complex background generation cycles.', path: '/automation' },
    { name: 'Quality Control', icon: ShieldCheck, desc: 'Automate rating validation & visual filtering.', path: '/quality' },
    { name: 'Distributed Storage', icon: DatabaseBackup, desc: 'Fast object uploads and S3 sync workflows.', path: '/storage' },
    { name: 'Background Jobs', icon: Database, desc: 'Monitor BullMQ progress & Redis caching metrics.', path: '/jobs' },
    { name: 'Settings Control', icon: Settings, desc: 'Workspace settings, keys, and rate controls.', path: '/settings' }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030712]">
      {/* Decorative gradient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent-violet/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-cyan/10 blur-[150px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-zinc-900 glassmorphism sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent-violet to-accent-cyan flex items-center justify-center font-bold text-white shadow-lg">
              A
            </div>
            <span className="font-bold tracking-tight text-white text-lg">AI Asset Factory</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
            <a href="#stack" className="hover:text-white transition-colors">Tech Stack</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">Docs</Button>
            <Button variant="premium" size="sm">Launch App</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-20 flex flex-col items-center justify-center text-center gap-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-cyan/30 bg-accent-cyan/5 text-xs text-accent-cyan font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" /> Introducing Modular Monolith Generation
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl">
          Automate Premium Commercial <span className="gradient-text">Design Assets</span>
        </h1>
        
        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl font-light">
          An enterprise-ready AI Asset Engine built on a highly scalable, production-grade Modular Monolith architecture.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mt-4">
          <Button variant="premium" size="lg">Get Started</Button>
          <Button variant="outline" size="lg">Explore Architecture</Button>
        </div>

        {/* Feature Grid */}
        <section id="features" className="w-full mt-24 flex flex-col gap-12 text-left">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-extrabold text-white">System Modules</h2>
            <p className="text-zinc-500 max-w-xl">
              13 logically isolated workspaces structured to scale. Click on any module to review its sandbox layout.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modulesList.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <a 
                  key={idx} 
                  href={mod.path} 
                  className="group relative glassmorphism p-6 rounded-2xl border border-zinc-900 hover:border-zinc-800 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-accent/5 to-transparent rounded-tr-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-accent-cyan group-hover:text-white group-hover:bg-accent transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg text-white group-hover:text-accent-cyan transition-colors">{mod.name}</h3>
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed">{mod.desc}</p>
                </a>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 mt-20 py-8 text-center text-sm text-zinc-600">
        <p>&copy; 2026 AI Asset Factory. Structured as a Bounded Modular Monolith.</p>
      </footer>
    </div>
  );
}

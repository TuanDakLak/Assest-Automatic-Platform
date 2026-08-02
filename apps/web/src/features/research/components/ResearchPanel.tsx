'use client';

import React, { useState } from 'react';
import { Sparkles, FileText, Download, Copy, Check, Loader2, ArrowRight } from 'lucide-react';

export default function ResearchPanel() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [markdown, setMarkdown] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError('');
    setMarkdown('');

    try {
      const response = await fetch('http://localhost:3001/api/v1/research/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to generate research. Ensure backend is running.');
      }

      const data = await response.json();
      setMarkdown(data.markdown);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!markdown) return;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_research.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Custom parser to map markdown blocks into modern React cards
  const renderMarkdown = (text: string) => {
    if (!text) return null;

    const lines = text.split('\n');
    const renderedElements: React.ReactNode[] = [];
    let currentList: React.ReactNode[] = [];
    let listKey = 0;

    const flushList = () => {
      if (currentList.length > 0) {
        renderedElements.push(
          <ul key={`list-${listKey++}`} className="list-disc pl-6 space-y-2 mb-4 text-zinc-300">
            {currentList}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('# ')) {
        flushList();
        renderedElements.push(
          <h2 key={index} className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan to-accent-violet mb-4 mt-6">
            {trimmed.replace('# ', '')}
          </h2>
        );
      } else if (trimmed.startsWith('## ')) {
        flushList();
        renderedElements.push(
          <h3 key={index} className="text-xl font-bold text-white border-b border-zinc-800 pb-2 mb-4 mt-8 flex items-center gap-2">
            <span className="w-1.5 h-6 rounded bg-accent-cyan"></span>
            {trimmed.replace('## ', '')}
          </h3>
        );
      } else if (trimmed.startsWith('> ')) {
        flushList();
        renderedElements.push(
          <div key={index} className="p-4 rounded-xl bg-indigo-950/40 border border-accent/20 text-accent-cyan text-sm italic my-4">
            {trimmed.replace('> ', '')}
          </div>
        );
      } else if (trimmed.startsWith('---')) {
        flushList();
        renderedElements.push(
          <hr key={index} className="border-zinc-800 my-6" />
        );
      } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const content = trimmed.replace(/^(\*|-)\s+/, '');
        const boldMatch = content.match(/^\*\*(.*?)\*\*:(.*)/);
        if (boldMatch) {
          currentList.push(
            <li key={index} className="text-zinc-300">
              <strong className="text-white font-medium">{boldMatch[1]}</strong>:{boldMatch[2]}
            </li>
          );
        } else {
          currentList.push(
            <li key={index} className="text-zinc-300">{content}</li>
          );
        }
      } else if (/^\d+\.\s+/.test(trimmed)) {
        flushList();
        const content = trimmed.replace(/^\d+\.\s+/, '');
        renderedElements.push(
          <div key={index} className="flex gap-3 items-start my-2">
            <span className="flex items-center justify-center w-6 h-6 rounded bg-zinc-800 text-accent-cyan text-xs font-bold shrink-0 mt-0.5">
              {trimmed.match(/^\d+/)?.[0]}
            </span>
            <p className="text-zinc-300 text-sm leading-relaxed">{content}</p>
          </div>
        );
      } else if (trimmed === '') {
        flushList();
      } else {
        flushList();
        renderedElements.push(
          <p key={index} className="text-zinc-400 text-sm leading-relaxed mb-3">
            {trimmed}
          </p>
        );
      }
    });

    flushList();
    return <div className="space-y-1">{renderedElements}</div>;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* Input panel */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="glassmorphism p-6 rounded-2xl border border-border flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 text-accent-cyan">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white">Mock AI Researcher</h3>
          </div>
          <p className="text-zinc-400 text-sm">
            Generates high-quality markdown sources dynamically optimized for slide templates and NotebookLM source uploads.
          </p>

          <form onSubmit={handleGenerate} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="topic-input" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Research Topic
              </label>
              <input
                id="topic-input"
                type="text"
                placeholder="e.g. Next.js 15 Rendering Patterns"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-black/40 border border-zinc-850 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent-cyan transition-colors"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="glow-button w-full mt-2 py-3 px-4 bg-gradient-to-r from-accent-cyan to-accent-violet text-white font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Source...
                </>
              ) : (
                <>
                  Generate Research
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/20 text-red-400 text-xs mt-2">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>
      </div>

      {/* Output panel */}
      <div className="lg:col-span-3 flex flex-col">
        <div className="glassmorphism rounded-2xl border border-border flex flex-col h-[600px] overflow-hidden">
          {/* Output Header */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-zinc-900/40 shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent-cyan" />
              <span className="text-sm font-semibold text-white">Generated Report Preview</span>
            </div>
            
            {markdown && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 hover:text-white transition-colors"
                  title="Copy Markdown"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleDownload}
                  className="p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 hover:text-white transition-colors"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Output Content */}
          <div className="p-6 overflow-y-auto flex-1 bg-black/20">
            {markdown ? (
              <div className="prose prose-invert max-w-none">
                {renderMarkdown(markdown)}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-12 h-12 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-600 mb-3">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="text-zinc-400 font-medium text-sm">No source generated yet</h4>
                <p className="text-zinc-500 text-xs max-w-xs mt-1">
                  Enter a topic and trigger the research generator to review structured markdown reports.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

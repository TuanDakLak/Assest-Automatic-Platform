'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Layers, 
  Palette, 
  Plus, 
  Sparkles, 
  RefreshCw, 
  Search, 
  Trash2, 
  AlertCircle, 
  Sliders, 
  Volume2, 
  Activity, 
  Check 
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description?: string;
  keywords?: string[];
}

interface Style {
  id: string;
  name: string;
  description?: string;
}

interface MarketTopic {
  id: string;
  title: string;
  categoryId: string;
  category: Category;
  styleId: string;
  style: Style;
  trendScore: number;
  marketScore: number;
  searchVolume: number;
  competitionScore: number;
  score: number;
  status: string;
  createdAt: string;
}

export default function MarketPanel() {
  // Data lists
  const [categories, setCategories] = useState<Category[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [topics, setTopics] = useState<MarketTopic[]>([]);

  // Selection states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStyle, setFilterStyle] = useState('');

  // Form states - Category
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catKeywords, setCatKeywords] = useState('');
  const [addingCat, setAddingCat] = useState(false);

  // Form states - Style
  const [styleName, setStyleName] = useState('');
  const [styleDesc, setStyleDesc] = useState('');
  const [addingStyle, setAddingStyle] = useState(false);

  // Form states - Topic (Manual creation)
  const [topicTitle, setTopicTitle] = useState('');
  const [topicCat, setTopicCat] = useState('');
  const [topicStyle, setTopicStyle] = useState('');
  const [trendScore, setTrendScore] = useState(80);
  const [marketScore, setMarketScore] = useState(75);
  const [searchVolume, setSearchVolume] = useState(5000);
  const [competitionScore, setCompetitionScore] = useState(30);
  const [addingTopic, setAddingTopic] = useState(false);

  // GDELT Probe states
  const [probeKeywordInput, setProbeKeywordInput] = useState('');
  const [probeForceRefresh, setProbeForceRefresh] = useState(false);
  const [probing, setProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<any>(null);

  // App UI states
  const [loading, setLoading] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [recalculatingId, setRecalculatingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_BASE = '/api/v1/market';

  // Load initial data
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [catsRes, stylesRes, topicsRes] = await Promise.all([
        fetch(`${API_BASE}/categories`),
        fetch(`${API_BASE}/styles`),
        fetch(`${API_BASE}/topics`)
      ]);

      if (!catsRes.ok || !stylesRes.ok || !topicsRes.ok) {
        throw new Error('Failed to fetch data from backend. Ensure NestJS API is running.');
      }

      const catsData = await catsRes.json();
      const stylesData = await stylesRes.json();
      const topicsData = await topicsRes.json();

      setCategories(catsData);
      setStyles(stylesData);
      setTopics(topicsData);
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Topics
  const filteredTopics = topics.filter(t => {
    const matchCat = filterCategory ? t.categoryId === filterCategory : true;
    const matchStyle = filterStyle ? t.styleId === filterStyle : true;
    return matchCat && matchStyle;
  });

  // Action - Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    setAddingCat(true);
    setError('');
    setSuccess('');
    try {
      const keywords = catKeywords
        .split(',')
        .map(k => k.trim())
        .filter(Boolean);

      const res = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: catName.trim(),
          description: catDesc.trim() || undefined,
          keywords: keywords.length > 0 ? keywords : undefined
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create category.');
      }

      setCatName('');
      setCatDesc('');
      setCatKeywords('');
      setSuccess('Category created successfully!');
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddingCat(false);
    }
  };

  // Action - Create Style
  const handleCreateStyle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!styleName.trim()) return;

    setAddingStyle(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE}/styles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: styleName.trim(), description: styleDesc.trim() || undefined })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create style.');
      }

      setStyleName('');
      setStyleDesc('');
      setSuccess('Style created successfully!');
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddingStyle(false);
    }
  };

  // Action - Create Topic Manually
  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicTitle.trim() || !topicCat || !topicStyle) {
      setError('Title, Category, and Style are required to create a topic.');
      return;
    }

    setAddingTopic(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE}/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: topicTitle.trim(),
          categoryId: topicCat,
          styleId: topicStyle,
          trendScore: Number(trendScore),
          marketScore: Number(marketScore),
          searchVolume: Number(searchVolume),
          competitionScore: Number(competitionScore)
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create topic.');
      }

      setTopicTitle('');
      setSuccess('Market topic created and scored successfully!');
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddingTopic(false);
    }
  };

  // Action - Trigger automated discovery
  const handleDiscover = async () => {
    if (categories.length === 0 || styles.length === 0) {
      setError('Please add at least one Category and one Style to run the AI Discovery Engine.');
      return;
    }

    setDiscovering(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE}/discover`, { method: 'POST' });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to trigger discovery engine.');
      }

      const result = await res.json();
      const created = result.count ?? 0;
      const evaluated = result.evaluated ?? 0;
      const skipped = result.skipped?.length ?? 0;

      if (created === 0) {
        setError(
          `Discovery evaluated ${evaluated} keyword(s) but created no topics. ` +
          (skipped > 0
            ? `Reason: ${result.skipped[0].reason}`
            : 'Add seed keywords to a category first.')
        );
      } else {
        setSuccess(
          `GDELT discovery complete! Scored ${evaluated} keyword(s) and created ${created} topic(s)` +
          (skipped > 0 ? `, skipped ${skipped}.` : '.')
        );
      }
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDiscovering(false);
    }
  };

  // Action - Recalculate score
  const handleRecalculate = async (id: string) => {
    setRecalculatingId(id);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE}/topics/${id}/recalculate`, { method: 'POST' });

      if (!res.ok) {
        throw new Error('Failed to recalculate topic score.');
      }

      const updated = await res.json();
      setSuccess(`Topic "${updated.title}" score recalculated: ${updated.score.toFixed(1)}`);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRecalculatingId(null);
    }
  };

  // Action - Probe GDELT Keyword
  const handleProbeKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!probeKeywordInput.trim()) return;

    setProbing(true);
    setProbeResult(null);
    setError('');
    try {
      const res = await fetch(
        `${API_BASE}/gdelt/probe?keyword=${encodeURIComponent(probeKeywordInput.trim())}&forceRefresh=${probeForceRefresh}`
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to probe keyword.');
      }
      const data = await res.json();
      setProbeResult(data);
    } catch (err: any) {
      setError(err.message || 'Error probing GDELT keyword.');
    } finally {
      setProbing(false);
    }
  };

  // Helper for score colors
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-400 bg-emerald-950/40 border-emerald-500/20';
    if (score >= 45) return 'text-amber-400 bg-amber-950/40 border-amber-500/20';
    return 'text-rose-400 bg-rose-950/40 border-rose-500/20';
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Alert Banner for Errors/Success */}
      {(error || success) && (
        <div className="flex flex-col gap-2 shrink-0">
          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
              <Check className="w-5 h-5 shrink-0" />
              <span>{success}</span>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Management (Left) vs Topics List (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Column: Categories and Styles CRUD Forms */}
        <div className="xl:col-span-4 flex flex-col gap-8">
          
          {/* Category CRUD Card */}
          <div className="glassmorphism p-6 rounded-2xl border border-border flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-accent-cyan" />
                <h3 className="text-lg font-bold text-white">Categories</h3>
              </div>
              <span className="text-xs text-zinc-400 font-mono bg-zinc-900 px-2 py-0.5 rounded">
                {categories.length} active
              </span>
            </div>

            {/* List */}
            <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1">
              {categories.length === 0 ? (
                <p className="text-xs text-zinc-500 italic py-2">No categories defined yet.</p>
              ) : (
                categories.map(c => (
                  <div key={c.id} className="p-3 rounded-xl bg-black/30 border border-zinc-850 flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-white">{c.name}</span>
                    {c.description && <span className="text-xs text-zinc-400">{c.description}</span>}
                    {c.keywords && c.keywords.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {c.keywords.map(k => (
                          <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
                            {k}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-amber-500/80 mt-1">No seed keywords — skipped by discovery</span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleCreateCategory} className="border-t border-zinc-800/80 pt-4 flex flex-col gap-3">
              <input
                type="text"
                placeholder="Category name (e.g. Dashboard, E-Commerce)"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="w-full bg-black/40 border border-zinc-850 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-accent-cyan transition-colors"
                disabled={addingCat}
              />
              <input
                type="text"
                placeholder="Brief description (optional)"
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                className="w-full bg-black/40 border border-zinc-850 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-accent-cyan transition-colors"
                disabled={addingCat}
              />
              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  placeholder="GDELT keywords, comma separated"
                  value={catKeywords}
                  onChange={(e) => setCatKeywords(e.target.value)}
                  className="w-full bg-black/40 border border-zinc-850 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-accent-cyan transition-colors"
                  disabled={addingCat}
                />
                <span className="text-[10px] text-zinc-500 leading-relaxed">
                  Use real news subjects (&quot;sustainable packaging&quot;, &quot;electric vehicles&quot;).
                  Design jargon like &quot;glassmorphism&quot; has no news coverage and will be skipped.
                </span>
              </div>
              <button
                type="submit"
                disabled={addingCat || !catName.trim()}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-750 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Category
              </button>
            </form>
          </div>

          {/* Style CRUD Card */}
          <div className="glassmorphism p-6 rounded-2xl border border-border flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-accent-violet" />
                <h3 className="text-lg font-bold text-white">Design Styles</h3>
              </div>
              <span className="text-xs text-zinc-400 font-mono bg-zinc-900 px-2 py-0.5 rounded">
                {styles.length} active
              </span>
            </div>

            {/* List */}
            <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1">
              {styles.length === 0 ? (
                <p className="text-xs text-zinc-500 italic py-2">No design styles defined yet.</p>
              ) : (
                styles.map(s => (
                  <div key={s.id} className="p-3 rounded-xl bg-black/30 border border-zinc-850 flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-white">{s.name}</span>
                    {s.description && <span className="text-xs text-zinc-400">{s.description}</span>}
                  </div>
                ))
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleCreateStyle} className="border-t border-zinc-800/80 pt-4 flex flex-col gap-3">
              <input
                type="text"
                placeholder="Style name (e.g. Glassmorphism, Minimalist)"
                value={styleName}
                onChange={(e) => setStyleName(e.target.value)}
                className="w-full bg-black/40 border border-zinc-850 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-accent-violet transition-colors"
                disabled={addingStyle}
              />
              <input
                type="text"
                placeholder="Brief description (optional)"
                value={styleDesc}
                onChange={(e) => setStyleDesc(e.target.value)}
                className="w-full bg-black/40 border border-zinc-850 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-accent-violet transition-colors"
                disabled={addingStyle}
              />
              <button
                type="submit"
                disabled={addingStyle || !styleName.trim()}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-750 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Style
              </button>
            </form>
          </div>

          {/* GDELT Keyword Probe / Tester Card */}
          <div className="glassmorphism p-6 rounded-2xl border border-border flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-accent-cyan" />
              <h3 className="text-lg font-bold text-white">GDELT Keyword Probe</h3>
            </div>
            <p className="text-xs text-zinc-400">
              Test a keyword to see if GDELT or NewsAPI has active news signals before seeding it.
            </p>

            <form onSubmit={handleProbeKeyword} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Keyword (e.g. circular economy)"
                value={probeKeywordInput}
                onChange={(e) => setProbeKeywordInput(e.target.value)}
                className="w-full bg-black/40 border border-zinc-850 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-accent-cyan transition-colors"
                disabled={probing}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="probeForceRefresh"
                  checked={probeForceRefresh}
                  onChange={(e) => setProbeForceRefresh(e.target.checked)}
                  className="rounded border-zinc-800 bg-black/40 text-accent-cyan focus:ring-accent-cyan"
                  disabled={probing}
                />
                <label htmlFor="probeForceRefresh" className="text-xs text-zinc-400 select-none cursor-pointer">
                  Force Refresh (bypass cache)
                </label>
              </div>
              <button
                type="submit"
                disabled={probing || !probeKeywordInput.trim()}
                className="w-full py-2 bg-gradient-to-r from-accent-cyan to-accent-violet hover:opacity-90 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all"
              >
                {probing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Probing GDELT...
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    Probe Keyword
                  </>
                )}
              </button>
            </form>

            {/* Probe Results Display */}
            {probeResult && (
              <div className="mt-2 p-4 rounded-xl bg-black/40 border border-zinc-850 flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white truncate max-w-[150px]">&quot;{probeResult.keyword}&quot;</span>
                  {probeResult.usable ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                      Usable
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-400 border border-amber-500/30">
                      Not Usable
                    </span>
                  )}
                </div>

                {probeResult.usable ? (
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
                    <div className="flex flex-col p-2 bg-zinc-900/50 rounded-lg border border-zinc-800/40">
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">Volume</span>
                      <strong className="text-zinc-200 mt-0.5">{probeResult.searchVolume}</strong>
                    </div>
                    <div className="flex flex-col p-2 bg-zinc-900/50 rounded-lg border border-zinc-800/40">
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">Trend</span>
                      <strong className="text-zinc-200 mt-0.5">{probeResult.trendScore}%</strong>
                    </div>
                    <div className="flex flex-col p-2 bg-zinc-900/50 rounded-lg border border-zinc-800/40">
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">Market</span>
                      <strong className="text-zinc-200 mt-0.5">{probeResult.marketScore}%</strong>
                    </div>
                    <div className="flex flex-col p-2 bg-zinc-900/50 rounded-lg border border-zinc-800/40">
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">Competition</span>
                      <strong className="text-zinc-200 mt-0.5">{probeResult.competitionScore}%</strong>
                    </div>
                  </div>
                ) : (
                  <p className="text-zinc-400 leading-relaxed text-[11px]">
                    {probeResult.message || 'No news coverage or active rate limiting.'}
                  </p>
                )}
              </div>
            )}
        </div>
      </div>

      {/* Right Column: AI Discovery, Manual Creation, Topics Matrix */}
        <div className="xl:col-span-8 flex flex-col gap-6">

          {/* Controls Bar */}
          <div className="glassmorphism p-6 rounded-2xl border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent-cyan" />
                Commercial Concept Discovery
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Scan combinations of active categories and styles to identify high-converting commercial potentials.
              </p>
            </div>
            
            <button
              onClick={handleDiscover}
              disabled={discovering || loading}
              className="glow-button px-5 py-3 bg-gradient-to-r from-accent-cyan to-accent-violet text-white text-sm font-bold rounded-xl flex items-center gap-2 shrink-0 disabled:opacity-50 hover:opacity-95 transition-all"
            >
              {discovering ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running Discovery...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Discover New Topics
                </>
              )}
            </button>
          </div>

          {/* Manual Topic scoring form */}
          <div className="glassmorphism p-6 rounded-2xl border border-border flex flex-col gap-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-accent-cyan" />
              Manual Topic Creation & Scoring
            </h4>
            
            <form onSubmit={handleCreateTopic} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Topic Title (e.g. NFT Wallet Mobile Concept)"
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  className="w-full bg-black/40 border border-zinc-850 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-accent-cyan transition-colors"
                  disabled={addingTopic}
                />
                <select
                  value={topicCat}
                  onChange={(e) => setTopicCat(e.target.value)}
                  className="w-full bg-black/40 border border-zinc-850 rounded-xl px-4 py-2.5 text-zinc-400 text-xs outline-none focus:border-accent-cyan transition-colors"
                  disabled={addingTopic}
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select
                  value={topicStyle}
                  onChange={(e) => setTopicStyle(e.target.value)}
                  className="w-full bg-black/40 border border-zinc-850 rounded-xl px-4 py-2.5 text-zinc-400 text-xs outline-none focus:border-accent-cyan transition-colors"
                  disabled={addingTopic}
                >
                  <option value="">Select Style</option>
                  {styles.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-3 bg-black/20 p-3 rounded-xl border border-zinc-850">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-400 uppercase font-bold">Trend (0-100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={trendScore}
                      onChange={(e) => setTrendScore(Number(e.target.value))}
                      className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-white text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-400 uppercase font-bold">Market Demand (0-100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={marketScore}
                      onChange={(e) => setMarketScore(Number(e.target.value))}
                      className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-white text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-400 uppercase font-bold">Search Volume</label>
                    <input
                      type="number"
                      min="0"
                      value={searchVolume}
                      onChange={(e) => setSearchVolume(Number(e.target.value))}
                      className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-white text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-400 uppercase font-bold">Competition (0-100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={competitionScore}
                      onChange={(e) => setCompetitionScore(Number(e.target.value))}
                      className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-white text-xs"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={addingTopic || !topicTitle.trim() || !topicCat || !topicStyle}
                  className="w-full mt-2 py-2 bg-accent hover:bg-accent/90 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Scored Topic
                </button>
              </div>
            </form>
          </div>

          {/* Topics Grid Matrix */}
          <div className="glassmorphism rounded-2xl border border-border flex flex-col overflow-hidden">
            {/* Table Header Filter */}
            <div className="px-6 py-4 border-b border-border bg-zinc-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent-cyan" />
                <span className="text-sm font-semibold text-white">Discovered Commercial Potential Topics</span>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-zinc-800/80 border border-zinc-700/60 rounded-lg px-2.5 py-1 text-zinc-300 text-xs outline-none"
                >
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select
                  value={filterStyle}
                  onChange={(e) => setFilterStyle(e.target.value)}
                  className="bg-zinc-800/80 border border-zinc-700/60 rounded-lg px-2.5 py-1 text-zinc-300 text-xs outline-none"
                >
                  <option value="">All Styles</option>
                  {styles.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            {/* List Table */}
            <div className="overflow-y-auto max-h-[500px]">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin" />
                </div>
              ) : filteredTopics.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center justify-center p-8">
                  <Volume2 className="w-10 h-10 text-zinc-650 mb-3" />
                  <h4 className="text-zinc-400 font-medium text-sm">No design topics found</h4>
                  <p className="text-zinc-500 text-xs mt-1 max-w-sm">
                    Generate topics automatically using the Discovery Engine or create them manually using the scoring dashboard above.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-850/60">
                  {filteredTopics.map((topic) => (
                    <div key={topic.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-900/10 transition-colors">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white">{topic.title}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/40">
                            {topic.category?.name || 'Category'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/40">
                            {topic.style?.name || 'Style'}
                          </span>
                        </div>
                        
                        {/* Detail Scores */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 mt-1 text-[11px] text-zinc-400">
                          <span className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                            Trend: <strong className="text-zinc-300">{topic.trendScore.toFixed(0)}%</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                            Demand: <strong className="text-zinc-300">{topic.marketScore.toFixed(0)}%</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                            Volume: <strong className="text-zinc-300">{topic.searchVolume}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                            Competition: <strong className="text-zinc-300">{topic.competitionScore.toFixed(0)}%</strong>
                          </span>
                        </div>
                      </div>

                      {/* Recalculate and Score representation */}
                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => handleRecalculate(topic.id)}
                          disabled={recalculatingId !== null}
                          className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-750 text-zinc-300 hover:text-white transition-colors"
                          title="Recalculate Weighted Score"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${recalculatingId === topic.id ? 'animate-spin text-accent-cyan' : ''}`} />
                        </button>
                        
                        <div className={`px-3.5 py-1.5 rounded-xl border text-sm font-bold flex flex-col items-center justify-center shrink-0 min-w-[70px] ${getScoreColor(topic.score)}`}>
                          <span className="text-[9px] uppercase tracking-wider font-semibold opacity-80">Score</span>
                          <span className="text-base leading-none mt-0.5">{topic.score.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

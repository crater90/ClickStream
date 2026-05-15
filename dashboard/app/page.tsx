'use client';

import { useEffect, useState, useCallback } from 'react';
import { Activity, Eye, Layers, MousePointer2, RefreshCw, X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, type Session, type PageStat } from '@/lib/api';
import { DashboardHeader } from '@/components/DashboardHeader';
import { StatCard } from '@/components/StatCard';
import { SessionsPanel } from '@/components/SessionsPanel';
import { HeatmapView } from '@/components/HeatmapView';

type Tab = 'sessions' | 'heatmap';

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>('sessions');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [pages, setPages] = useState<PageStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [sessRes, pagesRes] = await Promise.all([
        api.getSessions(),
        api.getPages(),
      ]);
      setSessions(sessRes.sessions);
      setPages(pagesRes.pages);
    } catch {
      setError('Failed to connect to backend. Is the API running on port 3001?');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(() => loadData(true), 30_000);
    return () => clearInterval(t);
  }, [loadData]);

  const totalEvents = sessions.reduce((sum, s) => sum + s.total_events, 0);
  const totalClicks = sessions.reduce((sum, s) => sum + s.clicks, 0);
  const totalViews = sessions.reduce((sum, s) => sum + s.page_views, 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader refreshing={refreshing} onRefresh={() => loadData(true)} />

      <main className="flex-1 p-6 space-y-6 max-w-[1400px] mx-auto w-full">

        {/* Error banner */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 px-4 py-3 text-sm flex items-center gap-2">
            <X size={14} />
            {error}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Layers} label="Sessions" value={sessions.length} accent />
          <StatCard icon={Zap} label="Total Events" value={totalEvents.toLocaleString()} />
          <StatCard icon={Eye} label="Page Views" value={totalViews.toLocaleString()} />
          <StatCard icon={MousePointer2} label="Clicks" value={totalClicks.toLocaleString()} />
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-secondary rounded-xl border border-border w-fit">
          {(['sessions', 'heatmap'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize',
                tab === t
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t === 'sessions' ? '🗂 Sessions' : '🔥 Heatmap'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {loading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <RefreshCw size={20} className="animate-spin mr-3" />
            Loading data…
          </div>
        ) : tab === 'sessions' ? (
          <SessionsPanel sessions={sessions} />
        ) : (
          <HeatmapView pages={pages} />
        )}

      </main>
    </div>
  );
}
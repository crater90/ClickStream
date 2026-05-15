'use client';

import { useEffect, useState } from 'react';
import { Globe, MousePointer2, RefreshCw } from 'lucide-react';
import { api, type ClickPoint, type PageStat } from '@/lib/api';
import { truncateUrl } from '@/lib/utils';

const CANVAS_W = 800;
const CANVAS_H = 500;

interface HeatmapViewProps {
  pages: PageStat[];
}

export function HeatmapView({ pages }: HeatmapViewProps) {
  const [selectedPage, setSelectedPage] = useState('');
  const [clicks, setClicks] = useState<ClickPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedPage) return;
    setLoading(true);
    setError('');
    api.getHeatmap(selectedPage)
      .then(d => setClicks(d.clicks))
      .catch(() => setError('Failed to load heatmap data'))
      .finally(() => setLoading(false));
  }, [selectedPage]);

  // Normalize click positions to canvas dimensions so clicks from different
  // viewport sizes all land in the same proportional position.
  const normalizedClicks = clicks.map(c => ({
    x: c.viewport_width ? (c.click_x / c.viewport_width) * CANVAS_W : c.click_x,
    y: c.viewport_height ? (c.click_y / c.viewport_height) * CANVAS_H : c.click_y,
  }));

  return (
    <div className="space-y-5">
      {/* Page selector */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Globe
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <select
            value={selectedPage}
            onChange={e => setSelectedPage(e.target.value)}
            className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm appearance-none cursor-pointer focus:outline-none focus:border-primary transition-colors"
          >
            <option value="">Select a page to view heatmap…</option>
            {pages.map(p => (
              <option key={p.page_url} value={p.page_url}>
                {truncateUrl(p.page_url, 70)} ({p.total_clicks} clicks)
              </option>
            ))}
          </select>
        </div>

        {selectedPage && (
          <div className="text-xs text-muted-foreground bg-secondary border border-border px-3 py-2 rounded-lg whitespace-nowrap">
            {clicks.length} clicks
          </div>
        )}
      </div>

      {/* Canvas area */}
      <div
        className="relative rounded-xl border border-border bg-card overflow-hidden"
        style={{ minHeight: 400 }}
      >
        {/* Empty state */}
        {!selectedPage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <MousePointer2 size={40} className="opacity-20" />
            <p className="text-sm">Select a page to see the click heatmap</p>
          </div>
        )}

        {/* Loading */}
        {selectedPage && loading && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <RefreshCw size={20} className="animate-spin mr-2" />
            <span className="text-sm">Loading heatmap…</span>
          </div>
        )}

        {/* Error */}
        {selectedPage && !loading && error && (
          <div className="absolute inset-0 flex items-center justify-center text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Heatmap canvas */}
        {selectedPage && !loading && !error && (
          <div className="relative w-full" style={{ height: CANVAS_H }}>
            {/* Background grid */}
            <svg width="100%" height={CANVAS_H} className="absolute inset-0 opacity-5">
              {Array.from({ length: 20 }).map((_, i) => (
                <line
                  key={`v${i}`}
                  x1={`${i * 5}%`} y1="0"
                  x2={`${i * 5}%`} y2="100%"
                  stroke="hsl(var(--foreground))"
                  strokeWidth="1"
                />
              ))}
              {Array.from({ length: 13 }).map((_, i) => (
                <line
                  key={`h${i}`}
                  x1="0" y1={`${i * 8.33}%`}
                  x2="100%" y2={`${i * 8.33}%`}
                  stroke="hsl(var(--foreground))"
                  strokeWidth="1"
                />
              ))}
            </svg>

            {/* Dimension label */}
            <div className="absolute top-3 left-3 text-xs text-muted-foreground/50 font-mono">
              {CANVAS_W}×{CANVAS_H} (normalized)
            </div>

            {/* Click dots */}
            <svg
              width="100%"
              height={CANVAS_H}
              viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
              className="absolute inset-0"
            >
              <defs>
                <radialGradient id="dot-glow">
                  <stop offset="0%"   stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                  <stop offset="60%"  stopColor="hsl(var(--primary))" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </radialGradient>
              </defs>

              {normalizedClicks.map((pt, i) => (
                <g key={i}>
                  <circle cx={pt.x} cy={pt.y} r="18" fill="url(#dot-glow)" />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="hsl(var(--primary))"
                    fillOpacity="0.9"
                    stroke="hsl(var(--primary-foreground))"
                    strokeWidth="1"
                    strokeOpacity="0.4"
                  />
                </g>
              ))}
            </svg>

            {/* No clicks state */}
            {clicks.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <MousePointer2 size={32} className="opacity-20" />
                <p className="text-sm">No clicks recorded for this page</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      {selectedPage && clicks.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-primary/80" />
            <span>Click position</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-primary/20" />
            <span>Click density halo</span>
          </div>
          <span className="ml-auto">{clicks.length} total clicks on this page</span>
        </div>
      )}
    </div>
  );
}

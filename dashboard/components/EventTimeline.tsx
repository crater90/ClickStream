'use client';

import { useEffect, useState } from 'react';
import { Eye, MousePointer2, RefreshCw, X } from 'lucide-react';
import { api, type Event } from '@/lib/api';
import { cn, formatDateTime, truncateUrl } from '@/lib/utils';

interface EventTimelineProps {
  sessionId: string;
  onClose: () => void;
}

export function EventTimeline({ sessionId, onClose }: EventTimelineProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api.getSessionEvents(sessionId)
      .then(d => setEvents(d.events))
      .catch(() => setError('Failed to load events'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  return (
    /*
      `flex flex-col` + `min-h-0` is the key fix.
      The parent panel has an explicit height (70vh). This component must fill
      it with `flex flex-col`. Without `min-h-0`, a flex child won't shrink
      below its content size, so overflow-y-auto on the scroll div never
      activates — all content just spills out. min-h-0 removes that constraint.
    */
    <div className="flex flex-col min-h-0 h-full">

      {/* Fixed header — never scrolls away */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Session Journey</p>
          <code className="text-sm font-mono text-primary">{sessionId.slice(0, 16)}…</code>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground bg-secondary border border-border px-2 py-0.5 rounded">
            {loading ? '…' : events.length} events
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Scrollable body — flex-1 + min-h-0 makes this fill remaining space and scroll */}
      <div className="flex-1 min-h-0 overflow-y-auto timeline-scroll p-4 space-y-2">

        {loading && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            <RefreshCw size={14} className="animate-spin mr-2" />
            Loading events…
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm text-center py-8">{error}</p>
        )}

        {!loading && !error && events.map((event, i) => (
          <div key={event._id} className="relative">
            {/* Vertical connector line between events */}
            {i < events.length - 1 && (
              <div className="absolute left-[19px] top-9 bottom-0 w-px bg-border z-0" />
            )}

            <div className="flex gap-3 relative z-10">
              {/* Event type icon */}
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border',
                event.event_type === 'page_view'
                  ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                  : 'bg-green-500/15 border-green-500/30 text-green-400'
              )}>
                {event.event_type === 'page_view'
                  ? <Eye size={14} />
                  : <MousePointer2 size={14} />}
              </div>

              {/* Event card */}
              <div className="flex-1 bg-card border border-border rounded-lg p-2.5 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={cn(
                    'text-xs font-semibold uppercase tracking-wide',
                    event.event_type === 'page_view' ? 'text-blue-400' : 'text-green-400'
                  )}>
                    {event.event_type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatDateTime(event.timestamp)}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground truncate" title={event.page_url}>
                  {truncateUrl(event.page_url)}
                </p>

                {event.event_type === 'click' && event.click_x !== undefined && event.click_y !== undefined && (
                  <p className="text-xs text-muted-foreground/70 mt-0.5 font-mono">
                    x:{Math.round(event.click_x)} y:{Math.round(event.click_y)}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        {!loading && !error && events.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-8">No events found</p>
        )}
      </div>
    </div>
  );
}
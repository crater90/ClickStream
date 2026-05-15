'use client';

import { useState } from 'react';
import { Activity, ChevronRight } from 'lucide-react';
import { type Session } from '@/lib/api';
import { SessionRow } from './SessionRow';
import { EventTimeline } from './EventTimeline';

interface SessionsPanelProps {
  sessions: Session[];
}

export function SessionsPanel({ sessions }: SessionsPanelProps) {
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  function handleSelect(sessionId: string) {
    setSelectedSession(prev => (prev === sessionId ? null : sessionId));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 items-start">

      {/* Sessions list — scrolls naturally with the page */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {sessions.length} Sessions
          </h2>
          <span className="text-xs text-muted-foreground">Click to view journey →</span>
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
            <Activity size={32} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">No sessions recorded yet</p>
            <p className="text-xs mt-1">
              Add the tracker script to your webpage to start collecting data
            </p>
          </div>
        ) : (
          sessions.map(s => (
            <SessionRow
              key={s.session_id}
              session={s}
              onClick={() => handleSelect(s.session_id)}
              isActive={selectedSession === s.session_id}
            />
          ))
        )}
      </div>

      {/*
        Sticky timeline panel.
        - `sticky + top` keeps it in view while scrolling the sessions list.
        - Explicit `h-[70vh]` gives the panel a real height so the flex child
          (EventTimeline) has something to fill — without this, `flex-1` inside
          EventTimeline expands forever and overflow-y-auto never kicks in.
        - `flex flex-col` so EventTimeline's header + scroll body fill it correctly.
      */}
      <div
        className="sticky rounded-xl border border-border bg-card overflow-hidden flex flex-col"
        style={{ top: 88, height: '70vh' }}
      >
        {selectedSession ? (
          <EventTimeline
            sessionId={selectedSession}
            onClose={() => setSelectedSession(null)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 p-6">
            <ChevronRight size={32} className="opacity-20" />
            <p className="text-sm text-center">Select a session to view the user journey</p>
          </div>
        )}
      </div>

    </div>
  );
}
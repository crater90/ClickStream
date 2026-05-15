import { Eye, MousePointer2, Clock, Zap } from 'lucide-react';
import { type Session } from '@/lib/api';
import { cn, formatDuration, formatRelativeTime } from '@/lib/utils';

interface SessionRowProps {
  session: Session;
  onClick: () => void;
  isActive: boolean;
}

export function SessionRow({ session, onClick, isActive }: SessionRowProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-lg border p-3.5 transition-all group',
        'hover:border-primary/50 hover:bg-primary/5',
        isActive
          ? 'border-primary/60 bg-primary/8 shadow-md shadow-primary/10'
          : 'border-border bg-card'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
          {session.session_id.slice(0, 12)}…
        </code>
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(session.last_seen)}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Zap size={11} className="text-yellow-500" />
          {session.total_events} events
        </span>
        <span className="flex items-center gap-1">
          <Eye size={11} className="text-blue-400" />
          {session.page_views} views
        </span>
        <span className="flex items-center gap-1">
          <MousePointer2 size={11} className="text-green-400" />
          {session.clicks} clicks
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <Clock size={11} />
          {formatDuration(session.duration_seconds)}
        </span>
      </div>
    </button>
  );
}

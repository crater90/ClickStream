import { Activity, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  refreshing: boolean;
  onRefresh: () => void;
}

export function DashboardHeader({ refreshing, onRefresh }: DashboardHeaderProps) {
  return (
    <header className="border-b border-border px-6 py-4 flex items-center justify-between glass sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
          <Activity size={16} className="text-primary" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight">EventTracker</h1>
          <p className="text-xs text-muted-foreground">Analytics Dashboard</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary border border-border px-3 py-1.5 rounded-lg">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Live
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg border border-border hover:bg-secondary transition-colors disabled:opacity-50"
          title="Refresh data"
        >
          <RefreshCw size={14} className={cn(refreshing && 'animate-spin')} />
        </button>
      </div>
    </header>
  );
}

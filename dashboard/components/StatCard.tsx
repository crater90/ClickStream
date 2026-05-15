import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export function StatCard({ icon: Icon, label, value, sub, accent = false }: StatCardProps) {
  return (
    <div className={cn(
      'rounded-xl border border-border p-4 flex items-start gap-3 transition-all',
      'bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5'
    )}>
      <div className={cn(
        'p-2 rounded-lg',
        accent ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
      )}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p className="text-2xl font-bold leading-none">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );
}

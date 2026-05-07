import { RefreshCw } from 'lucide-react';
import clsx from 'clsx';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  loading?: boolean;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, onRefresh, loading, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
        {subtitle && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {action}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
              'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
              'text-slate-700 dark:text-slate-300',
              'hover:bg-slate-50 dark:hover:bg-slate-700',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
            Refresh
          </button>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Bell, Filter } from 'lucide-react';
import { dataApi, devicesApi } from '../services/api';
import { PageLoader, EmptyState } from '../components/ui/Spinner';
import PageHeader from '../components/ui/PageHeader';
import { format } from 'date-fns';
import clsx from 'clsx';

interface Reading {
  deviceId: string;
  rawDeviceId: string;
  device?: { name: string; location: string };
  temperature: number | null;
  humidity: number | null;
  airQuality: number | null;
  flame: boolean | null;
  createdAt: string;
}

// Convert Celsius to Fahrenheit
function toF(c: number | null | undefined): number | null {
  if (c == null) return null;
  return parseFloat(((c * 9/5) + 32).toFixed(1));
}

const DURATIONS = [
  { label: '1 min', minutes: 1 },
  { label: '5 min', minutes: 5 },
  { label: '10 min', minutes: 10 },
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '1 hr', minutes: 60 },
  { label: '6 hr', minutes: 360 },
  { label: '12 hr', minutes: 720 },
  { label: '24 hr', minutes: 1440 },
] as const;

type DurationMinutes = typeof DURATIONS[number]['minutes'];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AlertsPage() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');
  const [devices, setDevices] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const hasInitiallyLoaded = useRef(false);
  const pageSize = 15;
  const [durationMin, setDurationMin] = useState<DurationMinutes>(1440);

  const fetchReadings = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const endDate = new Date();
      const startDate = new Date(Date.now() - durationMin * 60 * 1000);

      const pageLimit = 5000;
      const maxPages = 100;
      const collected: Reading[] = [];
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const res = await dataApi.getAll({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          limit: pageLimit,
          page: pageNum,
        });
        const raw: Reading[] = res.data.data || [];
        collected.push(...raw);
        if (raw.length < pageLimit) break;
      }

      setReadings(collected);
    } catch {
      console.error('Failed to load readings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [durationMin]);

  useEffect(() => { fetchReadings(); }, [fetchReadings]);

  // Fetch devices for dropdown
  useEffect(() => {
    devicesApi.getAll().then(r => setDevices(r.data.data)).catch(() => {});
  }, []);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchReadings(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchReadings]);

  const handleRefresh = () => fetchReadings(true);

  // Filter readings with flame detected
  const flameReadings = useMemo(() => {
    let filtered = readings.filter(r => r.flame === true);
    if (deviceId) {
      filtered = filtered.filter(r => r.deviceId === deviceId);
    }
    return filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [readings, deviceId]);

  // Reset page when filter changes
  useEffect(() => { setPage(1); }, [deviceId, durationMin]);

  const paginatedReadings = flameReadings.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(flameReadings.length / pageSize);

  if (loading && !hasInitiallyLoaded.current) return <PageLoader message="Loading flame alerts..." />;
  if (!loading) hasInitiallyLoaded.current = true;

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        title="Flame Alerts"
        subtitle={`${flameReadings.length} flame detection${flameReadings.length !== 1 ? 's' : ''}`}
        onRefresh={handleRefresh}
        loading={refreshing}
      />

      {/* Filter */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-slate-400" />
        <div>
          <label className="label text-xs">Device</label>
          <select
            value={deviceId}
            onChange={e => setDeviceId(e.target.value)}
            className="input w-48 text-xs py-1.5"
          >
            <option value="">All Devices</option>
            {devices.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label text-xs">Window</label>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            {DURATIONS.map(d => (
              <button
                key={d.minutes}
                onClick={() => setDurationMin(d.minutes)}
                className={clsx(
                  'px-2 py-1 rounded-md text-xs font-medium transition-all',
                  durationMin === d.minutes
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      {flameReadings.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No flame alerts"
          description="No flame detections recorded"
        />
      ) : (
        <div className="card p-4 overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700">
                <th className="text-left pb-2 font-medium">Time</th>
                <th className="text-left pb-2 font-medium">Device</th>
                <th className="text-right pb-2 font-medium">Temp (°F)</th>
                <th className="text-right pb-2 font-medium">Hum</th>
                <th className="text-right pb-2 font-medium">AQ</th>
                <th className="text-right pb-2 font-medium">Flame</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {paginatedReadings.map((r, i) => (
                <tr key={i} className="bg-red-50/50 dark:bg-red-500/5">
                  <td className="py-1.5 text-slate-500">{format(new Date(r.createdAt), 'HH:mm:ss')}</td>
                  <td className="py-1.5 text-slate-700 dark:text-slate-300">
                    {r.device?.name || r.deviceId}
                  </td>
                  <td className="py-1.5 text-right text-orange-500 font-medium">
                    {r.temperature != null ? `${Number(r.temperature).toFixed(1)}°` : '—'}
                  </td>
                  <td className="py-1.5 text-right text-blue-500 font-medium">
                    {r.humidity != null ? `${Number(r.humidity).toFixed(0)}%` : '—'}
                  </td>
                  <td className="py-1.5 text-right text-purple-500 font-medium">
                    {r.airQuality != null ? Number(r.airQuality).toFixed(0) : '—'}
                  </td>
                  <td className="py-1.5 text-right">🔥</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination */}
          {flameReadings.length > pageSize && (
            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-700 mt-3">
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2 py-1 text-xs rounded bg-slate-100 dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-2 py-1 text-xs rounded bg-slate-100 dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
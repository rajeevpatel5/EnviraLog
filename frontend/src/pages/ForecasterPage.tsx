import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, Download, Thermometer, Droplets, Wind,
  Clock, CheckCircle, AlertTriangle, RefreshCw
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import TimeSeriesChart from '../components/charts/TimeSeriesChart';
import { PageLoader } from '../components/ui/Spinner';
import clsx from 'clsx';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import toast from 'react-hot-toast';
import { forecastApi } from '../services/api';

// Helper to convert UTC timestamp to local browser time
const toLocalTime = (utcTimestamp: string): Date => {
  return toZonedTime(new Date(utcTimestamp), Intl.DateTimeFormat().resolvedOptions().timeZone);
};
interface ForecastRow {
  step: number;
  predictedTime: string;
  temperature: number;
  humidity: number;
  airQuality: number;
  flame?: boolean;
}

interface ForecastData {
  lastUpdated: string;
  avgGapSeconds: number;
  lastReading: {
    timestamp: string;
    temperature: number;
    humidity: number;
    airQuality: number;
    flame?: boolean;
  };
  mae: {
    temperature: number;
    humidity: number;
    airQuality: number;
  };
  forecast: ForecastRow[];
}

interface ForecastResponse {
  duration: string;
  minutes: number;
  steps: number;
  lastUpdated: string;
  lastReading: ForecastData['lastReading'];
  mae: ForecastData['mae'];
  forecast: ForecastRow[];
}

const WINDOWS = [
  { value: 60, label: 'Next 1 Hour' },
  { value: 360, label: 'Next 6 Hours' },
  { value: 720, label: 'Next 12 Hours' },
  { value: 1440, label: 'Next 24 Hours' },
] as const;

// ── Helper Functions ──────────────────────────────────────────────────────────
function toF(c: number | null | undefined): number | null {
  if (c == null) return null;
  return parseFloat(((c * 9/5) + 32).toFixed(1));
}

function getAQLabel(val: number | null): string {
  if (val === null) return '—';
  if (val <= 300) return 'Good';
  if (val <= 700) return 'Moderate';
  if (val <= 1200) return 'Unhealthy';
  if (val <= 1600) return 'Very Unhealthy';
  return 'Hazardous';
}

function getAQColor(val: number | null): string {
  if (val === null) return 'text-slate-500';
  if (val <= 300) return 'text-emerald-500';
  if (val <= 700) return 'text-yellow-500';
  if (val <= 1200) return 'text-orange-500';
  if (val <= 1600) return 'text-red-500';
  return 'text-purple-500';
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ForecasterPage() {
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [modelStatus, setModelStatus] = useState<{ modelLoaded: boolean; lastUpdated: string | null; rowCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'temperature' | 'humidity' | 'airQuality' | 'flame'>('temperature');
  const [windowMin, setWindowMin] = useState<(typeof WINDOWS)[number]['value']>(60);

  // Fetch model status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await forecastApi.getStatus();
      setModelStatus(res.data.data);
    } catch {
      setModelStatus(null);
    }
  }, []);

  // Fetch forecast
  const fetchForecast = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const res = await forecastApi.getForecast();
      setForecastData(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to fetch forecast');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (modelStatus?.modelLoaded) {
      fetchForecast();
    }
  }, [modelStatus?.modelLoaded, fetchForecast]);

  // Auto-refresh every 1 minute
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStatus();
      if (modelStatus?.modelLoaded) {
        fetchForecast(true);
      }
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [fetchStatus, fetchForecast, modelStatus?.modelLoaded]);

  const handleRefresh = () => {
    fetchStatus();
    fetchForecast(true);
  };

  const handleDownload = useCallback(() => {
    if (!forecastData?.forecast) return;

    const headers = ['Step', 'Predicted Time', 'Temperature (°C)', 'Humidity (%)', 'Air Quality', 'Flame'];
    const rows = visibleForecast.map(r => [
      r.step,
      r.predictedTime,
      r.temperature,
      r.humidity,
      r.airQuality,
      r.flame ? 'true' : 'false',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forecast_${windowMin}min_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Forecast downloaded');
  }, [forecastData, windowMin]);

  const lastReading = forecastData?.lastReading ?? null;
  const forecast = forecastData?.forecast ?? null;

  const visibleForecast = (forecast ?? []).slice(0, windowMin);
  const firstForecast = visibleForecast?.[0] ?? null;

  // Chart data - already pre-aggregated by Python forecaster
  const chartData = visibleForecast.map(r => ({
    createdAt: toLocalTime(r.predictedTime).toISOString(),
    temperature: toF(r.temperature) ?? 0,
    humidity: r.humidity,
    airQuality: r.airQuality,
    flame: r.flame ? 1 : 0,
  })) ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Forecaster"
        subtitle="Environmental sensor prediction using XGBoost ML model"
        onRefresh={handleRefresh}
        loading={refreshing}
      />

      {/* Main Grid: Settings Panel + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Settings Panel (left sidebar style) - sticky on scroll */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-4 space-y-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-500" />
              Forecast Settings
            </h3>

            {/* Window Selector */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Forecast Window
              </label>
              <select
                value={windowMin}
                onChange={(e) => setWindowMin(parseInt(e.target.value, 10) as any)}
                className="input w-full text-xs py-2"
              >
                {WINDOWS.map(w => (
                  <option key={w.value} value={w.value}>{w.label}</option>
                ))}
              </select>
            </div>

            {/* Model Status */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <p className="text-xs font-medium text-slate-500">Model Status</p>
              {modelStatus ? (
                <>
                  <div className="flex items-center gap-2 text-xs">
                    {modelStatus.modelLoaded ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-slate-600 dark:text-slate-400">Model trained & ready</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-slate-600 dark:text-slate-400">Model not ready</span>
                      </>
                    )}
                  </div>
                  {modelStatus.lastUpdated && (
                    <p className="text-xs text-slate-400">
                      Last trained: {format(toLocalTime(modelStatus.lastUpdated), 'MMM d, HH:mm')}
                    </p>
                  )}
                  <p className="text-xs text-slate-400">
                    Training rows: {modelStatus.rowCount.toLocaleString()}
                  </p>
                </>
              ) : (
                <div className="flex items-center gap-2 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-slate-600 dark:text-slate-400">Checking status...</span>
                </div>
              )}
            </div>

            {/* MAE Stats */}
            {forecastData?.mae && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                <p className="text-xs font-medium text-slate-500">Model Accuracy (MAE)</p>
                <div className="text-xs text-slate-400 space-y-1">
                  <p>Temp: {forecastData.mae.temperature.toFixed(2)}°C</p>
                  <p>Humidity: {forecastData.mae.humidity.toFixed(2)}%</p>
                  <p>Air Quality: {forecastData.mae.airQuality.toFixed(1)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-5">
          {/* Loading State */}
          {loading && <PageLoader message="Loading forecast..." />}

          {/* No Model State */}
          {!loading && !modelStatus?.modelLoaded && (
            <div className="card p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Model Not Ready
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                The ML model is being trained. Wait for the scheduler to complete training and generate predictions.
              </p>
            </div>
          )}

          {/* Last Known Readings */}
          {!loading && lastReading && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Last Known Readings
              </h3>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold">Last Timestamp</span>{' '}
                <span className="text-slate-700 dark:text-slate-300">
                  {format(toLocalTime(lastReading.timestamp), 'HH:mm:ss')} · {format(toLocalTime(lastReading.timestamp), 'MMM d')}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  title="Temperature"
                  value={toF(lastReading.temperature)?.toFixed(2) ?? '--'}
                  unit="°F"
                  icon={Thermometer}
                  color="red"
                />
                <StatCard
                  title="Humidity"
                  value={lastReading.humidity.toFixed(2)}
                  unit="%"
                  icon={Droplets}
                  color="blue"
                />
                <StatCard
                  title="Air Quality"
                  value={lastReading.airQuality.toFixed(2)}
                  icon={Wind}
                  color="purple"
                  subtitle={getAQLabel(lastReading.airQuality)}
                />
                <StatCard
                  title="Flame"
                  value={lastReading.flame ? '🔥 Alert' : '✅ Clear'}
                  icon={AlertTriangle}
                  color={lastReading.flame ? 'red' : 'green'}
                  subtitle={lastReading.flame ? 'Flame detected' : 'No flame detected'}
                />
              </div>
            </div>
          )}

          {/* Forecast Results */}
          {!loading && forecast && forecast.length > 0 && (
            <>
              {/* Next Predicted Reading */}
              {firstForecast && lastReading && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Next Predicted Reading
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold">Predicted At</span>{' '}
                    <span className="text-slate-700 dark:text-slate-300">
                      {format(toLocalTime(firstForecast.predictedTime), 'HH:mm:ss')} · {format(toLocalTime(firstForecast.predictedTime), 'MMM d')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard
                      title="Temperature"
                      value={toF(firstForecast.temperature) ?? '--'}
                      unit="°F"
                      icon={Thermometer}
                      color="red"
                      subtitle={`${firstForecast.temperature > lastReading.temperature ? '▲' : '▼'} ${Math.abs(firstForecast.temperature - lastReading.temperature).toFixed(2)}°C from last`}
                    />
                    <StatCard
                      title="Humidity"
                      value={firstForecast.humidity.toFixed(2)}
                      unit="%"
                      icon={Droplets}
                      color="blue"
                      subtitle={`${firstForecast.humidity > lastReading.humidity ? '▲' : '▼'} ${Math.abs(firstForecast.humidity - lastReading.humidity).toFixed(2)}% from last`}
                    />
                    <StatCard
                      title="Air Quality"
                      value={firstForecast.airQuality.toFixed(2)}
                      icon={Wind}
                      color="purple"
                      subtitle={getAQLabel(firstForecast.airQuality)}
                    />
                    <StatCard
                      title="Flame"
                      value={firstForecast.flame ? '🔥 Alert' : '✅ Clear'}
                      icon={AlertTriangle}
                      color={firstForecast.flame ? 'red' : 'green'}
                      subtitle={firstForecast.flame ? 'Flame predicted' : 'No flame predicted'}
                    />
                  </div>
                </div>
              )}

              {/* Charts */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Forecast Charts · {WINDOWS.find(w => w.value === windowMin)?.label}
                </h3>

                {/* Tab Navigation */}
                <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
                  {[
                    { key: 'temperature', label: 'Temperature', icon: Thermometer },
                    { key: 'humidity', label: 'Humidity', icon: Droplets },
                    { key: 'airQuality', label: 'Air Quality', icon: Wind },
                    { key: 'flame', label: 'Flame', icon: AlertTriangle },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key as typeof activeTab)}
                      className={clsx(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                        activeTab === key
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Chart */}
                <div className="card p-5">
                  {activeTab === 'temperature' && (
                    <TimeSeriesChart
                      data={chartData}
                      metrics={[{ key: 'temperature', label: 'Temp (°F)', color: '#f97316' }]}
                      height={250}
                      duration={'24hr'}
                    />
                  )}
                  {activeTab === 'humidity' && (
                    <TimeSeriesChart
                      data={chartData}
                      metrics={[{ key: 'humidity', label: 'Humidity (%)', color: '#3b82f6' }]}
                      height={250}
                      duration={'24hr'}
                    />
                  )}
                  {activeTab === 'airQuality' && (
                    <TimeSeriesChart
                      data={chartData}
                      metrics={[{ key: 'airQuality', label: 'Air Quality', color: '#8b5cf6' }]}
                      height={250}
                      duration={'24hr'}
                    />
                  )}
                  {activeTab === 'flame' && (
                    <TimeSeriesChart
                      data={chartData}
                      metrics={[{ key: 'flame', label: 'Flame (0/1)', color: '#ef4444', threshold: 1 }]}
                      height={250}
                      duration={'24hr'}
                    />
                  )}
                </div>
              </div>

              {/* Forecast Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Full Forecast Table ({visibleForecast.length} steps)
                  </h3>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download CSV
                  </button>
                </div>

                <div className="card overflow-hidden">
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Step</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Predicted Time</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Temp (°F)</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Humidity (%)</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Air Quality</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Flame</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {visibleForecast.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-2.5 px-4 text-slate-500 font-mono">{row.step}</td>
                            <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                              {format(toLocalTime(row.predictedTime), 'MMM d, yyyy HH:mm:ss')}
                            </td>
                            <td className="py-2.5 px-4 text-right text-orange-500 font-medium">
                              {toF(row.temperature)?.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-4 text-right text-blue-500 font-medium">
                              {row.humidity.toFixed(2)}
                            </td>
                            <td className={clsx('py-2.5 px-4 text-right font-medium', getAQColor(row.airQuality))}>
                              {row.airQuality.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              {row.flame ? '🔥' : <span className="text-emerald-500">✓</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
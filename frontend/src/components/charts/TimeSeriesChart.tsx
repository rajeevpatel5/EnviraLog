import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';

interface TimeSeriesChartProps {
  data: any[];
  metrics: { key: string; label: string; color: string; unit?: string; threshold?: number }[];
  height?: number;
  title?: string;
  duration?: string; // e.g., '30min', '1hr', '24hr', '1week', '1month'
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 text-xs">
      <p className="font-medium text-slate-600 dark:text-slate-400 mb-2">
        {label ? format(new Date(label), 'MMM d, yyyy HH:mm') : ''}
      </p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-600 dark:text-slate-400">{p.name}:</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function TimeSeriesChart({ data, metrics, height = 300, title, duration }: TimeSeriesChartProps) {
  const chartData = data.map(d => ({
    ...d,
    _time: d.createdAt,
  }));

  // Determine format based on duration
  const getTickFormat = () => {
    if (duration === '1week') {
      // Show day name (e.g., "Mon", "Tue")
      return (v: number) => format(new Date(v), 'EEE');
    }
    if (duration === '24hr') {
      // Show hour only (e.g., "00", "06", "12", "18")
      return (v: number) => format(new Date(v), 'HH');
    }
    if (duration === '12hr' || duration === '6hr') {
      // Show hour and minute (e.g., "06:00", "12:00")
      return (v: number) => format(new Date(v), 'HH:mm');
    }
    // Default for short durations (30min, 1hr) - show time
    return (v: number) => format(new Date(v), 'HH:mm');
  };

  return (
    <div>
      {title && <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700/50" />
          <XAxis
            dataKey="_time"
            tickFormatter={getTickFormat()}
            tick={{ fontSize: 11, fill: 'currentColor' }}
            className="text-slate-500 dark:text-slate-400"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={50}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'currentColor' }}
            className="text-slate-500 dark:text-slate-400"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
          />
          {metrics.map(({ key, label, color, threshold }) => (
            <>
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={label}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                connectNulls
              />
              {threshold && (
                <ReferenceLine
                  key={`ref-${key}`}
                  y={threshold}
                  stroke={color}
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                />
              )}
            </>
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

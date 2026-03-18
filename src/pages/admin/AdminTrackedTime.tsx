import { useEffect, useMemo, useState } from 'react';
import { Clock, Coffee, AlertTriangle, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DateUtils } from '@/lib/storage';
import { getTrackingLogs, subscribeToTrackingLogChanges, type TrackingLog } from '@/services/trackingLogs';

export default function AdminTrackedTime() {
  const [logs, setLogs] = useState<TrackingLog[]>([]);

  useEffect(() => {
    const refresh = () => {
      setLogs(getTrackingLogs());
    };

    refresh();
    return subscribeToTrackingLogChanges(refresh);
  }, []);

  const today = DateUtils.today();
  const todayLogs = logs.filter((log) => log.timestamp.startsWith(today));
  const activeUsers = new Set(todayLogs.map((log) => log.email || log.userId));
  const totalTrackedToday = todayLogs.reduce((sum, log) => sum + log.duration, 0);
  const avgPerUser = activeUsers.size > 0 ? Math.round(totalTrackedToday / activeUsers.size) : 0;
  const idleMinutes = todayLogs
    .filter((log) => Boolean(log.website))
    .reduce((sum, log) => sum + log.duration, 0);

  const hourlyData = useMemo(() => {
    const buckets = new Map<string, { hour: string; active: number; idle: number }>();

    todayLogs.forEach((log) => {
      const parsed = new Date(log.timestamp);
      const hour = Number.isNaN(parsed.getTime())
        ? 'Now'
        : parsed.toLocaleTimeString('en-IN', { hour: 'numeric' });
      const bucket = buckets.get(hour) || { hour, active: 0, idle: 0 };
      if (log.website) {
        bucket.idle += Math.round(log.duration / 60);
      } else {
        bucket.active += Math.round(log.duration / 60);
      }
      buckets.set(hour, bucket);
    });

    return Array.from(buckets.values()).slice(-10);
  }, [todayLogs]);

  const employeeRows = useMemo(() => {
    const grouped = new Map<string, { tracked: number; idle: number; entries: number }>();

    todayLogs.forEach((log) => {
      const key = log.email || log.userId || 'unknown';
      const current = grouped.get(key) || { tracked: 0, idle: 0, entries: 0 };
      current.tracked += log.duration;
      current.entries += 1;
      if (log.website) {
        current.idle += log.duration;
      }
      grouped.set(key, current);
    });

    return Array.from(grouped.entries()).map(([employee, values]) => ({
      employee,
      trackedMinutes: Math.round(values.tracked / 60),
      idleMinutes: Math.round(values.idle / 60),
      entries: values.entries
    }));
  }, [todayLogs]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Total Tracked Time</h2>
        <p className="text-muted-foreground">Away and idle time overview across the organization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Tracked Today"
          value={`${Math.round(totalTrackedToday / 3600)}h`}
          subtitle="All employees"
          icon={Clock}
          variant="primary"
        />
        <StatCard
          title="Avg Per Employee"
          value={`${Math.round(avgPerUser / 3600)}h`}
          subtitle="Today"
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Total Idle Time"
          value={`${Math.round(idleMinutes / 3600)}h`}
          subtitle="Combined"
          icon={Coffee}
          variant="warning"
        />
        <StatCard
          title="Active Timers"
          value={activeUsers.size}
          subtitle="Logged employees"
          icon={AlertTriangle}
          variant="destructive"
        />
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Hourly Activity Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={hourlyData}>
            <defs>
              <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="idleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Area
              type="monotone"
              dataKey="active"
              stroke="hsl(199, 89%, 48%)"
              fill="url(#activeGradient)"
              strokeWidth={2}
              name="Active"
            />
            <Area
              type="monotone"
              dataKey="idle"
              stroke="hsl(38, 92%, 50%)"
              fill="url(#idleGradient)"
              strokeWidth={2}
              name="Idle"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Employee Time Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Employee</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Tracked Time</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Idle Time</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Live Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Entries</th>
              </tr>
            </thead>
            <tbody>
              {employeeRows.map((row) => (
                <tr key={row.employee} className="border-b border-border last:border-0 table-row-hover">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold">
                        {row.employee.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{row.employee}</p>
                        <p className="text-xs text-muted-foreground">Electron tracked user</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-success font-medium">
                    {Math.floor(row.trackedMinutes / 60)}h {row.trackedMinutes % 60}m
                  </td>
                  <td className="p-4 text-warning font-medium">
                    {Math.floor(row.idleMinutes / 60)}h {row.idleMinutes % 60}m
                  </td>
                  <td className="p-4 text-muted-foreground">
                    Logged Today
                  </td>
                  <td className="p-4 text-foreground">
                    {row.entries}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

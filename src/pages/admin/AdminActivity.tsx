import { useEffect, useMemo, useState } from 'react';
import { Activity as ActivityIcon, Clock, Zap, AlertTriangle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { StatCard } from '@/components/StatCard';
import { getTrackingLogs, subscribeToTrackingLogChanges, type TrackingLog } from '@/services/trackingLogs';

function classifyLog(log: TrackingLog) {
  const value = `${log.appName} ${log.windowTitle} ${log.website || ''}`.toLowerCase();
  if (value.includes('youtube')) return 'unproductive';
  if (['code', 'visual studio', 'terminal', 'figma', 'github', 'jira', 'outlook'].some((item) => value.includes(item))) {
    return 'productive';
  }
  return 'neutral';
}

export default function AdminActivity() {
  const [logs, setLogs] = useState<TrackingLog[]>([]);

  useEffect(() => {
    const refresh = () => {
      setLogs(getTrackingLogs());
    };

    refresh();
    return subscribeToTrackingLogChanges(refresh);
  }, []);

  const productiveLogs = logs.filter((log) => classifyLog(log) === 'productive');
  const idleLogs = logs.filter((log) => classifyLog(log) !== 'productive');
  const totalActiveMinutes = Math.round(logs.reduce((sum, log) => sum + log.duration, 0) / 60);

  const chartData = useMemo(() => {
    const dayMap = new Map<string, { day: string; productive: number; idle: number }>();

    logs.forEach((log) => {
      const date = new Date(log.timestamp);
      const day = Number.isNaN(date.getTime())
        ? 'Today'
        : date.toLocaleDateString('en-IN', { weekday: 'short' });

      const current = dayMap.get(day) || { day, productive: 0, idle: 0 };
      if (classifyLog(log) === 'productive') {
        current.productive += Math.round(log.duration / 60);
      } else {
        current.idle += Math.round(log.duration / 60);
      }
      dayMap.set(day, current);
    });

    return Array.from(dayMap.values()).slice(-7);
  }, [logs]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Activity Insights</h2>
        <p className="text-muted-foreground">Monitor employee activities across the organization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Active Sessions"
          value={new Set(logs.map((log) => log.email || log.userId)).size}
          icon={ActivityIcon}
          variant="primary"
        />
        <StatCard
          title="Total Active Hours"
          value={`${(totalActiveMinutes / 60).toFixed(1)}h`}
          subtitle="Tracked from desktop"
          icon={Clock}
          variant="success"
        />
        <StatCard
          title="Productive Logs"
          value={productiveLogs.length}
          icon={Zap}
          variant="warning"
        />
        <StatCard
          title="Idle Alerts"
          value={idleLogs.length}
          icon={AlertTriangle}
          variant="destructive"
        />
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Activity Timeline</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="productive" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} name="Active" stackId="a" />
            <Bar dataKey="idle" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} name="Idle" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Recent Activity Log</h3>
        </div>
        <div className="divide-y divide-border">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No desktop activity has been synced yet.
            </div>
          ) : (
            logs.slice(0, 10).map((log) => (
              <div key={log.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    classifyLog(log) === 'productive' ? 'bg-success/10 text-success' :
                    classifyLog(log) === 'unproductive' ? 'bg-destructive/10 text-destructive' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {log.website ? <ActivityIcon size={18} /> : <Zap size={18} />}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{log.windowTitle}</p>
                    <p className="text-sm text-muted-foreground">{log.email || log.userName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{Math.round(log.duration / 60)} min</p>
                  <p className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

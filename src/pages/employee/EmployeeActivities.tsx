import { useEffect, useMemo, useState } from 'react';
import { Activity, Globe, Monitor, Clock, Coffee } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import { getTrackingLogsByUser, subscribeToTrackingLogChanges, type TrackingLog } from '@/services/trackingLogs';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

function formatMinutes(totalSeconds: number) {
  const totalMinutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function EmployeeActivities() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<TrackingLog[]>([]);

  useEffect(() => {
    const refresh = () => {
      setLogs(getTrackingLogsByUser(user));
    };

    refresh();
    return subscribeToTrackingLogChanges(refresh);
  }, [user]);

  const totalSeconds = logs.reduce((sum, log) => sum + log.duration, 0);
  const browserSeconds = logs.filter((log) => log.website).reduce((sum, log) => sum + log.duration, 0);
  const appSeconds = Math.max(0, totalSeconds - browserSeconds);

  const appUsage = useMemo(() => {
    const grouped = new Map<string, number>();
    logs.forEach((log) => {
      grouped.set(log.appName, (grouped.get(log.appName) || 0) + log.duration);
    });

    return Array.from(grouped.entries())
      .map(([name, duration]) => ({ name, duration }))
      .sort((left, right) => right.duration - left.duration)
      .slice(0, 5);
  }, [logs]);

  const siteUsage = useMemo(() => {
    const grouped = new Map<string, number>();
    logs.filter((log) => log.website).forEach((log) => {
      const key = log.website || log.windowTitle;
      grouped.set(key, (grouped.get(key) || 0) + log.duration);
    });

    return Array.from(grouped.entries())
      .map(([name, duration]) => ({ name, duration }))
      .sort((left, right) => right.duration - left.duration)
      .slice(0, 5);
  }, [logs]);

  const activityBreakdown = [
    { name: 'Apps', value: Math.round(appSeconds / 60), color: 'hsl(142, 71%, 45%)' },
    { name: 'Browser', value: Math.round(browserSeconds / 60), color: 'hsl(38, 92%, 50%)' },
    { name: 'Away', value: 0, color: 'hsl(var(--muted-foreground))' },
  ];

  const timeline = logs.slice(0, 6).map((log) => ({
    time: new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    type: log.website ? 'browser' : 'active',
    description: log.windowTitle,
    duration: formatMinutes(log.duration),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Activities</h2>
        <p className="text-muted-foreground">Your activity timeline and usage breakdown</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Active Time"
          value={formatMinutes(totalSeconds)}
          icon={Activity}
          variant="success"
        />
        <StatCard
          title="Tracked Logs"
          value={logs.length}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Browser Time"
          value={formatMinutes(browserSeconds)}
          icon={Coffee}
          variant="default"
        />
        <StatCard
          title="Top App"
          value={appUsage[0]?.name || 'No data'}
          subtitle={appUsage[0] ? formatMinutes(appUsage[0].duration) : '0m'}
          icon={Monitor}
          variant="primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Time Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={activityBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {activityBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`${value}m`, '']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Monitor size={18} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Top Apps</h3>
          </div>
          <div className="space-y-3">
            {appUsage.map((app) => (
              <div key={app.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-sm text-foreground">{app.name}</span>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {formatMinutes(app.duration)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={18} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Top Sites</h3>
          </div>
          <div className="space-y-3">
            {siteUsage.map((site) => (
              <div key={site.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-warning" />
                  <span className="text-sm text-foreground">{site.name}</span>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {formatMinutes(site.duration)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Activity Timeline</h3>
        <div className="space-y-4">
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tracked activity available yet.</p>
          ) : timeline.map((item, index) => (
            <div key={`${item.time}-${index}`} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${
                  item.type === 'active' ? 'bg-success' : 'bg-warning'
                }`} />
                {index < timeline.length - 1 && (
                  <div className="w-px h-full bg-border flex-1 mt-1" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{item.description}</p>
                    <p className="text-sm text-muted-foreground">{item.time}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    item.type === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                  }`}>
                    {item.duration}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

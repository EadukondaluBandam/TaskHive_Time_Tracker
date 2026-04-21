import { useEffect, useState } from 'react';
import { TrendingUp, Clock, Target } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { ProgressRing } from '@/components/ProgressRing';
import { useAuth } from '@/contexts/AuthContext';
import { TimeEntryStorage } from '@/lib/storage';
import { buildMonthlyWeeks, buildWeeklyHours } from '@/lib/analytics';
import { getTrackingLogsByUser, subscribeToTrackingLogChanges, type TrackingLog } from '@/services/trackingLogs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

function formatDuration(totalSeconds: number) {
  const totalMinutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function EmployeeProductivity() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<TrackingLog[]>([]);
  const [entries, setEntries] = useState(TimeEntryStorage.getAll());

  useEffect(() => {
    const refresh = () => {
      setEntries(TimeEntryStorage.getAll());
      setLogs(getTrackingLogsByUser(user));
    };

    refresh();
    return subscribeToTrackingLogChanges(refresh);
  }, [user]);

  const myEntries = entries.filter((entry) => entry.userId === user?.id);
  const weeklyProductivity = buildWeeklyHours(myEntries, user?.id).map((item) => ({
    day: item.day,
    productivity: Math.min(100, Math.round(item.hours * 10)),
  }));
  const monthlyTrend = buildMonthlyWeeks(myEntries, user?.id);

  const totalTrackedSeconds = logs.reduce((sum, log) => sum + log.duration, 0);
  const browserSeconds = logs.filter((log) => log.website).reduce((sum, log) => sum + log.duration, 0);
  const activeSeconds = Math.max(0, totalTrackedSeconds - browserSeconds);
  const currentScore = totalTrackedSeconds > 0 ? Math.round((activeSeconds / totalTrackedSeconds) * 100) : 0;
  const weeklyAverage = weeklyProductivity.length > 0
    ? Math.round(weeklyProductivity.reduce((sum, item) => sum + item.productivity, 0) / weeklyProductivity.length)
    : 0;
  const monthlyAverage = monthlyTrend.length > 0
    ? Math.round(monthlyTrend.reduce((sum, item) => sum + item.productivity, 0) / monthlyTrend.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Productivity</h2>
        <p className="text-muted-foreground">Your productivity summary and efficiency metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Current Score"
          value={`${currentScore}%`}
          icon={TrendingUp}
          variant="primary"
        />
        <StatCard
          title="Weekly Average"
          value={`${weeklyAverage}%`}
          icon={Clock}
          variant="success"
        />
        <StatCard
          title="Monthly Average"
          value={`${monthlyAverage}%`}
          icon={Target}
          variant="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Today's Efficiency</h3>
          <div className="flex flex-col items-center">
            <ProgressRing value={currentScore} size={200} strokeWidth={16} label="Efficiency" />
            <div className="mt-8 grid grid-cols-3 gap-4 w-full">
              <div className="text-center p-3 bg-success/10 rounded-lg">
                <p className="text-xl font-bold text-success">{formatDuration(activeSeconds)}</p>
                <p className="text-xs text-muted-foreground">Active Time</p>
              </div>
              <div className="text-center p-3 bg-warning/10 rounded-lg">
                <p className="text-xl font-bold text-warning">{formatDuration(browserSeconds)}</p>
                <p className="text-xs text-muted-foreground">Idle Time</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xl font-bold text-muted-foreground">{myEntries.length}</p>
                <p className="text-xs text-muted-foreground">Logged Entries</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">This Week's Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={weeklyProductivity}>
              <defs>
                <linearGradient id="productivityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="productivity"
                stroke="hsl(199, 89%, 48%)"
                fill="url(#productivityGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Progress</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={false}
              name="Target"
            />
            <Line
              type="monotone"
              dataKey="productivity"
              stroke="hsl(199, 89%, 48%)"
              strokeWidth={3}
              dot={{ fill: 'hsl(199, 89%, 48%)', strokeWidth: 2 }}
              name="Your Score"
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-primary" />
            <span className="text-sm text-muted-foreground">Your Score</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-muted-foreground" style={{ borderStyle: 'dashed' }} />
            <span className="text-sm text-muted-foreground">Target (85%)</span>
          </div>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-3">Productivity Tips</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>Review your tracked apps and sites to spot distractions early.</li>
          <li>Consistent task descriptions make your reports and approvals much clearer.</li>
          <li>Start timers from the tracker when possible so time stays attached to the right task.</li>
        </ul>
      </div>
    </div>
  );
}

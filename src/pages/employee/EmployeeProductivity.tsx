import { TrendingUp, Clock, Target, Award } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { ProgressRing } from '@/components/ProgressRing';
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

const weeklyProductivity = [
  { day: 'Mon', productivity: 88 },
  { day: 'Tue', productivity: 92 },
  { day: 'Wed', productivity: 85 },
  { day: 'Thu', productivity: 90 },
  { day: 'Fri', productivity: 87 },
];

const monthlyTrend = [
  { week: 'Week 1', productivity: 82, target: 85 },
  { week: 'Week 2', productivity: 86, target: 85 },
  { week: 'Week 3', productivity: 88, target: 85 },
  { week: 'Week 4', productivity: 91, target: 85 },
];

export default function EmployeeProductivity() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Productivity</h2>
        <p className="text-muted-foreground">Your productivity summary and efficiency metrics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Current Score"
          value="88%"
          icon={TrendingUp}
          variant="primary"
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Weekly Average"
          value="88%"
          icon={Clock}
          variant="success"
        />
        <StatCard
          title="Monthly Average"
          value="87%"
          icon={Target}
          variant="warning"
        />
    
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productivity Ring */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Today's Efficiency</h3>
          <div className="flex flex-col items-center">
            <ProgressRing value={88} size={200} strokeWidth={16} label="Efficiency" />
            <div className="mt-8 grid grid-cols-3 gap-4 w-full">
              <div className="text-center p-3 bg-success/10 rounded-lg">
                <p className="text-xl font-bold text-success">6h 12m</p>
                <p className="text-xs text-muted-foreground">Active Time</p>
              </div>
              <div className="text-center p-3 bg-warning/10 rounded-lg">
                <p className="text-xl font-bold text-warning">48m</p>
                <p className="text-xs text-muted-foreground">Idle Time</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xl font-bold text-muted-foreground">30m</p>
                <p className="text-xs text-muted-foreground">Breaks</p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Trend */}
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
              <YAxis domain={[70, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
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

      {/* Monthly Trend */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Progress</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis domain={[75, 95]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
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

      {/* Tips */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-3">Productivity Tips</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Your productivity peaks between 10 AM - 12 PM. Schedule important tasks during this time.</li>
          <li>• You've been consistent this week! Keep up the good work.</li>
          <li>• Consider taking a 5-minute break every 90 minutes to maintain focus.</li>
        </ul>
      </div>
    </div>
  );
}

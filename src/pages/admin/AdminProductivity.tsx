import { useMemo } from 'react';
import { TrendingUp, Users, Award, Target } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { ProgressRing } from '@/components/ProgressRing';
import { UserStorage } from '@/lib/storage';
import { buildDepartmentProductivity } from '@/lib/analytics';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

export default function AdminProductivity() {
  const users = UserStorage.getAll();
  const productivityByTeam = useMemo(() => buildDepartmentProductivity(users), [users]);
  const avgProductivity = users.length > 0 ? Math.round(users.reduce((acc, u) => acc + u.productivity, 0) / users.length) : 0;
  const topPerformer = users.length > 0
    ? users.reduce((prev, current) => (prev.productivity > current.productivity) ? prev : current)
    : null;

  const radarData = productivityByTeam.map(t => ({
    team: t.team,
    productivity: t.productivity,
    fullMark: 100,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Productivity Overview</h2>
        <p className="text-muted-foreground">Efficiency comparison across teams and individuals</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Org Productivity"
          value={`${avgProductivity}%`}
          icon={TrendingUp}
          variant="primary"
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Active Employees"
          value={users.filter(u => u.status === 'active').length}
          icon={Users}
          variant="success"
        />
        <StatCard
          title="Top Performer"
          value={topPerformer?.name.split(' ')[0] || 'N/A'}
          subtitle={topPerformer ? `${topPerformer.productivity}% efficiency` : 'No employee data yet'}
          icon={Award}
          variant="warning"
        />
        <StatCard
          title="Target Goal"
          value="90%"
          subtitle="Organization target"
          icon={Target}
          variant="default"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Comparison */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Team Productivity Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productivityByTeam} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis dataKey="team" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="productivity" fill="hsl(199, 89%, 48%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Team Performance Radar</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="team" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <Radar
                name="Productivity"
                dataKey="productivity"
                stroke="hsl(199, 89%, 48%)"
                fill="hsl(199, 89%, 48%)"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Individual Rankings */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Individual Performance Rankings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {users
            .sort((a, b) => b.productivity - a.productivity)
            .slice(0, 5)
            .map((user, index) => (
              <div key={user.id} className="flex flex-col items-center p-4 bg-muted/30 rounded-lg">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-3 ${
                  index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                  index === 1 ? 'bg-gray-400/20 text-gray-400' :
                  index === 2 ? 'bg-orange-600/20 text-orange-600' :
                  'bg-primary/20 text-primary'
                }`}>
                  #{index + 1}
                </div>
                <ProgressRing value={user.productivity} size={80} strokeWidth={6} />
                <p className="text-sm font-medium text-foreground mt-3">{user.name.split(' ')[0]}</p>
                <p className="text-xs text-muted-foreground">{user.department}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

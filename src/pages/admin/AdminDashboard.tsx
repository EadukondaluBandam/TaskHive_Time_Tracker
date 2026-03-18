import { useNavigate } from 'react-router-dom';
import {
  Users,
  Clock,
  TrendingUp,
  FolderKanban,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { ProgressRing } from '@/components/ProgressRing';
import { UserStorage, ProjectStorage, TaskStorage, TimeEntryStorage, TimerStorage } from '@/lib/storage';
import { weeklyData, productivityByTeam } from '@/lib/mockData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useState, useEffect } from 'react';
import SEO from '@/components/SEO';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState(UserStorage.getAll());
  const [projects, setProjects] = useState(ProjectStorage.getAll());
  const [tasks, setTasks] = useState(TaskStorage.getAll());
  const [activeTimers, setActiveTimers] = useState(TimerStorage.getAllActive());

  useEffect(() => {
    // Refresh data periodically
    const interval = setInterval(() => {
      setUsers(UserStorage.getAll());
      setProjects(ProjectStorage.getAll());
      setTasks(TaskStorage.getAll());
      setActiveTimers(TimerStorage.getAllActive());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeUsers = users.filter(u => u.status === 'active').length;
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const avgProductivity = Math.round(users.reduce((acc, u) => acc + u.productivity, 0) / users.length);
  const totalHours = users.reduce((acc, u) => acc + u.totalHours, 0);

  return (
    <div className="space-y-6">
      <SEO
        title="TaskHive Admin Dashboard"
        description="Monitor employee productivity, active projects, tracked hours, and organization performance from the TaskHive admin dashboard."
        path="/admin/dashboard"
      />
      {/* Stats Grid - Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => navigate('/admin/users')} className="cursor-pointer">
          <StatCard
            title="Active Employees"
            value={activeUsers}
            subtitle={`of ${users.length} total`}
            icon={Users}
            variant="primary"
            trend={{ value: 12, isPositive: true }}
          />
        </div>
        <div onClick={() => navigate('/admin/projects')} className="cursor-pointer">
          <StatCard
            title="Active Projects"
            value={activeProjects}
            subtitle={`${projects.length - activeProjects} completed/on-hold`}
            icon={FolderKanban}
            variant="success"
          />
        </div>
        <StatCard
          title="Total Hours Tracked"
          value={`${totalHours}h`}
          subtitle="This month"
          icon={Clock}
          variant="warning"
          trend={{ value: 8, isPositive: true }}
        />
        <div onClick={() => navigate('/admin/tasks')} className="cursor-pointer">
          <StatCard
            title="Pending Tasks"
            value={pendingTasks}
            subtitle="Require attention"
            icon={AlertCircle}
            variant="destructive"
          />
        </div>
      </div>

      {/* Active Employees Status */}
      {activeTimers.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Currently Working</h3>
          <div className="flex flex-wrap gap-2">
            {activeTimers.map((timer) => {
              const user = UserStorage.getById(timer.userId);
              const project = ProjectStorage.getById(timer.projectId);
              return (
                <div
                  key={timer.userId}
                  className="flex items-center gap-2 px-3 py-2 bg-success/10 border border-success/20 rounded-lg"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                  </span>
                  <span className="text-sm font-medium text-foreground">{user?.name}</span>
                  <span className="text-xs text-muted-foreground">• {project?.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Hours Chart */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Weekly Hours Overview</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Bar dataKey="productive" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} name="Productive" />
              <Bar dataKey="idle" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} name="Idle" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Productivity Overview */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Avg Productivity</h3>
          <div className="flex flex-col items-center">
            <ProgressRing value={avgProductivity} size={160} strokeWidth={12} label="Team Average" />
            <div className="mt-6 w-full space-y-3">
              {productivityByTeam.slice(0, 4).map((team) => (
                <div key={team.team} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{team.team}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${team.productivity}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground w-10 text-right">{team.productivity}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Top Performers</h3>
            <Activity size={20} className="text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {users
              .sort((a, b) => b.productivity - a.productivity)
              .slice(0, 5)
              .map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{user.productivity}%</p>
                    <p className="text-xs text-muted-foreground">{user.totalHours}h</p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Project Status */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Project Status</h3>
            <FolderKanban size={20} className="text-muted-foreground" />
          </div>
          <div className="space-y-4">
            {projects.slice(0, 4).map((project) => (
              <div key={project.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
                    <p className="text-xs text-muted-foreground">{project.team.length} team members</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      project.status === 'active'
                        ? 'bg-success/10 text-success'
                        : project.status === 'completed'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-warning/10 text-warning'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-foreground w-10 text-right">{project.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

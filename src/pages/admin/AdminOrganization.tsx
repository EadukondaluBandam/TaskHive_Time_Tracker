import { Building2, Users, FolderKanban, Clock, Globe, Monitor } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { users, projects } from '@/lib/mockData';
import { ProgressRing } from '@/components/ProgressRing';

const siteUsage = [
  { name: 'GitHub', category: 'Development', usage: 420, productive: true },
  { name: 'Stack Overflow', category: 'Development', usage: 180, productive: true },
  { name: 'Jira', category: 'Project Management', usage: 156, productive: true },
  { name: 'Figma', category: 'Design', usage: 240, productive: true },
  { name: 'YouTube', category: 'Entertainment', usage: 45, productive: false },
  { name: 'LinkedIn', category: 'Social', usage: 30, productive: false },
];

const appUsage = [
  { name: 'VS Code', category: 'IDE', usage: 580, productive: true },
  { name: 'IntelliJ IDEA', category: 'IDE', usage: 340, productive: true },
  { name: 'Terminal', category: 'Development', usage: 220, productive: true },
  { name: 'Slack', category: 'Communication', usage: 180, productive: true },
  { name: 'Chrome', category: 'Browser', usage: 420, productive: true },
];

export default function AdminOrganization() {
  const totalProductiveTime = siteUsage.filter(s => s.productive).reduce((acc, s) => acc + s.usage, 0) +
                              appUsage.filter(a => a.productive).reduce((acc, a) => acc + a.usage, 0);
  const totalUnproductiveTime = siteUsage.filter(s => !s.productive).reduce((acc, s) => acc + s.usage, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Organization Summary</h2>
        <p className="text-muted-foreground">Sites & Apps usage across the organization</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Departments"
          value="5"
          icon={Building2}
          variant="primary"
        />
        <StatCard
          title="Active Employees"
          value={users.filter(u => u.status === 'active').length}
          icon={Users}
          variant="success"
        />
        <StatCard
          title="Active Projects"
          value={projects.filter(p => p.status === 'active').length}
          icon={FolderKanban}
          variant="warning"
        />
        <StatCard
          title="Avg Hours/Day"
          value="7.8h"
          icon={Clock}
          variant="default"
        />
      </div>

      {/* Usage Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productivity Ring */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Productivity Score</h3>
          <div className="flex flex-col items-center">
            <ProgressRing value={87} size={180} strokeWidth={14} label="Organization" />
            <div className="mt-6 grid grid-cols-2 gap-4 w-full">
              <div className="text-center p-3 bg-success/10 rounded-lg">
                <p className="text-lg font-bold text-success">{Math.round(totalProductiveTime / 60)}h</p>
                <p className="text-xs text-muted-foreground">Productive</p>
              </div>
              <div className="text-center p-3 bg-warning/10 rounded-lg">
                <p className="text-lg font-bold text-warning">{Math.round(totalUnproductiveTime / 60)}h</p>
                <p className="text-xs text-muted-foreground">Unproductive</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sites Usage */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={18} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Top Sites</h3>
          </div>
          <div className="space-y-3">
            {siteUsage.slice(0, 5).map((site) => (
              <div key={site.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${site.productive ? 'bg-success' : 'bg-warning'}`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{site.name}</p>
                    <p className="text-xs text-muted-foreground">{site.category}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-foreground">{Math.round(site.usage / 60)}h</span>
              </div>
            ))}
          </div>
        </div>

        {/* Apps Usage */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Monitor size={18} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Top Apps</h3>
          </div>
          <div className="space-y-3">
            {appUsage.slice(0, 5).map((app) => (
              <div key={app.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${app.productive ? 'bg-success' : 'bg-warning'}`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{app.name}</p>
                    <p className="text-xs text-muted-foreground">{app.category}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-foreground">{Math.round(app.usage / 60)}h</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Department Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {['Development', 'Design', 'QA', 'Marketing', 'DevOps'].map((dept) => {
            const deptUsers = users.filter(u => u.department === dept);
            const avgProductivity = deptUsers.length > 0
              ? Math.round(deptUsers.reduce((acc, u) => acc + u.productivity, 0) / deptUsers.length)
              : 0;
            return (
              <div key={dept} className="p-4 bg-muted/30 rounded-lg text-center">
                <p className="text-sm font-medium text-foreground mb-2">{dept}</p>
                <p className="text-3xl font-bold text-primary">{avgProductivity}%</p>
                <p className="text-xs text-muted-foreground mt-1">{deptUsers.length} members</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

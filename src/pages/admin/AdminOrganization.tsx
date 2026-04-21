import { Building2, Users, FolderKanban, Clock, Globe, Monitor } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { ProgressRing } from '@/components/ProgressRing';
import { useEffect, useMemo, useState } from 'react';
import { ProjectStorage, TimeEntryStorage, UserStorage } from '@/lib/storage';
import { buildDepartmentProductivity, buildTopUsage } from '@/lib/analytics';
import { getTrackingLogs, subscribeToTrackingLogChanges, type TrackingLog } from '@/services/trackingLogs';

export default function AdminOrganization() {
  const [users, setUsers] = useState(UserStorage.getAll());
  const [projects, setProjects] = useState(ProjectStorage.getAll());
  const [logs, setLogs] = useState<TrackingLog[]>(getTrackingLogs());
  const [timeEntries, setTimeEntries] = useState(TimeEntryStorage.getAll());

  useEffect(() => {
    const refresh = () => {
      setUsers(UserStorage.getAll());
      setProjects(ProjectStorage.getAll());
      setLogs(getTrackingLogs());
      setTimeEntries(TimeEntryStorage.getAll());
    };

    refresh();
    return subscribeToTrackingLogChanges(refresh);
  }, []);

  const usage = useMemo(() => buildTopUsage(logs), [logs]);
  const totalProductiveTime = usage.apps.reduce((acc, item) => acc + item.duration, 0) / 60;
  const totalUnproductiveTime = usage.sites.reduce((acc, item) => acc + item.duration, 0) / 60;
  const departmentData = buildDepartmentProductivity(users);
  const averageHours = users.length > 0
    ? (timeEntries.reduce((acc, entry) => acc + entry.duration, 0) / 60) / users.length
    : 0;

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
          value={departmentData.length}
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
          value={`${averageHours.toFixed(1)}h`}
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
            <ProgressRing value={departmentData.length > 0 ? Math.round(departmentData.reduce((acc, item) => acc + item.productivity, 0) / departmentData.length) : 0} size={180} strokeWidth={14} label="Organization" />
            <div className="mt-6 grid grid-cols-2 gap-4 w-full">
              <div className="text-center p-3 bg-success/10 rounded-lg">
                <p className="text-lg font-bold text-success">{Math.round(totalProductiveTime)}h</p>
                <p className="text-xs text-muted-foreground">Productive</p>
              </div>
              <div className="text-center p-3 bg-warning/10 rounded-lg">
                <p className="text-lg font-bold text-warning">{Math.round(totalUnproductiveTime)}h</p>
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
            {usage.sites.slice(0, 5).map((site) => (
              <div key={site.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-warning" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{site.name}</p>
                    <p className="text-xs text-muted-foreground">Browser</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-foreground">{site.hours}h</span>
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
            {usage.apps.slice(0, 5).map((app) => (
              <div key={app.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{app.name}</p>
                    <p className="text-xs text-muted-foreground">Application</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-foreground">{app.hours}h</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Department Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {departmentData.map((dept) => {
            const deptUsers = users.filter(u => u.department === dept.team);
            return (
              <div key={dept.team} className="p-4 bg-muted/30 rounded-lg text-center">
                <p className="text-sm font-medium text-foreground mb-2">{dept.team}</p>
                <p className="text-3xl font-bold text-primary">{dept.productivity}%</p>
                <p className="text-xs text-muted-foreground mt-1">{deptUsers.length} members</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { Camera, Monitor, Clock, Activity } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { users } from '@/lib/mockData';

const screenshots = [
  { id: 1, user: 'Priya Patel', time: '10:30 AM', status: 'active', app: 'VS Code', activity: 92 },
  { id: 2, user: 'Ramesh Kumar', time: '10:32 AM', status: 'active', app: 'IntelliJ IDEA', activity: 88 },
  { id: 3, user: 'Ananya Reddy', time: '10:28 AM', status: 'idle', app: 'Figma', activity: 45 },
  { id: 4, user: 'Karthik Nair', time: '10:35 AM', status: 'active', app: 'Terminal', activity: 95 },
  { id: 5, user: 'Kavya Iyer', time: '10:29 AM', status: 'active', app: 'Chrome', activity: 78 },
  { id: 6, user: 'Lakshmi Menon', time: '10:31 AM', status: 'away', app: 'Slack', activity: 0 },
];

export default function AdminScreenshots() {
  const activeCount = screenshots.filter(s => s.status === 'active').length;
  const idleCount = screenshots.filter(s => s.status === 'idle').length;
  const awayCount = screenshots.filter(s => s.status === 'away').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Monitoring Snapshot</h2>
        <p className="text-muted-foreground">Active vs idle monitoring view</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Active Now"
          value={activeCount}
          icon={Activity}
          variant="success"
        />
        <StatCard
          title="Idle"
          value={idleCount}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Away"
          value={awayCount}
          icon={Monitor}
          variant="destructive"
        />
        <StatCard
          title="Last Capture"
          value="10:35 AM"
          subtitle="2 minutes ago"
          icon={Camera}
          variant="primary"
        />
      </div>

      {/* Screenshot Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {screenshots.map((screenshot) => (
          <div
            key={screenshot.id}
            className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 transition-colors group"
          >
            {/* Placeholder screenshot area */}
            <div className="aspect-video bg-muted/50 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Monitor size={40} className="mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">{screenshot.app}</p>
                </div>
              </div>
              <div className={`absolute top-3 right-3 px-2 py-1 text-xs font-medium rounded-full ${
                screenshot.status === 'active' ? 'bg-success/90 text-success-foreground' :
                screenshot.status === 'idle' ? 'bg-warning/90 text-warning-foreground' :
                'bg-destructive/90 text-destructive-foreground'
              }`}>
                {screenshot.status}
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold">
                    {screenshot.user.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{screenshot.user}</p>
                    <p className="text-xs text-muted-foreground">{screenshot.time}</p>
                  </div>
                </div>
              </div>
              
              {/* Activity bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Activity Level</span>
                  <span className={`font-medium ${
                    screenshot.activity > 70 ? 'text-success' :
                    screenshot.activity > 30 ? 'text-warning' : 'text-destructive'
                  }`}>{screenshot.activity}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      screenshot.activity > 70 ? 'bg-success' :
                      screenshot.activity > 30 ? 'bg-warning' : 'bg-destructive'
                    }`}
                    style={{ width: `${screenshot.activity}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 p-4 bg-card rounded-xl border border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="text-sm text-muted-foreground">Active - Working</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-warning" />
          <span className="text-sm text-muted-foreground">Idle - Low Activity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive" />
          <span className="text-sm text-muted-foreground">Away - No Activity</span>
        </div>
      </div>
    </div>
  );
}

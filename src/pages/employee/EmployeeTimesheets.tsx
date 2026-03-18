import { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const dailyData = [
  { time: '09:00 - 12:30', project: 'Bharat Banking Portal', task: 'UPI Integration Module', duration: '3h 30m' },
  { time: '14:00 - 17:30', project: 'Kisan Mitra Platform', task: 'Weather Integration', duration: '3h 30m' },
];

const weeklyData = [
  { day: 'Mon', hours: 8.5, entries: 4 },
  { day: 'Tue', hours: 9.0, entries: 5 },
  { day: 'Wed', hours: 7.5, entries: 3 },
  { day: 'Thu', hours: 8.0, entries: 4 },
  { day: 'Fri', hours: 7.0, entries: 4 },
  { day: 'Sat', hours: 0, entries: 0 },
  { day: 'Sun', hours: 0, entries: 0 },
];

const appsList = ['Chrome', 'VS Code', 'Slack', 'Outlook', 'Figma', 'YouTube', 'Notion'];

const minutesInRangeForApp = (start: Date, end: Date, app: string) => {
  const WORK_MINUTES_PER_DAY = 8 * 60; 
  const BREAK_MINUTES = 60; // lunch/break
  const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  let total = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

    // deterministic away minutes per day (0 - 120)
    const awayHash = (seed * 97) % 97;
    const awayMinutes = Math.floor((awayHash / 96) * 120);

    const productive = Math.max(0, WORK_MINUTES_PER_DAY - BREAK_MINUTES - awayMinutes);

    // compute weights for apps for this day so distribution sums to productive
    const weights = appsList.map((a) => {
      const h = (seed * (a.length + 31)) % 97;
      return h + 1; // avoid zero
    });
    const totalWeight = weights.reduce((s, w) => s + w, 0) || 1;

    // find app index
    const idx = appsList.indexOf(app);
    if (idx === -1) continue;

    // allocate minutes proportionally, round and ensure last app adjustment handled elsewhere
    const minutes = Math.round((weights[idx] / totalWeight) * productive);
    total += minutes;
  }
  return total;
};

const getRangeForTab = (date: Date, tab: string) => {
  const start = new Date(date);
  const end = new Date(date);
  if (tab === 'daily') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (tab === 'weekly') {
    // week starting Monday
    const weekStart = new Date(date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return { start: weekStart, end: weekEnd };
  }
  // monthly
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start: monthStart, end: monthEnd };
};

const aggregateUsageForRange = (start: Date, end: Date) => {
  const rows = appsList.map((app) => ({
    name: app,
    minutes: minutesInRangeForApp(start, end, app),
  }));
  // filter zero and sort desc
  return rows.filter(r => r.minutes > 0).sort((a, b) => b.minutes - a.minutes);
};

const formatMinutes = (m: number) => {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h > 0) return `${h}h ${mm}m`;
  return `${mm}m`;
};

export default function EmployeeTimesheets() {
  const [activeTab, setActiveTab] = useState('daily');
  const [viewDate, setViewDate] = useState(new Date());

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getWeekRange = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay() + 1);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const getMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOffset = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const handlePrev = () => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      if (activeTab === 'daily') {
        newDate.setDate(newDate.getDate() - 1);
      } else if (activeTab === 'weekly') {
        newDate.setDate(newDate.getDate() - 7);
      } else if (activeTab === 'monthly') {
        newDate.setMonth(newDate.getMonth() - 1);
      }
      return newDate;
    });
  };

  const handleNext = () => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      if (activeTab === 'daily') {
        newDate.setDate(newDate.getDate() + 1);
      } else if (activeTab === 'weekly') {
        newDate.setDate(newDate.getDate() + 7);
      } else if (activeTab === 'monthly') {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const range = useMemo(() => getRangeForTab(viewDate, activeTab), [viewDate, activeTab]);
  const appsUsage = useMemo(() => aggregateUsageForRange(range.start, range.end), [range.start, range.end]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Timesheets</h2>
        <p className="text-muted-foreground">View and manage your time entries</p>
      </div>

      {/* Tabs with Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Navigation Header */}
        <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
          <TabsList className="bg-transparent p-0 border-none">
            <TabsTrigger value="daily" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Daily</TabsTrigger>
            <TabsTrigger value="weekly" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Weekly</TabsTrigger>
            <TabsTrigger value="monthly" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Monthly</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handlePrev}>
              <ChevronLeft size={18} />
            </Button>
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border">
              <Calendar size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {activeTab === 'daily' && formatDate(viewDate)}
                {activeTab === 'weekly' && getWeekRange(viewDate)}
                {activeTab === 'monthly' && getMonthYear(viewDate)}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleNext}>
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>

        {/* Tab Contents */}
        <TabsContent value="daily" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-2xl font-bold text-primary">7h 0m</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Entries</p>
              <p className="text-2xl font-bold text-foreground">2</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Active Time</p>
              <p className="text-2xl font-bold text-success">6h 15m</p>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {dailyData.map((entry, index) => (
                <div key={index} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[100px]">
                      <p className="text-sm font-medium text-foreground">{entry.time}</p>
                    </div>
                    <div className="w-px h-10 bg-border" />
                    <div>
                      <p className="font-medium text-foreground">{entry.task}</p>
                      <p className="text-sm text-muted-foreground">{entry.project}</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-primary">{entry.duration}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-semibold text-foreground mb-4">Apps & Sites — Daily</h3>
            <p className="text-sm text-muted-foreground mb-3">Total time: {formatMinutes(appsUsage.reduce((s, a) => s + a.minutes, 0))}</p>
            {appsUsage.length === 0 ? (
              <p className="text-muted-foreground">No usage recorded.</p>
            ) : (
              <div className="space-y-3">
                {appsUsage.map((a) => {
                  const total = appsUsage.reduce((s, r) => s + r.minutes, 0) || 1;
                  const pct = Math.round((a.minutes / total) * 100);
                  return (
                    <div key={a.name} className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground">{a.name}</p>
                          <p className="text-sm text-muted-foreground">{formatMinutes(a.minutes)}</p>
                        </div>
                        <div className="w-full bg-muted/30 h-2 rounded mt-2">
                          <div className="bg-primary h-2 rounded" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
        </TabsContent>

        <TabsContent value="weekly" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-2xl font-bold text-primary">40h 0m</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Days Worked</p>
              <p className="text-2xl font-bold text-foreground">5</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Avg Per Day</p>
              <p className="text-2xl font-bold text-success">8h 0m</p>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-7 border-b border-border">
              {weekDays.map((day) => (
                <div key={day} className="p-3 text-center border-r border-border last:border-r-0 bg-muted/50">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wider">{day}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {weeklyData.map((day, index) => {
                const weekStart = new Date(viewDate);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
                const dayDate = new Date(weekStart);
                dayDate.setDate(dayDate.getDate() + index);
                return (
                  <div
                    key={index}
                    className={`p-4 border-r border-border last:border-r-0 text-center hover:bg-muted/30 transition-colors ${day.hours > 0 ? 'cursor-pointer bg-primary/5' : ''}`}
                  >
                    <p className="text-sm font-medium text-foreground">{dayDate.getDate()}</p>
                    <p className={`text-lg font-bold mt-1 ${day.hours > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                      {day.hours > 0 ? `${Math.floor(day.hours)}h` : '-'}
                    </p>
                    {day.entries > 0 && <p className="text-xs text-muted-foreground">{day.entries} entries</p>}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-semibold text-foreground mb-4">Apps & Sites — Weekly</h3>
            <p className="text-sm text-muted-foreground mb-3">Total time: {formatMinutes(appsUsage.reduce((s, a) => s + a.minutes, 0))}</p>
            {appsUsage.length === 0 ? (
              <p className="text-muted-foreground">No usage recorded.</p>
            ) : (
              <div className="space-y-3">
                {appsUsage.map((a) => {
                  const total = appsUsage.reduce((s, r) => s + r.minutes, 0) || 1;
                  const pct = Math.round((a.minutes / total) * 100);
                  return (
                    <div key={a.name} className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground">{a.name}</p>
                          <p className="text-sm text-muted-foreground">{formatMinutes(a.minutes)}</p>
                        </div>
                        <div className="w-full bg-muted/30 h-2 rounded mt-2">
                          <div className="bg-primary h-2 rounded" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
        </TabsContent>

        <TabsContent value="monthly" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-2xl font-bold text-primary">156h</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Days Worked</p>
              <p className="text-2xl font-bold text-foreground">22</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Avg Per Day</p>
              <p className="text-2xl font-bold text-success">7.1h</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Overtime</p>
              <p className="text-2xl font-bold text-warning">12h</p>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-semibold text-foreground mb-4">{getMonthYear(viewDate)}</h3>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => (
                <div key={day} className="text-center p-2">
                  <p className="text-xs font-medium text-muted-foreground">{day}</p>
                </div>
              ))}
              
              {Array.from({ length: getFirstDayOffset(viewDate) }, (_, i) => (
                <div key={`empty-${i}`} className="p-2" />
              ))}
              
              {Array.from({ length: getDaysInMonth(viewDate) }, (_, i) => i + 1).map((day) => {
                const hasData = day <= 22 && day % 7 !== 0 && day % 7 !== 6;
                const hours = hasData ? Math.floor(Math.random() * 4 + 6) : 0;
                return (
                  <div
                    key={day}
                    className={`p-2 text-center rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${
                      hasData ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-muted/30 text-muted-foreground'
                    }`}
                  >
                    <p className="text-sm font-medium">{day}</p>
                    {hasData && <p className="text-xs font-bold">{hours}h</p>}
                  </div>
                );
              })}
            </div>
          </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="font-semibold text-foreground mb-4">Apps & Sites — Monthly</h3>
              <p className="text-sm text-muted-foreground mb-3">Total time: {formatMinutes(appsUsage.reduce((s, a) => s + a.minutes, 0))}</p>
              {appsUsage.length === 0 ? (
                <p className="text-muted-foreground">No usage recorded.</p>
              ) : (
                <div className="space-y-3">
                  {appsUsage.map((a) => {
                    const total = appsUsage.reduce((s, r) => s + r.minutes, 0) || 1;
                    const pct = Math.round((a.minutes / total) * 100);
                    return (
                      <div key={a.name} className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-foreground">{a.name}</p>
                            <p className="text-sm text-muted-foreground">{formatMinutes(a.minutes)}</p>
                          </div>
                          <div className="w-full bg-muted/30 h-2 rounded mt-2">
                            <div className="bg-primary h-2 rounded" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

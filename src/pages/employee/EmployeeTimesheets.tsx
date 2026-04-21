import { useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { TimeEntryStorage } from '@/lib/storage';
import { buildDailyCalendar, buildWeeklyHours, sumEntryMinutes } from '@/lib/analytics';
import { getTrackingLogsByUser, subscribeToTrackingLogChanges, type TrackingLog } from '@/services/trackingLogs';

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const getRangeForTab = (date: Date, tab: string) => {
  const start = new Date(date);
  const end = new Date(date);
  if (tab === 'daily') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (tab === 'weekly') {
    const weekStart = new Date(date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return { start: weekStart, end: weekEnd };
  }
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start: monthStart, end: monthEnd };
};

const formatMinutes = (m: number) => {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h > 0) return `${h}h ${mm}m`;
  return `${mm}m`;
};

export default function EmployeeTimesheets() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('daily');
  const [viewDate, setViewDate] = useState(new Date());
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

  const getFirstDayOffset = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const handlePrev = () => {
    setViewDate((prev) => {
      const newDate = new Date(prev);
      if (activeTab === 'daily') newDate.setDate(newDate.getDate() - 1);
      if (activeTab === 'weekly') newDate.setDate(newDate.getDate() - 7);
      if (activeTab === 'monthly') newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNext = () => {
    setViewDate((prev) => {
      const newDate = new Date(prev);
      if (activeTab === 'daily') newDate.setDate(newDate.getDate() + 1);
      if (activeTab === 'weekly') newDate.setDate(newDate.getDate() + 7);
      if (activeTab === 'monthly') newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const myEntries = useMemo(() => entries.filter((entry) => entry.userId === user?.id), [entries, user]);
  const range = useMemo(() => getRangeForTab(viewDate, activeTab), [viewDate, activeTab]);
  const filteredEntries = useMemo(() => myEntries.filter((entry) => {
    const entryDate = new Date(entry.date);
    return entryDate >= range.start && entryDate <= range.end;
  }), [myEntries, range]);
  const appsUsage = useMemo(() => {
    const grouped = new Map<string, number>();
    logs.forEach((log) => {
      const logDate = new Date(log.timestamp);
      if (logDate < range.start || logDate > range.end) return;
      const key = log.website || log.appName;
      grouped.set(key, (grouped.get(key) || 0) + Math.round(log.duration / 60));
    });

    return Array.from(grouped.entries())
      .map(([name, minutes]) => ({ name, minutes }))
      .sort((left, right) => right.minutes - left.minutes);
  }, [logs, range]);
  const dailyEntries = useMemo(() => {
    const key = viewDate.toISOString().split('T')[0];
    return myEntries.filter((entry) => entry.date === key);
  }, [myEntries, viewDate]);
  const weeklyData = useMemo(() => buildWeeklyHours(myEntries, user?.id), [myEntries, user]);
  const monthlyCalendar = useMemo(() => buildDailyCalendar(myEntries, viewDate, user?.id), [myEntries, viewDate, user]);
  const workedDaysInRange = Math.max(filteredEntries.length > 0 ? new Set(filteredEntries.map((entry) => entry.date)).size : 0, 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Timesheets</h2>
        <p className="text-muted-foreground">View and manage your time entries</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
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

        <TabsContent value="daily" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-2xl font-bold text-primary">{formatMinutes(sumEntryMinutes(dailyEntries))}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Entries</p>
              <p className="text-2xl font-bold text-foreground">{dailyEntries.length}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Active Time</p>
              <p className="text-2xl font-bold text-success">{formatMinutes(sumEntryMinutes(dailyEntries))}</p>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {dailyEntries.length === 0 ? (
                <div className="p-4 text-muted-foreground">No entries recorded for this day.</div>
              ) : dailyEntries.map((entry) => (
                <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[100px]">
                      <p className="text-sm font-medium text-foreground">{entry.startTime} - {entry.endTime}</p>
                    </div>
                    <div className="w-px h-10 bg-border" />
                    <div>
                      <p className="font-medium text-foreground">{entry.taskName}</p>
                      <p className="text-sm text-muted-foreground">{entry.projectName}</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-primary">{formatMinutes(entry.duration)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-semibold text-foreground mb-4">Apps & Sites - Daily</h3>
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
              <p className="text-2xl font-bold text-primary">{formatMinutes(sumEntryMinutes(filteredEntries))}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Days Worked</p>
              <p className="text-2xl font-bold text-foreground">{weeklyData.filter((day) => day.entries > 0).length}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Avg Per Day</p>
              <p className="text-2xl font-bold text-success">{formatMinutes(Math.round(sumEntryMinutes(filteredEntries) / workedDaysInRange))}</p>
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
                      {day.hours > 0 ? `${day.hours}h` : '-'}
                    </p>
                    {day.entries > 0 && <p className="text-xs text-muted-foreground">{day.entries} entries</p>}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-semibold text-foreground mb-4">Apps & Sites - Weekly</h3>
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
              <p className="text-2xl font-bold text-primary">{formatMinutes(sumEntryMinutes(filteredEntries))}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Days Worked</p>
              <p className="text-2xl font-bold text-foreground">{monthlyCalendar.filter((day) => day.hasData).length}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Avg Per Day</p>
              <p className="text-2xl font-bold text-success">{formatMinutes(Math.round(sumEntryMinutes(filteredEntries) / workedDaysInRange))}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Overtime</p>
              <p className="text-2xl font-bold text-warning">{formatMinutes(Math.max(0, sumEntryMinutes(filteredEntries) - (workedDaysInRange * 480)))}</p>
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

              {monthlyCalendar.map((day) => (
                <div
                  key={day.day}
                  className={`p-2 text-center rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${
                    day.hasData ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-muted/30 text-muted-foreground'
                  }`}
                >
                  <p className="text-sm font-medium">{day.day}</p>
                  {day.hasData && <p className="text-xs font-bold">{day.hours}h</p>}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-semibold text-foreground mb-4">Apps & Sites - Monthly</h3>
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

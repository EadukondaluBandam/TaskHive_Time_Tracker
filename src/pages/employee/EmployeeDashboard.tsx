import { useState, useEffect } from 'react';
import { Clock, Calendar, TrendingUp, Timer, Play, Pause, Square } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { ProgressRing } from '@/components/ProgressRing';
import { TimeEntryStorage, ProjectStorage, TaskStorage, DateUtils } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { useTimer } from '@/contexts/TimerContext';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SEO from '@/components/SEO';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { timerState, isRunning, isPaused, elapsedSeconds, pauseTimer, resumeTimer, stopTimer, startTimer } = useTimer();
  const navigate = useNavigate();
  
  const [todayEntries, setTodayEntries] = useState(TimeEntryStorage.getByUserAndDate(user?.id || '', DateUtils.today()));
  const [weeklyData, setWeeklyData] = useState<{ day: string; hours: number }[]>([]);
  const [tasks, setTasks] = useState(TaskStorage.getAll());
  const [projects, setProjects] = useState(ProjectStorage.getAll());

  useEffect(() => {
    if (!user) return;
    
    // Load today's entries
    setTodayEntries(TimeEntryStorage.getByUserAndDate(user.id, DateUtils.today()));
    
    // Load weekly data
    const weekDates = DateUtils.getWeekDates();
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekly = weekDates.map((date, i) => {
      const entries = TimeEntryStorage.getByUserAndDate(user.id, date);
      const totalMinutes = entries.reduce((acc, te) => acc + te.duration, 0);
      return {
        day: days[i],
        hours: Math.round((totalMinutes / 60) * 10) / 10,
      };
    });
    setWeeklyData(weekly);
    
    setTasks(TaskStorage.getAll());
    setProjects(ProjectStorage.getAll());
  }, [user, elapsedSeconds]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalTodayMinutes = todayEntries.reduce((acc, te) => acc + te.duration, 0) + Math.floor(elapsedSeconds / 60);
  const weeklyTotal = weeklyData.reduce((acc, d) => acc + d.hours, 0) + (elapsedSeconds / 3600);
  
  const myTasks = tasks.filter(t => user && t.assignees.includes(user.name));
  const activeTasks = myTasks.filter(t => t.status === 'in-progress');

  const currentProject = timerState && timerState.projectId ? ProjectStorage.getById(timerState.projectId) : null;
  const currentTask = timerState && timerState.taskId ? TaskStorage.getById(timerState.taskId) : null;

  const [quickDesc, setQuickDesc] = useState('');
  const [quickProject, setQuickProject] = useState<string | null>(projects[0]?.id || null);
  const [quickTask, setQuickTask] = useState<string | null>(tasks[0]?.id || null);

  useEffect(() => {
    setQuickProject(projects[0]?.id || null);
    setQuickTask(tasks.find(t => t.projectId === projects[0]?.id)?.id || tasks[0]?.id || null);
  }, [projects, tasks]);

  const handleQuickStart = () => {
    // Manual dashboard start: do not attach project/task here
    startTimer(null, null, quickDesc, true);
    setQuickDesc('');
  };

  return (
    <div className="space-y-6">
      <SEO
        title="TaskHive Employee Dashboard"
        description="View your TaskHive dashboard with tracked hours, active tasks, productivity metrics, and time entries."
        path="/employee/dashboard"
      />
      {/* Active Timer Card */}
      <div className="bg-gradient-to-r from-primary/10 via-card to-card rounded-xl border border-primary/20 p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-xl ${isRunning ? 'bg-primary/20 animate-pulse' : 'bg-muted'}`}>
              <Timer size={28} className={isRunning ? 'text-primary' : 'text-muted-foreground'} />
            </div>
            <div>
              {timerState ? (
                <>
                  {timerState.isManual ? (
                    <>
                      <p className="text-sm text-muted-foreground">Manual Timer Running</p>
                      <h2 className="text-xl font-semibold text-foreground">{timerState.description || 'Untitled'}</h2>
                      <p className="text-sm text-warning">Go to Time Tracker to attach project & task</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">Currently tracking</p>
                      <h2 className="text-xl font-semibold text-foreground">{currentProject?.name || 'Unknown Project'}</h2>
                      <p className="text-sm text-primary">{currentTask?.name || 'Unknown Task'}</p>
                    </>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">No active timer</p>
                  <h2 className="text-xl font-semibold text-foreground">What are you working on?</h2>
                  <div className="mt-3 flex items-center gap-3">
                    <Input
                      placeholder="What are you working on?"
                      value={quickDesc}
                      onChange={(e) => setQuickDesc(e.target.value)}
                      className="bg-muted/30"
                    />
                    <Button
                      variant="success"
                      onClick={handleQuickStart}
                      disabled={isRunning}
                    >
                      START (MANUAL)
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">note</p>
                </>
              )}
            </div>
          </div>

          {timerState && (
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="timer-display text-primary glow-primary px-6 py-3 rounded-xl bg-primary/5 border border-primary/20">
                  {formatTime(elapsedSeconds)}
                </p>
              </div>
              <div className="flex gap-2">
                {isRunning && !isPaused ? (
                  <button
                    onClick={pauseTimer}
                    className="p-3 bg-warning/20 text-warning rounded-lg hover:bg-warning/30 transition-colors"
                    title="Pause timer"
                  >
                    <Pause size={16} />
                  </button>
                ) : timerState && isPaused ? (
                  <button
                    onClick={resumeTimer}
                    className="p-3 bg-success/20 text-success rounded-lg hover:bg-success/30 transition-colors"
                    title="Resume timer"
                  >
                    <Play size={16} />
                  </button>
                ) : null}
                <button 
                  onClick={stopTimer}
                  className="p-3 bg-destructive/20 text-destructive rounded-lg hover:bg-destructive/30 transition-colors"
                  title="Stop timer"
                >
                  <Square size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Total"
          value={`${Math.floor(totalTodayMinutes / 60)}h ${totalTodayMinutes % 60}m`}
          icon={Clock}
          variant="primary"
        />
        <StatCard
          title="This Week"
          value={`${weeklyTotal.toFixed(1)}h`}
          subtitle="of 40h target"
          icon={Calendar}
          variant="success"
        />
        <StatCard
          title="Productivity"
          value="88%"
          icon={TrendingUp}
          variant="warning"
          trend={{ value: 3, isPositive: true }}
        />
        <StatCard
          title="Active Tasks"
          value={activeTasks.length}
          icon={Timer}
          variant="default"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Hours */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">This Week's Hours</h3>
          <ResponsiveContainer width="100%" height={260}>
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
              />
              <Bar dataKey="hours" fill="hsl(199, 89%, 48%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Breakdown */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Today's Breakdown</h3>
          <div className="flex flex-col items-center">
            <ProgressRing value={88} size={140} strokeWidth={10} label="Efficiency" />
            <div className="mt-6 w-full space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span className="text-sm text-muted-foreground">Active</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {Math.floor(totalTodayMinutes * 0.88 / 60)}h {Math.floor(totalTodayMinutes * 0.88 % 60)}m
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <span className="text-sm text-muted-foreground">Idle</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {Math.floor(totalTodayMinutes * 0.08 / 60)}h {Math.floor(totalTodayMinutes * 0.08 % 60)}m
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Away</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {Math.floor(totalTodayMinutes * 0.04 / 60)}h {Math.floor(totalTodayMinutes * 0.04 % 60)}m
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Time Entries */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Recent Time Entries</h3>
          <span className="text-sm text-muted-foreground">Today</span>
        </div>
        <div className="divide-y divide-border">
          {todayEntries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No time entries for today yet. Start tracking!
            </div>
          ) : (
            todayEntries.slice(0, 4).map((entry) => (
              <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{entry.taskName}</p>
                    <p className="text-sm text-muted-foreground">{entry.projectName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">
                    {Math.floor(entry.duration / 60)}h {entry.duration % 60}m
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.startTime} - {entry.endTime}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

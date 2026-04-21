import { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, Coffee } from 'lucide-react';
import { ProjectStorage, TaskStorage, TimeEntryStorage, DateUtils } from '@/lib/storage';
import { Project, Task } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { useTimer } from '@/contexts/TimerContext';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function EmployeeTimer() {
  const { user } = useAuth();
  const { 
    timerState, 
    isRunning, 
    isPaused, 
    isBreak,
    elapsedSeconds, 
    startTimer, 
    pauseTimer, 
    resumeTimer, 
    stopTimer,
    startBreak,
    endBreak,
  } = useTimer();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [description, setDescription] = useState('');
  const [todayEntries, setTodayEntries] = useState(TimeEntryStorage.getByUserAndDate(user?.id || '', DateUtils.today()));

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (timerState) {
      setSelectedProject(timerState.projectId ?? '');
      setSelectedTask(timerState.taskId ?? '');
      setDescription(timerState.description);
    }
  }, [timerState]);

  useEffect(() => {
    // Refresh entries after timer stops
    if (user && !timerState) {
      setTodayEntries(TimeEntryStorage.getByUserAndDate(user.id, DateUtils.today()));
    }
  }, [timerState, user]);

  const loadData = () => {
    const allProjects = ProjectStorage.getAll().filter(p => p.status === 'active');
    setProjects(allProjects);
    
    // Get tasks assigned to current user
    const allTasks = TaskStorage.getAll();
    const myTasks = allTasks.filter(t => user && t.assignees.includes(user.name));
    setTasks(myTasks.length > 0 ? myTasks : allTasks);
  };

  const projectTasks = tasks.filter((t) => t.projectId === selectedProject);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // For the Time Tracker UI we only consider timers that are not manual dashboard timers
  const showTrackerControls = !!timerState && !timerState.isManual;
  const trackerRunning = showTrackerControls && isRunning;
  const trackerPaused = showTrackerControls && isPaused;
  const trackerBreak = showTrackerControls && isBreak;

  const handleStart = () => {
    if (!selectedProject || !selectedTask) {
      return;
    }
    // Starting from Time Tracker should attach to existing manual timer if present
    startTimer(selectedProject, selectedTask, description);
  };

  const handleStop = () => {
    stopTimer();
    setDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Time Tracker</h2>
        <p className="text-muted-foreground">Track time on your projects and tasks</p>
      </div>

      {/* Timer Card */}
      <div className="bg-card rounded-xl border border-border p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Project/Task Selection */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Project</Label>
              <Select 
                value={selectedProject} 
                onValueChange={(v) => {
                  setSelectedProject(v);
                  setSelectedTask('');
                }}
                disabled={trackerRunning || trackerPaused}
              >
                <SelectTrigger className="h-12 bg-muted/30">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Task</Label>
              <Select 
                value={selectedTask} 
                onValueChange={setSelectedTask}
                disabled={(trackerRunning || trackerPaused) || !selectedProject}
              >
                <SelectTrigger className="h-12 bg-muted/30">
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  {projectTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="What are you working on?"
                className="bg-muted/30 resize-none"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={trackerRunning || trackerPaused}
              />
            </div>
          </div>

          {/* Timer Display */}
          <div className="flex flex-col items-center justify-center">
            <div className={`p-8 rounded-2xl transition-all duration-300 ${
              trackerBreak 
                ? 'bg-warning/10 border-2 border-warning/30'
                : trackerRunning 
                  ? 'bg-primary/10 glow-primary' 
                  : trackerPaused 
                    ? 'bg-warning/10' 
                    : 'bg-muted/30'
            }`}>
              <p className="timer-display text-5xl text-foreground">
                {formatTime(elapsedSeconds)}
              </p>
              {isBreak && (
                <p className="text-center text-warning mt-2 text-sm font-medium flex items-center justify-center gap-2"><Coffee size={14} />On Break</p>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {!showTrackerControls ? (
                <Button
                  size="xl"
                  variant="success"
                  onClick={handleStart}
                  className="gap-2"
                  disabled={!selectedProject || !selectedTask}
                >
                  <Play size={20} />
                  Start
                </Button>
              ) : trackerBreak ? (
                <Button
                  size="xl"
                  variant="success"
                  onClick={endBreak}
                  className="gap-2"
                >
                  <Play size={20} />
                  End Break
                </Button>
              ) : trackerPaused ? (
                <>
                  <Button
                    size="xl"
                    variant="success"
                    onClick={resumeTimer}
                    className="gap-2"
                  >
                    <Play size={20} />
                    Resume
                  </Button>
                  <Button
                    size="xl"
                    variant="warning"
                    onClick={startBreak}
                    className="gap-2"
                  >
                    <Coffee size={20} />
                    Break
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="xl"
                    variant="warning"
                    onClick={pauseTimer}
                    className="gap-2"
                  >
                    <Pause size={20} />
                    Pause
                  </Button>
                  <Button
                    size="xl"
                    variant="outline"
                    onClick={startBreak}
                    className="gap-2"
                  >
                    <Coffee size={20} />
                    Break
                  </Button>
                </>
              )}
              {showTrackerControls && (
                <Button
                  size="xl"
                  variant="destructive"
                  onClick={handleStop}
                  className="gap-2"
                >
                  <Square size={20} />
                  Stop
                </Button>
              )}
            </div>

            {trackerRunning && (
              <p className="mt-4 text-sm text-primary flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Timer is running
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Entries (View Only) */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Today's Entries</h3>
        </div>
        <div className="divide-y divide-border">
          {todayEntries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No time entries for today yet
            </div>
          ) : (
            todayEntries.map((entry) => (
              <div
                key={entry.id}
                className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
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

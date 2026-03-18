import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { TimerStorage, TimeEntryStorage, TimerState, ProjectStorage, TaskStorage } from '@/lib/storage';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface TimerContextType {
  timerState: TimerState | null;
  isRunning: boolean;
  isPaused: boolean;
  isBreak: boolean;
  elapsedSeconds: number;
  startTimer: (projectId?: string | null, taskId?: string | null, description?: string, manual?: boolean) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  startBreak: () => void;
  endBreak: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const loadTimerState = useCallback(() => {
    if (!user) {
      setTimerState(null);
      setElapsedSeconds(0);
      return;
    }

    const savedState = TimerStorage.get(user.id);
    if (savedState) {
      if (savedState.isRunning && !savedState.isPaused) {
        const startTime = new Date(savedState.startTime).getTime();
        const now = Date.now();
        savedState.elapsedSeconds = Math.max(savedState.elapsedSeconds, Math.floor((now - startTime) / 1000));
      }

      setTimerState(savedState);
      setElapsedSeconds(savedState.elapsedSeconds);
      return;
    }

    setTimerState(null);
    setElapsedSeconds(0);
  }, [user]);

  // Load timer state on mount
  useEffect(() => {
    loadTimerState();
  }, [loadTimerState]);

  useEffect(() => {
    const handleTimerSync = () => loadTimerState();
    window.addEventListener('storage', handleTimerSync);
    window.addEventListener('taskhive:timer-sync', handleTimerSync as EventListener);
    return () => {
      window.removeEventListener('storage', handleTimerSync);
      window.removeEventListener('taskhive:timer-sync', handleTimerSync as EventListener);
    };
  }, [loadTimerState]);

  // Timer tick
  useEffect(() => {
    if (!timerState?.isRunning || timerState?.isPaused) return;

    const interval = setInterval(() => {
      setElapsedSeconds(prev => {
        const newValue = prev + 1;
        // Save state periodically (every 10 seconds)
        if (newValue % 10 === 0 && user && timerState) {
          TimerStorage.save({
            ...timerState,
            elapsedSeconds: newValue,
          });
        }
        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerState?.isRunning, timerState?.isPaused, user, timerState]);

  const startTimer = useCallback((projectId?: string | null, taskId?: string | null, description = '', manual = false) => {
    if (!user) return;

    // If a manual timer is already running and user starts with project/task from Time Tracker,
    // attach project/task to existing timer and continue counting (and mark as not manual).
    if (timerState && timerState.isRunning && timerState.isManual && projectId && taskId) {
      const updated: TimerState = {
        ...timerState,
        projectId,
        taskId,
        description: description || timerState.description,
        isManual: false,
      };
      setTimerState(updated);
      TimerStorage.save({ ...updated });
      toast.success('Timer Attached', { description: 'Timer continued under selected task' });
      return;
    }

    const newState: TimerState = {
      userId: user.id,
      projectId: projectId ?? null,
      taskId: taskId ?? null,
      startTime: new Date().toISOString(),
      elapsedSeconds: 0,
      isRunning: true,
      isPaused: false,
      isBreak: false,
      description,
      isManual: manual,
    };

    setTimerState(newState);
    setElapsedSeconds(0);
    TimerStorage.save(newState);
    
    toast.success('Timer Started', {
      description: 'Time tracking has begun',
    });
  }, [user, timerState]);

  const pauseTimer = useCallback(() => {
    if (!timerState || !user) return;

    const updatedState = {
      ...timerState,
      isPaused: true,
      elapsedSeconds,
    };

    setTimerState(updatedState);
    TimerStorage.save(updatedState);
    
    toast.info('Timer Paused');
  }, [timerState, user, elapsedSeconds]);

  const resumeTimer = useCallback(() => {
    if (!timerState || !user) return;

    const updatedState = {
      ...timerState,
      isPaused: false,
    };

    setTimerState(updatedState);
    TimerStorage.save(updatedState);
    
    toast.success('Timer Resumed');
  }, [timerState, user]);

  const stopTimer = useCallback(() => {
    if (!timerState || !user) return;

    // Create time entry
    const project = timerState.projectId ? ProjectStorage.getById(timerState.projectId) : undefined;
    const task = timerState.taskId ? TaskStorage.getById(timerState.taskId) : undefined;
    
    const duration = Math.floor(elapsedSeconds / 60); // Convert to minutes
    if (duration > 0) {
      TimeEntryStorage.create({
        userId: user.id,
        userName: user.name,
        projectId: timerState.projectId ?? '',
        projectName: project?.name || 'Unknown',
        taskId: timerState.taskId ?? '',
        taskName: task?.name || 'Unknown',
        startTime: new Date(timerState.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        endTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        duration,
        description: timerState.description,
        date: new Date().toISOString().split('T')[0],
      });

      toast.success('Time Entry Saved', {
        description: `Logged ${Math.floor(duration / 60)}h ${duration % 60}m`,
      });
    }

    TimerStorage.clear(user.id);
    setTimerState(null);
    setElapsedSeconds(0);
  }, [timerState, user, elapsedSeconds]);

  const startBreak = useCallback(() => {
    if (!timerState || !user) return;

    const updatedState = {
      ...timerState,
      isBreak: true,
      isPaused: true,
      elapsedSeconds,
    };

    setTimerState(updatedState);
    TimerStorage.save(updatedState);
    
    toast.info('Break Started', {
      description: 'Timer paused for break',
    });
  }, [timerState, user, elapsedSeconds]);

  const endBreak = useCallback(() => {
    if (!timerState || !user) return;

    const updatedState = {
      ...timerState,
      isBreak: false,
      isPaused: false,
    };

    setTimerState(updatedState);
    TimerStorage.save(updatedState);
    
    toast.success('Break Ended', {
      description: 'Timer resumed',
    });
  }, [timerState, user]);

  return (
    <TimerContext.Provider value={{
      timerState,
      isRunning: timerState?.isRunning ?? false,
      isPaused: timerState?.isPaused ?? false,
      isBreak: timerState?.isBreak ?? false,
      elapsedSeconds,
      startTimer,
      pauseTimer,
      resumeTimer,
      stopTimer,
      startBreak,
      endBreak,
    }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}

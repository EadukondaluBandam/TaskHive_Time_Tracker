// Comprehensive localStorage service for TaskHive

import { User, Project, Task, TimeEntry, Activity } from './types';

const LEGACY_MOCK_USER_IDS = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
const LEGACY_MOCK_USER_EMAILS = new Set([
  'arjun.sharma@blackroth.com',
  'priya.patel@blackroth.com',
  'ramesh.kumar@blackroth.com',
  'ananya.reddy@blackroth.com',
  'karthik.nair@blackroth.com',
  'kavya.iyer@blackroth.com',
  'rohit.gupta@blackroth.com',
  'lakshmi.menon@blackroth.com',
  'suresh.venkat@blackroth.com',
  'mahesh.krishnan@blackroth.com',
]);
const LEGACY_MOCK_USER_NAMES = new Set([
  'Arjun Sharma',
  'Priya Patel',
  'Ramesh Kumar',
  'Ananya Reddy',
  'Karthik Nair',
  'Kavya Iyer',
  'Rohit Gupta',
  'Lakshmi Menon',
  'Suresh Venkat',
  'Mahesh Krishnan',
]);
const LEGACY_MOCK_PROJECT_IDS = new Set(['p1', 'p2', 'p3', 'p4', 'p5']);
const LEGACY_MOCK_PROJECT_NAMES = new Set([
  'Bharat Banking Portal',
  'Ayurveda Health App',
  'Kisan Mitra Platform',
  'Smart City Dashboard',
  'Desi Commerce Platform',
]);
const LEGACY_MOCK_TASK_IDS = new Set(['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8']);
const LEGACY_MOCK_TASK_NAMES = new Set([
  'UPI Integration Module',
  'User Authentication Flow',
  'Dosha Assessment Quiz',
  'Crop Price Prediction API',
  'Weather Integration',
  'Traffic Analytics Module',
  'Vendor Onboarding Portal',
  'Multi-language Support',
]);
const DEMO_SYSTEM_USER_IDS = new Set(['demo-admin', 'demo-employee', 'taskhive-superadmin']);

// Storage Keys
const KEYS = {
  USERS: 'taskhive_users',
  PROJECTS: 'taskhive_projects',
  TASKS: 'taskhive_tasks',
  TIME_ENTRIES: 'taskhive_time_entries',
  ACTIVITIES: 'taskhive_activities',
  NOTIFICATIONS: 'taskhive_notifications',
  SESSION: 'taskhive_session',
  USER: 'taskhive_user',
  TIMER_STATE: 'taskhive_timer_state',
  THEME: 'taskhive_theme',
  SETTINGS: 'taskhive_settings',
} as const;

// Types
export interface Notification {
  id: string;
  userId: string;
  type: 'login' | 'logout' | 'task_assigned' | 'project_assigned' | 'overtime' | 'warning' | 'admin_update' | 'auto_logout';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface Session {
  userId: string;
  loginTime: string;
  lastActivity: string;
  isActive: boolean;
}

export interface TimerState {
  userId: string;
  projectId?: string | null;
  taskId?: string | null;
  startTime: string;
  elapsedSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  isBreak: boolean;
  description: string;
  isManual?: boolean;
}

export interface UserSettings {
  userId: string;
  theme: 'light' | 'dark';
  emailNotifications: boolean;
  activityTracking: boolean;
  screenshotCapture: boolean;
  idleDetection: boolean;
}

// Helper functions
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}



function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function normalizeStoredUsers(users: User[]): User[] {
  let changed = false;

  const normalized = users.map((user) => {
    if (typeof user.password === 'string' && user.password.length >= 4) {
      return user;
    }

    changed = true;

    return {
      ...user,
      password: user.role === 'superadmin'
        ? 'Taskhiveadmin@2026'
        : user.role === 'admin'
        ? 'admin123'
        : 'employee123',
    };
  });

  if (changed) {
    setItem(KEYS.USERS, normalized);
  }

  return normalized;
}

function cleanupLegacyMockData(): void {
  const users = getItem<User[]>(KEYS.USERS, []);
  const cleanedUsers = users.filter((user) => (
    !LEGACY_MOCK_USER_IDS.has(user.id) &&
    !LEGACY_MOCK_USER_EMAILS.has(user.email.toLowerCase()) &&
    user.companyName !== 'Blackroth Group'
  ));
  if (cleanedUsers.length !== users.length) {
    setItem(KEYS.USERS, cleanedUsers);
  }

  const projects = getItem<Project[]>(KEYS.PROJECTS, []);
  const cleanedProjects = projects.filter((project) => (
    !LEGACY_MOCK_PROJECT_IDS.has(project.id) &&
    !LEGACY_MOCK_PROJECT_NAMES.has(project.name)
  ));
  if (cleanedProjects.length !== projects.length) {
    setItem(KEYS.PROJECTS, cleanedProjects);
  }

  const tasks = getItem<Task[]>(KEYS.TASKS, []);
  const cleanedTasks = tasks.filter((task) => (
    !LEGACY_MOCK_TASK_IDS.has(task.id) &&
    !LEGACY_MOCK_TASK_NAMES.has(task.name) &&
    !LEGACY_MOCK_PROJECT_NAMES.has(task.projectName)
  ));
  if (cleanedTasks.length !== tasks.length) {
    setItem(KEYS.TASKS, cleanedTasks);
  }

  const timeEntries = getItem<TimeEntry[]>(KEYS.TIME_ENTRIES, []);
  const cleanedTimeEntries = timeEntries.filter((entry) => (
    !LEGACY_MOCK_USER_IDS.has(entry.userId) &&
    !LEGACY_MOCK_USER_NAMES.has(entry.userName) &&
    !LEGACY_MOCK_PROJECT_IDS.has(entry.projectId) &&
    !LEGACY_MOCK_PROJECT_NAMES.has(entry.projectName) &&
    !LEGACY_MOCK_TASK_IDS.has(entry.taskId) &&
    !LEGACY_MOCK_TASK_NAMES.has(entry.taskName)
  ));
  if (cleanedTimeEntries.length !== timeEntries.length) {
    setItem(KEYS.TIME_ENTRIES, cleanedTimeEntries);
  }

  const activities = getItem<Activity[]>(KEYS.ACTIVITIES, []);
  const cleanedActivities = activities.filter((activity) => (
    !LEGACY_MOCK_USER_IDS.has(activity.userId) &&
    !LEGACY_MOCK_USER_NAMES.has(activity.userName) &&
    !activity.timestamp.startsWith('2024-01-22')
  ));
  if (cleanedActivities.length !== activities.length) {
    setItem(KEYS.ACTIVITIES, cleanedActivities);
  }
}

function cleanupOrphanedTrackedData(): void {
  const users = getItem<User[]>(KEYS.USERS, []);
  const projects = getItem<Project[]>(KEYS.PROJECTS, []);
  const tasks = getItem<Task[]>(KEYS.TASKS, []);
  const validUserIds = new Set([...users.map((user) => user.id), ...DEMO_SYSTEM_USER_IDS]);
  const validProjectIds = new Set(projects.map((project) => project.id));
  const validTaskIds = new Set(tasks.map((task) => task.id));

  const timeEntries = getItem<TimeEntry[]>(KEYS.TIME_ENTRIES, []);
  const cleanedTimeEntries = timeEntries.filter((entry) => {
    const hasValidUser = validUserIds.has(entry.userId);
    const hasValidProject = !entry.projectId || validProjectIds.has(entry.projectId);
    const hasValidTask = !entry.taskId || validTaskIds.has(entry.taskId);
    return hasValidUser && hasValidProject && hasValidTask;
  });

  if (cleanedTimeEntries.length !== timeEntries.length) {
    setItem(KEYS.TIME_ENTRIES, cleanedTimeEntries);
  }

  const activities = getItem<Activity[]>(KEYS.ACTIVITIES, []);
  const cleanedActivities = activities.filter((activity) => validUserIds.has(activity.userId));
  if (cleanedActivities.length !== activities.length) {
    setItem(KEYS.ACTIVITIES, cleanedActivities);
  }
}

// Initialize storage with empty collections if keys are missing
export function initializeStorage(): void {
  if (!localStorage.getItem(KEYS.USERS)) {
    setItem(KEYS.USERS, []);
  }
  if (!localStorage.getItem(KEYS.PROJECTS)) {
    setItem(KEYS.PROJECTS, []);
  }
  if (!localStorage.getItem(KEYS.TASKS)) {
    setItem(KEYS.TASKS, []);
  }
  if (!localStorage.getItem(KEYS.TIME_ENTRIES)) {
    setItem(KEYS.TIME_ENTRIES, []);
  }
  if (!localStorage.getItem(KEYS.ACTIVITIES)) {
    setItem(KEYS.ACTIVITIES, []);
  }
  if (!localStorage.getItem(KEYS.NOTIFICATIONS)) {
    setItem(KEYS.NOTIFICATIONS, []);
  }

  cleanupLegacyMockData();
  cleanupOrphanedTrackedData();

  const storedUsers = getItem<User[]>(KEYS.USERS, []);
  if (storedUsers.length > 0) {
    normalizeStoredUsers(storedUsers);
  }
}

// ============ USERS ============
export const UserStorage = {
  getAll: (): User[] => normalizeStoredUsers(getItem(KEYS.USERS, [])),
  
  getById: (id: string): User | undefined => {
    return UserStorage.getAll().find(u => u.id === id);
  },
  
  getByEmail: (email: string): User | undefined => {
    return UserStorage.getAll().find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  
  create: (user: Omit<User, 'id'>): User => {
    const users = UserStorage.getAll();
    const newUser: User = {
      ...user,
      id: generateId(),
    };
    users.push(newUser);
    setItem(KEYS.USERS, users);
    return newUser;
  },
  
  update: (id: string, updates: Partial<User>): User | undefined => {
    const users = UserStorage.getAll();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return undefined;
    users[index] = { ...users[index], ...updates };
    setItem(KEYS.USERS, users);
    return users[index];
  },
  
  delete: (id: string): boolean => {
    const users = UserStorage.getAll();
    const filtered = users.filter(u => u.id !== id);
    if (filtered.length === users.length) return false;
    setItem(KEYS.USERS, filtered);
    return true;
  },
  
  toggleStatus: (id: string): User | undefined => {
    const user = UserStorage.getById(id);
    if (!user) return undefined;
    return UserStorage.update(id, { 
      status: user.status === 'active' ? 'inactive' : 'active' 
    });
  },
};

// ============ PROJECTS ============
export const ProjectStorage = {
  getAll: (): Project[] => getItem(KEYS.PROJECTS, []),
  
  getById: (id: string): Project | undefined => {
    return ProjectStorage.getAll().find(p => p.id === id);
  },
  
  create: (project: Omit<Project, 'id'>): Project => {
    const projects = ProjectStorage.getAll();
    const newProject: Project = {
      ...project,
      id: 'p' + generateId(),
    };
    projects.push(newProject);
    setItem(KEYS.PROJECTS, projects);
    return newProject;
  },
  
  update: (id: string, updates: Partial<Project>): Project | undefined => {
    const projects = ProjectStorage.getAll();
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    projects[index] = { ...projects[index], ...updates };
    setItem(KEYS.PROJECTS, projects);
    return projects[index];
  },
  
  delete: (id: string): boolean => {
    const projects = ProjectStorage.getAll();
    const filtered = projects.filter(p => p.id !== id);
    if (filtered.length === projects.length) return false;
    setItem(KEYS.PROJECTS, filtered);
    return true;
  },
  
  assignMembers: (projectId: string, memberIds: string[]): Project | undefined => {
    return ProjectStorage.update(projectId, { team: memberIds });
  },
};

// ============ TASKS ============
export const TaskStorage = {
  getAll: (): Task[] => getItem(KEYS.TASKS, []),
  
  getById: (id: string): Task | undefined => {
    return TaskStorage.getAll().find(t => t.id === id);
  },
  
  getByProject: (projectId: string): Task[] => {
    return TaskStorage.getAll().filter(t => t.projectId === projectId);
  },
  
  getByUser: (userName: string): Task[] => {
    return TaskStorage.getAll().filter(t => t.assignees.includes(userName));
  },
  
  create: (task: Omit<Task, 'id'>): Task => {
    const tasks = TaskStorage.getAll();
    const newTask: Task = {
      ...task,
      id: 't' + generateId(),
    };
    tasks.push(newTask);
    setItem(KEYS.TASKS, tasks);
    return newTask;
  },
  
  update: (id: string, updates: Partial<Task>): Task | undefined => {
    const tasks = TaskStorage.getAll();
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return undefined;
    tasks[index] = { ...tasks[index], ...updates };
    setItem(KEYS.TASKS, tasks);
    return tasks[index];
  },
  
  delete: (id: string): boolean => {
    const tasks = TaskStorage.getAll();
    const filtered = tasks.filter(t => t.id !== id);
    if (filtered.length === tasks.length) return false;
    setItem(KEYS.TASKS, filtered);
    return true;
  },
  
  updateStatus: (id: string, status: Task['status']): Task | undefined => {
    return TaskStorage.update(id, { status });
  },
};

// ============ TIME ENTRIES ============
export const TimeEntryStorage = {
  getAll: (): TimeEntry[] => getItem(KEYS.TIME_ENTRIES, []),
  
  getByUser: (userId: string): TimeEntry[] => {
    return TimeEntryStorage.getAll().filter(te => te.userId === userId);
  },
  
  getByDate: (date: string): TimeEntry[] => {
    return TimeEntryStorage.getAll().filter(te => te.date === date);
  },
  
  getByUserAndDate: (userId: string, date: string): TimeEntry[] => {
    return TimeEntryStorage.getAll().filter(te => te.userId === userId && te.date === date);
  },
  
  getByDateRange: (userId: string, startDate: string, endDate: string): TimeEntry[] => {
    return TimeEntryStorage.getAll().filter(te => 
      te.userId === userId && 
      te.date >= startDate && 
      te.date <= endDate
    );
  },
  
  create: (entry: Omit<TimeEntry, 'id'>): TimeEntry => {
    const entries = TimeEntryStorage.getAll();
    const newEntry: TimeEntry = {
      ...entry,
      id: 'te' + generateId(),
    };
    entries.push(newEntry);
    setItem(KEYS.TIME_ENTRIES, entries);
    return newEntry;
  },
  
  update: (id: string, updates: Partial<TimeEntry>): TimeEntry | undefined => {
    const entries = TimeEntryStorage.getAll();
    const index = entries.findIndex(e => e.id === id);
    if (index === -1) return undefined;
    entries[index] = { ...entries[index], ...updates };
    setItem(KEYS.TIME_ENTRIES, entries);
    return entries[index];
  },
  
  delete: (id: string): boolean => {
    const entries = TimeEntryStorage.getAll();
    const filtered = entries.filter(e => e.id !== id);
    if (filtered.length === entries.length) return false;
    setItem(KEYS.TIME_ENTRIES, filtered);
    return true;
  },
  
  getTotalMinutesByUserAndDate: (userId: string, date: string): number => {
    return TimeEntryStorage.getByUserAndDate(userId, date)
      .reduce((acc, te) => acc + te.duration, 0);
  },
};

// ============ ACTIVITIES ============
export const ActivityStorage = {
  getAll: (): Activity[] => getItem(KEYS.ACTIVITIES, []),
  
  getByUser: (userId: string): Activity[] => {
    return ActivityStorage.getAll().filter(a => a.userId === userId);
  },
  
  create: (activity: Omit<Activity, 'id'>): Activity => {
    const activities = ActivityStorage.getAll();
    const newActivity: Activity = {
      ...activity,
      id: 'a' + generateId(),
    };
    activities.push(newActivity);
    setItem(KEYS.ACTIVITIES, activities);
    return newActivity;
  },
  
  logActivity: (userId: string, userName: string, type: Activity['type'], name: string, duration: number, category: Activity['category']): Activity => {
    return ActivityStorage.create({
      userId,
      userName,
      type,
      name,
      duration,
      timestamp: new Date().toISOString(),
      category,
    });
  },
};

// ============ NOTIFICATIONS ============
export const NotificationStorage = {
  getAll: (): Notification[] => getItem(KEYS.NOTIFICATIONS, []),
  
  getByUser: (userId: string): Notification[] => {
    return NotificationStorage.getAll()
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
  
  getUnreadCount: (userId: string): number => {
    return NotificationStorage.getByUser(userId).filter(n => !n.read).length;
  },
  
  create: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Notification => {
    const notifications = NotificationStorage.getAll();
    const newNotification: Notification = {
      ...notification,
      id: 'n' + generateId(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    notifications.push(newNotification);
    setItem(KEYS.NOTIFICATIONS, notifications);
    return newNotification;
  },
  
  markAsRead: (id: string): void => {
    const notifications = NotificationStorage.getAll();
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications[index].read = true;
      setItem(KEYS.NOTIFICATIONS, notifications);
    }
  },
  
  markAllAsRead: (userId: string): void => {
    const notifications = NotificationStorage.getAll();
    notifications.forEach(n => {
      if (n.userId === userId) n.read = true;
    });
    setItem(KEYS.NOTIFICATIONS, notifications);
  },
  
  delete: (id: string): void => {
    const notifications = NotificationStorage.getAll().filter(n => n.id !== id);
    setItem(KEYS.NOTIFICATIONS, notifications);
  },
  
  // Helper to create common notifications
  notifyLogin: (userId: string): void => {
    NotificationStorage.create({
      userId,
      type: 'login',
      title: 'Session Started',
      message: `You logged in at ${new Date().toLocaleTimeString('en-IN')}`,
    });
  },
  
  notifyLogout: (userId: string, reason?: string): void => {
    NotificationStorage.create({
      userId,
      type: 'logout',
      title: 'Session Ended',
      message: reason || `You logged out at ${new Date().toLocaleTimeString('en-IN')}`,
    });
  },
  
  notifyTaskAssigned: (userId: string, taskName: string, projectName: string): void => {
    NotificationStorage.create({
      userId,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `You have been assigned to "${taskName}" in project "${projectName}"`,
    });
  },
  
  notifyProjectAssigned: (userId: string, projectName: string): void => {
    NotificationStorage.create({
      userId,
      type: 'project_assigned',
      title: 'Added to Project',
      message: `You have been added to project "${projectName}"`,
    });
  },
  
  notifyOvertime: (userId: string, hours: number): void => {
    NotificationStorage.create({
      userId,
      type: 'overtime',
      title: 'Overtime Alert',
      message: `You have worked ${hours} hours today. Consider taking a break.`,
    });
  },
  
  notifyAutoLogoutWarning: (userId: string): void => {
    NotificationStorage.create({
      userId,
      type: 'warning',
      title: 'Auto-Logout Warning',
      message: 'Your session will auto-logout in 20 minutes. Save your work.',
    });
  },
  
  notifyAutoLogout: (userId: string, adminId?: string): void => {
    NotificationStorage.create({
      userId,
      type: 'auto_logout',
      title: 'Auto-Logged Out',
      message: 'Your session was auto-logged out after 10 hours. Remaining time marked as Pending Approval.',
    });
    // Also notify admin
    if (adminId) {
      const user = UserStorage.getById(userId);
      NotificationStorage.create({
        userId: adminId,
        type: 'admin_update',
        title: 'Employee Auto-Logout',
        message: `${user?.name || 'Employee'} was auto-logged out. Time marked as Pending Approval.`,
      });
    }
  },
};

// ============ SESSION ============
export const SessionStorage = {
  get: (): Session | null => {
    return getItem(KEYS.SESSION, null);
  },
  
  create: (userId: string): Session => {
    const session: Session = {
      userId,
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      isActive: true,
    };
    setItem(KEYS.SESSION, session);
    return session;
  },
  
  updateActivity: (): void => {
    const session = SessionStorage.get();
    if (session) {
      session.lastActivity = new Date().toISOString();
      setItem(KEYS.SESSION, session);
    }
  },
  
  end: (): void => {
    localStorage.removeItem(KEYS.SESSION);
  },
  
  getElapsedHours: (): number => {
    const session = SessionStorage.get();
    if (!session) return 0;
    const loginTime = new Date(session.loginTime).getTime();
    const now = Date.now();
    return (now - loginTime) / (1000 * 60 * 60);
  },
  
  shouldAutoLogout: (): boolean => {
    return SessionStorage.getElapsedHours() >= 10;
  },
  
  shouldShowWarning: (): boolean => {
    const hours = SessionStorage.getElapsedHours();
    return hours >= 9.67 && hours < 10; // 9h 40m
  },
};

// ============ TIMER STATE ============
export const TimerStorage = {
  get: (userId: string): TimerState | null => {
    const states = getItem<Record<string, TimerState>>(KEYS.TIMER_STATE, {});
    return states[userId] || null;
  },
  
  save: (state: TimerState): void => {
    const states = getItem<Record<string, TimerState>>(KEYS.TIMER_STATE, {});
    states[state.userId] = state;
    setItem(KEYS.TIMER_STATE, states);
  },
  
  clear: (userId: string): void => {
    const states = getItem<Record<string, TimerState>>(KEYS.TIMER_STATE, {});
    delete states[userId];
    setItem(KEYS.TIMER_STATE, states);
  },
  
  getAllActive: (): TimerState[] => {
    const states = getItem<Record<string, TimerState>>(KEYS.TIMER_STATE, {});
    return Object.values(states).filter(s => s.isRunning);
  },
};

// ============ SETTINGS ============
export const SettingsStorage = {
  get: (userId: string): UserSettings => {
    const settings = getItem<Record<string, UserSettings>>(KEYS.SETTINGS, {});
    return settings[userId] || {
      userId,
      theme: 'dark',
      emailNotifications: true,
      activityTracking: true,
      screenshotCapture: true,
      idleDetection: true,
    };
  },
  
  save: (settings: UserSettings): void => {
    const allSettings = getItem<Record<string, UserSettings>>(KEYS.SETTINGS, {});
    allSettings[settings.userId] = settings;
    setItem(KEYS.SETTINGS, allSettings);
  },
  
  getTheme: (): 'light' | 'dark' => {
    return getItem(KEYS.THEME, 'dark') as 'light' | 'dark';
  },
  
  setTheme: (theme: 'light' | 'dark'): void => {
    setItem(KEYS.THEME, theme);
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
};

// ============ EXPORT UTILITIES ============
export const ExportUtils = {
  toCSV: (data: Record<string, unknown>[], filename: string): void => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  },
  
  toJSON: (data: unknown, filename: string): void => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  },
};

// Date utilities
export const DateUtils = {
  today: (): string => new Date().toISOString().split('T')[0],
  
  getWeekDates: (): string[] => {
    const dates: string[] = [];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  },
  
  getMonthDates: (): string[] => {
    const dates: string[] = [];
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(new Date(year, month, i).toISOString().split('T')[0]);
    }
    return dates;
  },
  
  formatDate: (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },
  
  formatTime: (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  },
};

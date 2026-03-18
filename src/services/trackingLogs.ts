import { ActivityStorage } from '@/lib/storage';

export interface TrackingLog {
  id: string | number;
  userId?: string;
  userName?: string;
  email: string;
  appName: string;
  windowTitle: string;
  website?: string | null;
  timestamp: string;
  duration: number;
}

function normalizeEmail(email: string) {
  return String(email || '').trim().toLowerCase();
}

function readRendererTrackingLogs(): TrackingLog[] {
  try {
    const items = JSON.parse(localStorage.getItem('taskhive_tracking_logs') || '[]');
    if (!Array.isArray(items)) return [];
    return items;
  } catch {
    return [];
  }
}

function fallbackLogs(): TrackingLog[] {
  return ActivityStorage.getAll().map((activity) => ({
    id: activity.id,
    userId: activity.userId,
    userName: activity.userName,
    email: '',
    appName: activity.type === 'app' ? activity.name : 'Browser',
    windowTitle: activity.name,
    website: activity.type === 'site' ? activity.name : null,
    timestamp: activity.timestamp.includes('T') ? activity.timestamp : activity.timestamp.replace(' ', 'T'),
    duration: Math.max(60, activity.duration * 60)
  }));
}

export function getTrackingLogs() {
  const logs = readRendererTrackingLogs();
  return logs.length > 0 ? logs : fallbackLogs();
}

export function getTrackingLogsByUser(user: { id?: string; email?: string } | null | undefined) {
  if (!user) return [];

  const normalizedUserEmail = normalizeEmail(user.email);
  return getTrackingLogs().filter((log) => {
    if (user.id && log.userId === user.id) return true;
    if (normalizedUserEmail && normalizeEmail(log.email) === normalizedUserEmail) return true;
    return false;
  });
}

export function subscribeToTrackingLogChanges(callback: () => void) {
  const handler = () => callback();
  window.addEventListener('taskhive:data-sync', handler as EventListener);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener('taskhive:data-sync', handler as EventListener);
    window.removeEventListener('storage', handler);
  };
}

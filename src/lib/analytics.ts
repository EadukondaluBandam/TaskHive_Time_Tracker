import type { TrackingLog } from '@/services/trackingLogs';
import type { Project, Task, TimeEntry, User } from './types';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const SHORT_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

function asDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function round(value: number, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function minutesToHours(minutes: number) {
  return round(minutes / 60, 1);
}

export function sumEntryMinutes(entries: TimeEntry[]) {
  return entries.reduce((total, entry) => total + entry.duration, 0);
}

export function buildWeeklyHours(entries: TimeEntry[], userId?: string) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  return SHORT_WEEK.map((day, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const dateKey = date.toISOString().split('T')[0];
    const dayEntries = entries.filter((entry) => entry.date === dateKey && (!userId || entry.userId === userId));
    const totalMinutes = sumEntryMinutes(dayEntries);
    return {
      day,
      hours: minutesToHours(totalMinutes),
      productive: minutesToHours(totalMinutes),
      idle: 0,
      entries: dayEntries.length,
      date: dateKey,
    };
  });
}

export function buildMonthlyWeeks(entries: TimeEntry[], userId?: string) {
  const now = new Date();
  const monthEntries = entries.filter((entry) => {
    const parsed = asDate(entry.date);
    return parsed &&
      parsed.getFullYear() === now.getFullYear() &&
      parsed.getMonth() === now.getMonth() &&
      (!userId || entry.userId === userId);
  });

  const weekMap = new Map<string, number>();
  monthEntries.forEach((entry) => {
    const parsed = asDate(entry.date);
    if (!parsed) return;
    const week = `Week ${Math.ceil(parsed.getDate() / 7)}`;
    weekMap.set(week, (weekMap.get(week) || 0) + entry.duration);
  });

  return Array.from({ length: 5 }, (_, index) => {
    const week = `Week ${index + 1}`;
    return {
      week,
      productivity: Math.min(100, Math.round(minutesToHours(weekMap.get(week) || 0) * 10)),
      target: 85,
    };
  });
}

export function buildDepartmentProductivity(users: User[]) {
  const grouped = new Map<string, { total: number; count: number }>();
  users.forEach((user) => {
    const bucket = grouped.get(user.department) || { total: 0, count: 0 };
    bucket.total += user.productivity;
    bucket.count += 1;
    grouped.set(user.department, bucket);
  });

  return Array.from(grouped.entries())
    .map(([team, values]) => ({
      team,
      productivity: values.count > 0 ? Math.round(values.total / values.count) : 0,
    }))
    .sort((left, right) => right.productivity - left.productivity);
}

export function buildTopUsage(logs: TrackingLog[], limit = 5) {
  const apps = new Map<string, number>();
  const sites = new Map<string, number>();

  logs.forEach((log) => {
    apps.set(log.appName, (apps.get(log.appName) || 0) + log.duration);
    if (log.website) {
      const site = log.website || log.windowTitle;
      sites.set(site, (sites.get(site) || 0) + log.duration);
    }
  });

  const toRows = (grouped: Map<string, number>) =>
    Array.from(grouped.entries())
      .map(([name, duration]) => ({ name, duration, hours: minutesToHours(duration / 60) }))
      .sort((left, right) => right.duration - left.duration)
      .slice(0, limit);

  return {
    apps: toRows(apps),
    sites: toRows(sites),
  };
}

export function buildLiveSnapshots(logs: TrackingLog[], users: User[]) {
  return logs
    .slice()
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, 6)
    .map((log, index) => {
      const matchedUser = users.find((user) => user.id === log.userId || user.email.toLowerCase() === log.email.toLowerCase());
      const activity = log.website ? 55 : 90;
      return {
        id: `${log.id}-${index}`,
        user: matchedUser?.name || log.userName || log.email || 'Unknown user',
        time: asDate(log.timestamp)?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) || 'Unknown',
        status: log.website ? 'idle' : 'active',
        app: log.appName,
        activity,
      };
    });
}

export function buildDailyCalendar(entries: TimeEntry[], viewDate: Date, userId?: string) {
  const month = viewDate.getMonth();
  const year = viewDate.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const dayNumber = index + 1;
    const date = new Date(year, month, dayNumber);
    const dateKey = date.toISOString().split('T')[0];
    const dayEntries = entries.filter((entry) => entry.date === dateKey && (!userId || entry.userId === userId));
    return {
      day: dayNumber,
      hours: minutesToHours(sumEntryMinutes(dayEntries)),
      hasData: dayEntries.length > 0,
    };
  });
}

export function getUserHours(user: User, entries: TimeEntry[]) {
  return minutesToHours(
    entries
      .filter((entry) => entry.userId === user.id)
      .reduce((total, entry) => total + entry.duration, 0)
  );
}

export function getProjectHours(project: Project, entries: TimeEntry[]) {
  return minutesToHours(
    entries
      .filter((entry) => entry.projectId === project.id)
      .reduce((total, entry) => total + entry.duration, 0)
  );
}

export function getTaskHours(task: Task, entries: TimeEntry[]) {
  return minutesToHours(
    entries
      .filter((entry) => entry.taskId === task.id)
      .reduce((total, entry) => total + entry.duration, 0)
  );
}

export function buildHourlyActivity(logs: TrackingLog[], todayOnly = true) {
  const today = new Date().toISOString().split('T')[0];
  const filtered = todayOnly ? logs.filter((log) => log.timestamp.startsWith(today)) : logs;
  const grouped = new Map<string, { hour: string; active: number; idle: number }>();

  filtered.forEach((log) => {
    const parsed = asDate(log.timestamp);
    const hour = parsed ? parsed.toLocaleTimeString('en-IN', { hour: 'numeric' }) : 'Now';
    const bucket = grouped.get(hour) || { hour, active: 0, idle: 0 };
    if (log.website) {
      bucket.idle += Math.round(log.duration / 60);
    } else {
      bucket.active += Math.round(log.duration / 60);
    }
    grouped.set(hour, bucket);
  });

  return Array.from(grouped.values()).slice(-10);
}

export function buildDailyActivity(logs: TrackingLog[]) {
  const grouped = new Map<string, { day: string; productive: number; idle: number; sortKey: number }>();

  logs.forEach((log) => {
    const parsed = asDate(log.timestamp);
    if (!parsed) return;
    const day = WEEK_DAYS[parsed.getDay()];
    const current = grouped.get(day) || { day, productive: 0, idle: 0, sortKey: parsed.getDay() };
    if (log.website) {
      current.idle += Math.round(log.duration / 60);
    } else {
      current.productive += Math.round(log.duration / 60);
    }
    grouped.set(day, current);
  });

  return Array.from(grouped.values())
    .sort((left, right) => left.sortKey - right.sortKey)
    .map(({ sortKey, ...rest }) => rest);
}

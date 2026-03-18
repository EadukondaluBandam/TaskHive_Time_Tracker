

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'employee';
  department: string;
  status: 'active' | 'inactive';
  avatar?: string;
  productivity: number;
  totalHours: number;
  joinedDate: string;
  companyName?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on-hold';
  team: string[];
  totalHours: number;
  deadline: string;
  progress: number;
}

export interface Task {
  id: string;
  name: string;
  projectId: string;
  description?: string;
  projectName: string;
  assignees: string[];
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  estimatedHours: number;
  loggedHours: number;
}

export interface TimeEntry {
  id: string;
  userId: string;
  userName: string;
  projectId: string;
  projectName: string;
  taskId: string;
  taskName: string;
  startTime: string;
  endTime: string;
  duration: number; 
  description: string;
  date: string;
}

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  type: 'app' | 'site' | 'idle' | 'active';
  name: string;
  duration: number; 
  timestamp: string;
  category: 'productive' | 'neutral' | 'unproductive';
}

export const users: User[] = [
  { id: '1', name: 'Arjun Sharma', email: 'arjun.sharma@blackroth.com', password: 'admin123', role: 'admin', department: 'Management', status: 'active', productivity: 92, totalHours: 168, joinedDate: '2022-01-15', companyName: 'Blackroth Group' },
  { id: '2', name: 'Priya Patel', email: 'priya.patel@blackroth.com', password: 'employee123', role: 'employee', department: 'Development', status: 'active', productivity: 88, totalHours: 156, joinedDate: '2022-03-20' },
  { id: '3', name: 'Ramesh Kumar', email: 'ramesh.kumar@blackroth.com', password: 'employee123', role: 'employee', department: 'Development', status: 'active', productivity: 85, totalHours: 162, joinedDate: '2022-02-10' },
  { id: '4', name: 'Ananya Reddy', email: 'ananya.reddy@blackroth.com', password: 'employee123', role: 'employee', department: 'Design', status: 'active', productivity: 91, totalHours: 148, joinedDate: '2022-04-05' },
  { id: '5', name: 'Karthik Nair', email: 'karthik.nair@blackroth.com', password: 'employee123', role: 'employee', department: 'Development', status: 'active', productivity: 78, totalHours: 144, joinedDate: '2022-05-12' },
  { id: '6', name: 'Kavya Iyer', email: 'kavya.iyer@blackroth.com', password: 'employee123', role: 'employee', department: 'Marketing', status: 'active', productivity: 94, totalHours: 152, joinedDate: '2022-06-18' },
  { id: '7', name: 'Rohit Gupta', email: 'rohit.gupta@blackroth.com', password: 'employee123', role: 'employee', department: 'Development', status: 'inactive', productivity: 72, totalHours: 120, joinedDate: '2022-07-22' },
  { id: '8', name: 'Lakshmi Menon', email: 'lakshmi.menon@blackroth.com', password: 'employee123', role: 'employee', department: 'QA', status: 'active', productivity: 89, totalHours: 158, joinedDate: '2022-08-30' },
  { id: '9', name: 'Suresh Venkat', email: 'suresh.venkat@blackroth.com', password: 'employee123', role: 'employee', department: 'Development', status: 'active', productivity: 82, totalHours: 140, joinedDate: '2022-09-14' },
  { id: '10', name: 'Mahesh Krishnan', email: 'mahesh.krishnan@blackroth.com', password: 'employee123', role: 'employee', department: 'DevOps', status: 'active', productivity: 87, totalHours: 164, joinedDate: '2022-10-08' },
];

export const projects: Project[] = [
  { id: 'p1', name: 'Bharat Banking Portal', description: 'Digital banking solution for rural India', status: 'active', team: ['2', '3', '5'], totalHours: 420, deadline: '2024-03-15', progress: 68 },
  { id: 'p2', name: 'Ayurveda Health App', description: 'Wellness and traditional medicine tracking', status: 'active', team: ['4', '6'], totalHours: 280, deadline: '2024-02-28', progress: 45 },
  { id: 'p3', name: 'Kisan Mitra Platform', description: 'Agricultural marketplace for farmers', status: 'active', team: ['2', '9', '10'], totalHours: 560, deadline: '2024-04-30', progress: 82 },
  { id: 'p4', name: 'Smart City Dashboard', description: 'Urban analytics and monitoring system', status: 'on-hold', team: ['3', '8'], totalHours: 180, deadline: '2024-05-20', progress: 25 },
  { id: 'p5', name: 'Desi Commerce Platform', description: 'E-commerce for local artisans', status: 'completed', team: ['5', '6', '7'], totalHours: 720, deadline: '2024-01-15', progress: 100 },
];

export const tasks: Task[] = [
  { id: 't1', name: 'UPI Integration Module', projectId: 'p1', projectName: 'Bharat Banking Portal', assignees: ['Priya Patel', 'Ramesh Kumar'], status: 'in-progress', priority: 'high', estimatedHours: 40, loggedHours: 28 },
  { id: 't2', name: 'User Authentication Flow', projectId: 'p1', projectName: 'Bharat Banking Portal', assignees: ['Karthik Nair'], status: 'completed', priority: 'high', estimatedHours: 24, loggedHours: 22 },
  { id: 't3', name: 'Dosha Assessment Quiz', projectId: 'p2', projectName: 'Ayurveda Health App', assignees: ['Ananya Reddy'], status: 'in-progress', priority: 'medium', estimatedHours: 16, loggedHours: 10 },
  { id: 't4', name: 'Crop Price Prediction API', projectId: 'p3', projectName: 'Kisan Mitra Platform', assignees: ['Suresh Venkat', 'Mahesh Krishnan'], status: 'pending', priority: 'high', estimatedHours: 32, loggedHours: 0 },
  { id: 't5', name: 'Weather Integration', projectId: 'p3', projectName: 'Kisan Mitra Platform', assignees: ['Priya Patel'], status: 'in-progress', priority: 'medium', estimatedHours: 20, loggedHours: 15 },
  { id: 't6', name: 'Traffic Analytics Module', projectId: 'p4', projectName: 'Smart City Dashboard', assignees: ['Ramesh Kumar'], status: 'pending', priority: 'low', estimatedHours: 28, loggedHours: 0 },
  { id: 't7', name: 'Vendor Onboarding Portal', projectId: 'p5', projectName: 'Desi Commerce Platform', assignees: ['Kavya Iyer'], status: 'completed', priority: 'medium', estimatedHours: 18, loggedHours: 20 },
  { id: 't8', name: 'Multi-language Support', projectId: 'p1', projectName: 'Bharat Banking Portal', assignees: ['Lakshmi Menon'], status: 'pending', priority: 'medium', estimatedHours: 36, loggedHours: 0 },
];

export const timeEntries: TimeEntry[] = [
  { id: 'te1', userId: '2', userName: 'Priya Patel', projectId: 'p1', projectName: 'Bharat Banking Portal', taskId: 't1', taskName: 'UPI Integration Module', startTime: '09:00', endTime: '12:30', duration: 210, description: 'Implemented payment gateway connection', date: '2024-01-22' },
  { id: 'te2', userId: '2', userName: 'Priya Patel', projectId: 'p3', projectName: 'Kisan Mitra Platform', taskId: 't5', taskName: 'Weather Integration', startTime: '14:00', endTime: '17:30', duration: 210, description: 'API integration with IMD weather service', date: '2024-01-22' },
  { id: 'te3', userId: '3', userName: 'Ramesh Kumar', projectId: 'p1', projectName: 'Bharat Banking Portal', taskId: 't1', taskName: 'UPI Integration Module', startTime: '10:00', endTime: '13:00', duration: 180, description: 'Testing payment flows', date: '2024-01-22' },
  { id: 'te4', userId: '4', userName: 'Ananya Reddy', projectId: 'p2', projectName: 'Ayurveda Health App', taskId: 't3', taskName: 'Dosha Assessment Quiz', startTime: '09:30', endTime: '16:00', duration: 390, description: 'Designed quiz UI components', date: '2024-01-22' },
  { id: 'te5', userId: '5', userName: 'Karthik Nair', projectId: 'p1', projectName: 'Bharat Banking Portal', taskId: 't2', taskName: 'User Authentication Flow', startTime: '08:00', endTime: '12:00', duration: 240, description: 'Implemented OTP verification', date: '2024-01-22' },
];

export const activities: Activity[] = [
  { id: 'a1', userId: '2', userName: 'Priya Patel', type: 'app', name: 'VS Code', duration: 180, timestamp: '2024-01-22 09:00', category: 'productive' },
  { id: 'a2', userId: '2', userName: 'Priya Patel', type: 'site', name: 'GitHub', duration: 45, timestamp: '2024-01-22 10:30', category: 'productive' },
  { id: 'a3', userId: '2', userName: 'Priya Patel', type: 'site', name: 'Stack Overflow', duration: 30, timestamp: '2024-01-22 11:00', category: 'productive' },
  { id: 'a4', userId: '2', userName: 'Priya Patel', type: 'idle', name: 'Away', duration: 15, timestamp: '2024-01-22 12:30', category: 'neutral' },
  { id: 'a5', userId: '3', userName: 'Ramesh Kumar', type: 'app', name: 'IntelliJ IDEA', duration: 240, timestamp: '2024-01-22 09:00', category: 'productive' },
  { id: 'a6', userId: '3', userName: 'Ramesh Kumar', type: 'site', name: 'Jira', duration: 60, timestamp: '2024-01-22 14:00', category: 'productive' },
  { id: 'a7', userId: '4', userName: 'Ananya Reddy', type: 'app', name: 'Figma', duration: 300, timestamp: '2024-01-22 09:30', category: 'productive' },
  { id: 'a8', userId: '4', userName: 'Ananya Reddy', type: 'site', name: 'Dribbble', duration: 45, timestamp: '2024-01-22 15:00', category: 'neutral' },
  { id: 'a9', userId: '5', userName: 'Karthik Nair', type: 'app', name: 'Terminal', duration: 120, timestamp: '2024-01-22 08:00', category: 'productive' },
  { id: 'a10', userId: '5', userName: 'Karthik Nair', type: 'site', name: 'YouTube', duration: 20, timestamp: '2024-01-22 13:00', category: 'unproductive' },
];

export const weeklyData = [
  { day: 'Mon', hours: 8.5, productive: 7.2, idle: 1.3 },
  { day: 'Tue', hours: 9.0, productive: 7.8, idle: 1.2 },
  { day: 'Wed', hours: 7.5, productive: 6.5, idle: 1.0 },
  { day: 'Thu', hours: 8.0, productive: 7.0, idle: 1.0 },
  { day: 'Fri', hours: 7.0, productive: 6.0, idle: 1.0 },
  { day: 'Sat', hours: 0, productive: 0, idle: 0 },
  { day: 'Sun', hours: 0, productive: 0, idle: 0 },
];

export const productivityByTeam = [
  { team: 'Development', productivity: 86 },
  { team: 'Design', productivity: 91 },
  { team: 'QA', productivity: 89 },
  { team: 'Marketing', productivity: 94 },
  { team: 'DevOps', productivity: 87 },
];

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'superadmin' | 'admin' | 'employee';
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

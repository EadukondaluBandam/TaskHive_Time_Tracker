import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  UserStorage, 
  SessionStorage, 
  NotificationStorage, 
  TimerStorage,
  TimeEntryStorage,
  ProjectStorage,
  TaskStorage,
  initializeStorage 
} from '@/lib/storage';
import { User } from '@/lib/types';
import { toast } from 'sonner';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'employee';
  department: string;
  companyName?: string;
}

interface NewAdminData {
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  adminName: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: (reason?: string) => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  registerNewAdmin: (data: NewAdminData) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (companyName: string) => void;
  isAuthenticated: boolean;
  sessionHours: number;
  checkSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTO_LOGOUT_HOURS = 10;
const WARNING_HOURS = 9.67;

const DEMO_CREDENTIALS = {
  superadmin: {
    email: 'superadmin@taskhive.com',
    password: 'Taskhiveadmin@2026',
    user: {
      id: 'taskhive-superadmin',
      name: 'TaskHive Super Admin',
      email: 'superadmin@taskhive.com',
      role: 'superadmin' as const,
      department: 'TaskHive',
      companyName: 'TaskHive'
    }
  },
  admin: {
    email: 'admin@demo.com',
    password: 'admin123',
    user: {
      id: 'demo-admin',
      name: 'Demo Admin',
      email: 'admin@demo.com',
      role: 'admin' as const,
      department: 'Management',
      companyName: 'Demo Company'
    }
  },
  employee: {
    email: 'employee@demo.com',
    password: 'emp123',
    user: {
      id: 'demo-employee',
      name: 'Demo Employee',
      email: 'employee@demo.com',
      role: 'employee' as const,
      department: 'Engineering'
    }
  }
};

function toAuthUser(user: AuthUser | User): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    companyName: user.companyName,
  };
}

function isAdminRole(role: AuthUser['role']) {
  return role === 'admin' || role === 'superadmin';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionHours, setSessionHours] = useState(0);
  const [warningShown, setWarningShown] = useState(false);

  const syncAuthFromStorage = useCallback(() => {
    const session = SessionStorage.get();
    const savedUser = localStorage.getItem('taskhive_user');

    if (session && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(toAuthUser(parsedUser));
        setSessionHours(SessionStorage.getElapsedHours());
        return;
      } catch {
        // Ignore invalid persisted auth payloads and fall back to signed-out state.
      }
    }

    setUser(null);
    setSessionHours(0);
    setWarningShown(false);
  }, []);

  useEffect(() => {
    initializeStorage();
    syncAuthFromStorage();
  }, [syncAuthFromStorage]);

  useEffect(() => {
    const handleAuthSync = () => {
      syncAuthFromStorage();
    };

    window.addEventListener('taskhive:auth-sync', handleAuthSync as EventListener);
    window.addEventListener('storage', handleAuthSync);

    return () => {
      window.removeEventListener('taskhive:auth-sync', handleAuthSync as EventListener);
      window.removeEventListener('storage', handleAuthSync);
    };
  }, [syncAuthFromStorage]);

  const checkSession = useCallback(() => {
    const session = SessionStorage.get();
    if (!session || !user) return;

    const hours = SessionStorage.getElapsedHours();
    setSessionHours(hours);

    if (hours >= WARNING_HOURS && hours < AUTO_LOGOUT_HOURS && !warningShown) {
      setWarningShown(true);
      NotificationStorage.notifyAutoLogoutWarning(user.id);
      toast.warning('Session Warning', {
        description: 'Your session will auto-logout in 20 minutes. Please save your work.',
        duration: 10000,
      });
    }

    if (hours >= AUTO_LOGOUT_HOURS) {
      handleAutoLogout();
    }
  }, [user, warningShown]);

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(checkSession, 60000);
    checkSession();

    return () => clearInterval(interval);
  }, [user, checkSession]);

  const handleAutoLogout = () => {
    if (!user) return;

    const timerState = TimerStorage.get(user.id);
    if (timerState && timerState.isRunning) {
      const project = timerState.projectId ? ProjectStorage.getById(timerState.projectId) : undefined;
      const task = timerState.taskId ? TaskStorage.getById(timerState.taskId) : undefined;
      
      TimeEntryStorage.create({
        userId: user.id,
        userName: user.name,
        projectId: timerState.projectId,
        projectName: project?.name || 'Unknown',
        taskId: timerState.taskId,
        taskName: task?.name || 'Unknown',
        startTime: new Date(timerState.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        endTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        duration: Math.floor(timerState.elapsedSeconds / 60),
        description: timerState.description + ' [PENDING APPROVAL - Auto-logout]',
        date: new Date().toISOString().split('T')[0],
      });
      
      TimerStorage.clear(user.id);
    }

    const admins = UserStorage.getAll().filter(u => u.role === 'admin' || u.role === 'superadmin');
    admins.forEach(admin => {
      NotificationStorage.notifyAutoLogout(user.id, admin.id);
    });

    NotificationStorage.notifyLogout(user.id, 'Auto-logged out after 10 hours');
    
    toast.error('Session Ended', {
      description: 'You have been auto-logged out after 10 hours. Remaining time marked as Pending Approval.',
    });

    logout('Auto-logout after 10 hours');
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    if (email.toLowerCase() === DEMO_CREDENTIALS.superadmin.email && password === DEMO_CREDENTIALS.superadmin.password) {
      const demoUser = DEMO_CREDENTIALS.superadmin.user;
      const authUser = toAuthUser(demoUser);
      setUser(authUser);
      setWarningShown(false);
      setSessionHours(0);
      
      localStorage.setItem('taskhive_user', JSON.stringify(authUser));
      SessionStorage.create(demoUser.id);
      NotificationStorage.notifyLogin(demoUser.id);

      toast.success('Welcome back!', {
        description: `Logged in as ${demoUser.name}`,
      });

      return { success: true };
    }

    if (email.toLowerCase() === DEMO_CREDENTIALS.admin.email && password === DEMO_CREDENTIALS.admin.password) {
      const demoUser = DEMO_CREDENTIALS.admin.user;
      const authUser = toAuthUser(demoUser);
      setUser(authUser);
      setWarningShown(false);
      setSessionHours(0);
      
      localStorage.setItem('taskhive_user', JSON.stringify(authUser));
      SessionStorage.create(demoUser.id);
      NotificationStorage.notifyLogin(demoUser.id);

      toast.success('Welcome back!', {
        description: `Logged in as ${demoUser.name}`,
      });

      return { success: true };
    }

    if (email.toLowerCase() === DEMO_CREDENTIALS.employee.email && password === DEMO_CREDENTIALS.employee.password) {
      const demoUser = DEMO_CREDENTIALS.employee.user;
      const authUser = toAuthUser(demoUser);
      setUser(authUser);
      setWarningShown(false);
      setSessionHours(0);
      
      localStorage.setItem('taskhive_user', JSON.stringify(authUser));
      SessionStorage.create(demoUser.id);
      NotificationStorage.notifyLogin(demoUser.id);

      toast.success('Welcome back!', {
        description: `Logged in as ${demoUser.name}`,
      });

      return { success: true };
    }

    const storedUsers = UserStorage.getAll();
    const foundUser = storedUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!foundUser) {
      return { success: false, error: 'User not found. Please check your email.' };
    }

    if (foundUser.status === 'inactive') {
      return { success: false, error: 'Your account is deactivated. Please contact administrator.' };
    }

    if (foundUser.password !== password) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const authUser = toAuthUser(foundUser);

    setUser(authUser);
    setWarningShown(false);
    setSessionHours(0);
    
    localStorage.setItem('taskhive_user', JSON.stringify(authUser));
    SessionStorage.create(foundUser.id);
    NotificationStorage.notifyLogin(foundUser.id);

    toast.success('Welcome back!', {
      description: `Logged in as ${foundUser.name}`,
    });

    return { success: true };
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const demoEmails = Object.values(DEMO_CREDENTIALS).map(cred => cred.email);
    const storedUsers = UserStorage.getAll();
    const allEmails = [...demoEmails, ...storedUsers.map(u => u.email)];

    if (!allEmails.includes(email.toLowerCase())) {
      return { success: false, error: 'No account found with this email address.' };
    }

    toast.success('Password Reset', {
      description: `Reset instructions sent to ${email}`,
      duration: 5000,
    });

    console.log(`ðŸ”’ Password reset email sent to: ${email}`);
    return { success: true };
  };

  const registerNewAdmin = async (data: NewAdminData): Promise<{ success: boolean; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const { email, password, confirmPassword, companyName, adminName } = data;

    if (!email || !password || !companyName || !adminName) {
      return { success: false, error: 'All fields are required.' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    if (password !== confirmPassword) {
      return { success: false, error: 'Passwords do not match.' };
    }

    const storedUsers = UserStorage.getAll();
    const emailExists = storedUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      return { success: false, error: 'Email already registered. Please use a different email.' };
    }

    const newAdminId = `admin-${Date.now()}`;
    const newAdmin: User = {
      id: newAdminId,
      name: adminName,
      email: email,
      password,
      role: 'admin',
      department: companyName,
      status: 'active',
      productivity: 0,
      totalHours: 0,
      joinedDate: ''
    };

    UserStorage.create(newAdmin);

    toast.success('Company Created!', {
      description: `New admin account created for ${companyName}. You can now login.`,
      duration: 6000,
    });

    console.log(`ðŸ¢ New company admin created:`, newAdmin);
    return { success: true };
  };

  const logout = (reason?: string) => {
    if (user) {
      const timerState = TimerStorage.get(user.id);
      if (timerState && timerState.isRunning) {
        const project = timerState.projectId ? ProjectStorage.getById(timerState.projectId) : undefined;
        const task = timerState.taskId ? TaskStorage.getById(timerState.taskId) : undefined;
        
        TimeEntryStorage.create({
          userId: user.id,
          userName: user.name,
          projectId: timerState.projectId,
          projectName: project?.name || 'Unknown',
          taskId: timerState.taskId,
          taskName: task?.name || 'Unknown',
          startTime: new Date(timerState.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          endTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          duration: Math.floor(timerState.elapsedSeconds / 60),
          description: timerState.description,
          date: new Date().toISOString().split('T')[0],
        });
        
        TimerStorage.clear(user.id);
      }

      if (!reason) {
        NotificationStorage.notifyLogout(user.id);
      }
    }

    setUser(null);
    setSessionHours(0);
    setWarningShown(false);
    localStorage.removeItem('taskhive_user');
    SessionStorage.end();
  };

  const updateProfile = (companyName: string) => {
    if (!user) return;

    const updatedUser = { ...user, companyName };
    setUser(updatedUser);
    localStorage.setItem('taskhive_user', JSON.stringify(updatedUser));
    
    UserStorage.update(user.id, { companyName });

    toast.success('Profile Updated', {
      description: 'Company name has been updated successfully',
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      forgotPassword,  
      registerNewAdmin, 
      updateProfile,
      isAuthenticated: !!user,
      sessionHours,
      checkSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

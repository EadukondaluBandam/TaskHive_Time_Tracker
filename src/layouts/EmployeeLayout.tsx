import { ReactNode, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Timer,
  Calendar,
  TrendingUp,
  Activity,
  User,
  LogOut,
  Download,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useTimer } from '@/contexts/TimerContext';
import { NotificationBell } from '@/components/NotificationBell';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ProjectStorage, TaskStorage } from '@/lib/storage';

interface EmployeeLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/employee/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: '/employee/timer', icon: Timer, label: 'Time Tracker' },
  { path: '/employee/timesheets', icon: Calendar, label: 'Timesheets' },
  { path: '/employee/productivity', icon: TrendingUp, label: 'Productivity' },
  { path: '/employee/activities', icon: Activity, label: 'Activities' },
];

const desktopInstallerPath = '/downloads/TaskHive%20Setup.exe';

export default function EmployeeLayout({ children }: EmployeeLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { timerState, elapsedSeconds, isRunning } = useTimer();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentProject = timerState ? ProjectStorage.getById(timerState.projectId) : null;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          {!collapsed && <Logo size="sm" />}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-muted-foreground hover:text-foreground"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const isActive = item.end 
              ? location.pathname === item.path 
              : location.pathname.startsWith(item.path);
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary border-l-2 border-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={20} />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Quick timer status */}
        {!collapsed && timerState && (
          <div className="mx-4 mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 text-primary">
              <Clock size={16} className={isRunning ? "animate-pulse" : ""} />
              <span className="text-xs font-medium">{isRunning ? 'Timer Running' : 'Timer Paused'}</span>
            </div>
            <p className="text-lg font-mono font-bold text-foreground mt-1">{formatTime(elapsedSeconds)}</p>
            <p className="text-xs text-muted-foreground">{currentProject?.name || 'No project'}</p>
          </div>
        )}

        {/* User section */}
        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={() => navigate('/employee/profile')}
            className="w-full text-left mb-3 hover:opacity-80 transition-opacity"
            title="Go to Profile"
          >
            {!collapsed && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                  {user?.name?.charAt(0) || 'E'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.department}</p>
                </div>
              </div>
            )}
            {collapsed && (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold mx-auto">
                {user?.name?.charAt(0) || 'E'}
              </div>
            )}
          </button>
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "default"}
            onClick={handleLogout}
            className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut size={18} />
            {!collapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        collapsed ? "ml-16" : "ml-64"
      )}>
        {/* Top header */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Employee Dashboard</h1>
            <p className="text-xs text-muted-foreground">Welcome back, {user?.name?.split(' ')[0]}</p>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <a href={desktopInstallerPath} download="TaskHive Setup.exe">
                <Download size={16} />
                Download Desktop App
              </a>
            </Button>
            <NotificationBell />
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}

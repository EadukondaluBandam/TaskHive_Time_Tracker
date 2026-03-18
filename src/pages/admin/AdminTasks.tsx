import { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, Edit, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { TaskStorage, ProjectStorage, UserStorage, NotificationStorage } from '@/lib/storage';
import { User, Task, Project } from '@/lib/mockData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export default function AdminTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    projectId: '',
    status: 'pending' as 'pending' | 'in-progress' | 'completed',
    priority: 'medium' as 'low' | 'medium' | 'high',
    estimatedHours: 0,
  });
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTasks(TaskStorage.getAll());
    setProjects(ProjectStorage.getAll().filter(p => p.status === 'active'));
    setUsers(UserStorage.getAll().filter(u => u.status === 'active'));
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = 
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-success" />;
      case 'in-progress':
        return <Clock size={16} className="text-warning" />;
      default:
        return <AlertCircle size={16} className="text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-destructive/10 text-destructive';
      case 'medium':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleCreateTask = () => {
    if (!formData.name || !formData.projectId) {
      toast.error('Please fill in all required fields');
      return;
    }

    const project = projects.find(p => p.id === formData.projectId);
    const assigneeNames = users
      .filter(u => selectedAssignees.includes(u.id))
      .map(u => u.name);

    const newTask = TaskStorage.create({
      name: formData.name,
      description: formData.description,
      projectId: formData.projectId,
      projectName: project?.name || '',
      assignees: assigneeNames,
      status: formData.status,
      priority: formData.priority,
      estimatedHours: formData.estimatedHours,
      loggedHours: 0,
    });

    // Notify assigned users
    selectedAssignees.forEach(userId => {
      NotificationStorage.notifyTaskAssigned(userId, newTask.name, newTask.projectName);
    });

    toast.success('Task Created', {
      description: `${newTask.name} has been created`,
    });

    setShowCreateModal(false);
    resetForm();
    loadData();
  };

  const handleUpdateTask = () => {
    if (!selectedTask || !formData.name) return;

    const project = projects.find(p => p.id === formData.projectId);
    const previousAssignees = selectedTask.assignees;
    const newAssigneeNames = users
      .filter(u => selectedAssignees.includes(u.id))
      .map(u => u.name);

    const updated = TaskStorage.update(selectedTask.id, {
      name: formData.name,
      projectId: formData.projectId,
      projectName: project?.name || selectedTask.projectName,
      assignees: newAssigneeNames,
      status: formData.status,
      priority: formData.priority,
      estimatedHours: formData.estimatedHours,
    });

    if (updated) {
      // Notify newly assigned users
      const newUsers = newAssigneeNames.filter(name => !previousAssignees.includes(name));
      newUsers.forEach(name => {
        const user = users.find(u => u.name === name);
        if (user) {
          NotificationStorage.notifyTaskAssigned(user.id, updated.name, updated.projectName);
        }
      });

      toast.success('Task Updated', {
        description: `${updated.name} has been updated`,
      });
    }

    setShowEditModal(false);
    resetForm();
    loadData();
  };

  const handleDeactivateTask = (task: Task) => {
    const deleted = TaskStorage.delete(task.id);
    if (deleted) {
      toast.success('Task Deleted', {
        description: `${task.name} has been removed`,
      });
      loadData();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      projectId: '',
      status: 'pending',
      priority: 'medium',
      estimatedHours: 0,
    });
    setSelectedAssignees([]);
    setSelectedTask(null);
  };

  const openEditModal = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      name: task.name,
      description: task.description || '',
      projectId: task.projectId,
      status: task.status,
      priority: task.priority,
      estimatedHours: task.estimatedHours,
    });
    // Find user IDs from assignee names
    const assigneeIds = users
      .filter(u => task.assignees.includes(u.name))
      .map(u => u.id);
    setSelectedAssignees(assigneeIds);
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tasks</h2>
          <p className="text-muted-foreground">Create and manage project tasks</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus size={16} />
          Create Task
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Task</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Project</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Assignees</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Priority</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Progress</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr key={task.id} className="border-b border-border last:border-0 table-row-hover">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      <span className="font-medium text-foreground">{task.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{task.projectName}</td>
                  <td className="p-4">
                    <div className="flex -space-x-2">
                      {task.assignees.slice(0, 3).map((assignee, i) => (
                        <div
                          key={i}
                          className="w-7 h-7 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-primary text-xs font-medium"
                          title={assignee}
                        >
                          {assignee.charAt(0)}
                        </div>
                      ))}
                      {task.assignees.length > 3 && (
                        <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-muted-foreground text-xs">
                          +{task.assignees.length - 3}
                        </div>
                      )}
                      {task.assignees.length === 0 && (
                        <span className="text-xs text-muted-foreground">Unassigned</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      task.status === 'completed'
                        ? 'bg-success/10 text-success'
                        : task.status === 'in-progress'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.min((task.loggedHours / task.estimatedHours) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {task.loggedHours}/{task.estimatedHours}h
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditModal(task)}>
                          <Edit size={14} className="mr-2" />
                          Edit Task
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeactivateTask(task)}
                        >
                          <Trash2 size={14} className="mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Task Modal */}
      <Dialog open={showCreateModal} onOpenChange={(open) => { setShowCreateModal(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-name">Task Name *</Label>
              <Input 
                id="task-name" 
                placeholder="Enter task name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="task-description">Description</Label>
                  <textarea
                    id="task-description"
                    placeholder="Enter task description (optional)"
                    className="w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

            <div className="space-y-2">
              <Label>Project *</Label>
              <Select value={formData.projectId} onValueChange={(v) => setFormData({ ...formData, projectId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(v: 'low' | 'medium' | 'high') => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">Estimated Hours</Label>
                <Input 
                  id="hours" 
                  type="number" 
                  placeholder="0"
                  value={formData.estimatedHours || ''}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assign To</Label>
              <div className="max-h-[150px] overflow-y-auto space-y-2 p-2 border border-border rounded-lg">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`create-${user.id}`}
                      checked={selectedAssignees.includes(user.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedAssignees([...selectedAssignees, user.id]);
                        } else {
                          setSelectedAssignees(selectedAssignees.filter(id => id !== user.id));
                        }
                      }}
                    />
                    <label htmlFor={`create-${user.id}`} className="text-sm cursor-pointer">
                      {user.name} <span className="text-muted-foreground">({user.department})</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowCreateModal(false); resetForm(); }}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleCreateTask}>
                Create Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Task Modal */}
      <Dialog open={showEditModal} onOpenChange={(open) => { setShowEditModal(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-task-name">Task Name</Label>
              <Input 
                id="edit-task-name" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={formData.projectId} onValueChange={(v) => setFormData({ ...formData, projectId: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v: 'pending' | 'in-progress' | 'completed') => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(v: 'low' | 'medium' | 'high') => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assign To</Label>
              <div className="max-h-[150px] overflow-y-auto space-y-2 p-2 border border-border rounded-lg">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`edit-${user.id}`}
                      checked={selectedAssignees.includes(user.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedAssignees([...selectedAssignees, user.id]);
                        } else {
                          setSelectedAssignees(selectedAssignees.filter(id => id !== user.id));
                        }
                      }}
                    />
                    <label htmlFor={`edit-${user.id}`} className="text-sm cursor-pointer">
                      {user.name} <span className="text-muted-foreground">({user.department})</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowEditModal(false); resetForm(); }}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleUpdateTask}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

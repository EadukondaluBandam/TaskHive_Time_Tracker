import { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, Edit, Trash2, Users, UserPlus } from 'lucide-react';
import { ProjectStorage, UserStorage, NotificationStorage } from '@/lib/storage';
import { User, Project } from '@/lib/mockData';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'completed' | 'on-hold',
    deadline: '',
  });
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProjects(ProjectStorage.getAll());
    setUsers(UserStorage.getAll().filter(u => u.status === 'active'));
  };

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTeamMembers = (teamIds: string[]) => {
    return users.filter(u => teamIds.includes(u.id));
  };

  const handleCreateProject = () => {
    if (!formData.name) {
      toast.error('Please enter a project name');
      return;
    }

    const newProject = ProjectStorage.create({
      name: formData.name,
      description: formData.description,
      status: formData.status,
      team: [],
      totalHours: 0,
      deadline: formData.deadline || new Date().toISOString().split('T')[0],
      progress: 0,
    });

    toast.success('Project Created', {
      description: `${newProject.name} has been created successfully`,
    });

    setShowCreateModal(false);
    resetForm();
    loadData();
  };

  const handleUpdateProject = () => {
    if (!selectedProject || !formData.name) return;

    const updated = ProjectStorage.update(selectedProject.id, {
      name: formData.name,
      description: formData.description,
      status: formData.status,
      deadline: formData.deadline,
    });

    if (updated) {
      toast.success('Project Updated', {
        description: `${updated.name} has been updated`,
      });
    }

    setShowEditModal(false);
    resetForm();
    loadData();
  };

  const handleAssignMembers = () => {
    if (!selectedProject) return;

    const previousMembers = selectedProject.team;
    const updated = ProjectStorage.assignMembers(selectedProject.id, selectedMembers);
    
    if (updated) {
      // Notify new members
      const newMembers = selectedMembers.filter(id => !previousMembers.includes(id));
      newMembers.forEach(memberId => {
        NotificationStorage.notifyProjectAssigned(memberId, updated.name);
      });

      toast.success('Team Updated', {
        description: `${selectedMembers.length} members assigned to ${updated.name}`,
      });
    }

    setShowAssignModal(false);
    setSelectedMembers([]);
    loadData();
  };

  const handleDeactivateProject = (project: Project) => {
    const updated = ProjectStorage.update(project.id, { status: 'on-hold' });
    if (updated) {
      toast.success('Project Deactivated', {
        description: `${project.name} has been put on hold`,
      });
      loadData();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'active',
      deadline: '',
    });
    setSelectedProject(null);
    setSelectedMembers([]);
  };

  const openEditModal = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      status: project.status,
      deadline: project.deadline,
    });
    setShowEditModal(true);
  };

  const openAssignModal = (project: Project) => {
    setSelectedProject(project);
    setSelectedMembers(project.team);
    setShowAssignModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Projects</h2>
          <p className="text-muted-foreground">Manage and track project progress</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus size={16} />
          Create Project
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card"
        />
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="bg-card rounded-xl border border-border p-5 hover:border-primary/30 transition-all duration-200 group"
          >
            <div className="flex items-start justify-between mb-3">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                project.status === 'active'
                  ? 'bg-success/10 text-success'
                  : project.status === 'completed'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-warning/10 text-warning'
              }`}>
                {project.status}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEditModal(project)}>
                    <Edit size={14} className="mr-2" />
                    Edit Project
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openAssignModal(project)}>
                    <UserPlus size={14} className="mr-2" />
                    Assign Members
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => handleDeactivateProject(project)}
                  >
                    <Trash2 size={14} className="mr-2" />
                    Deactivate
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <h3 className="text-lg font-semibold text-foreground mb-1">{project.name}</h3>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description}</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-foreground">{project.progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            {/* Team Members */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                {getTeamMembers(project.team).slice(0, 3).map((member) => (
                  <div
                    key={member.id}
                    className="w-7 h-7 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-primary text-xs font-medium -ml-2 first:ml-0"
                    title={member.name}
                  >
                    {member.name.charAt(0)}
                  </div>
                ))}
                {project.team.length > 3 && (
                  <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-muted-foreground text-xs -ml-2">
                    +{project.team.length - 3}
                  </div>
                )}
                {project.team.length === 0 && (
                  <span className="text-xs text-muted-foreground">No members assigned</span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {project.totalHours}h logged
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Project Modal */}
      <Dialog open={showCreateModal} onOpenChange={(open) => { setShowCreateModal(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input 
                id="name" 
                placeholder="Enter project name" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Enter project description" 
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v: 'active' | 'completed' | 'on-hold') => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input 
                  id="deadline" 
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowCreateModal(false); resetForm(); }}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleCreateProject}>
                Create Project
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Project Modal */}
      <Dialog open={showEditModal} onOpenChange={(open) => { setShowEditModal(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Project Name</Label>
              <Input 
                id="edit-name" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea 
                id="edit-description" 
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v: 'active' | 'completed' | 'on-hold') => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-deadline">Deadline</Label>
                <Input 
                  id="edit-deadline" 
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowEditModal(false); resetForm(); }}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleUpdateProject}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Members Modal */}
      <Dialog open={showAssignModal} onOpenChange={(open) => { setShowAssignModal(open); if (!open) setSelectedMembers([]); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Team Members</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select employees to assign to {selectedProject?.name}
            </p>
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={user.id}
                    checked={selectedMembers.includes(user.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedMembers([...selectedMembers, user.id]);
                      } else {
                        setSelectedMembers(selectedMembers.filter(id => id !== user.id));
                      }
                    }}
                  />
                  <label htmlFor={user.id} className="flex items-center gap-3 flex-1 cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.department} • {user.role}</p>
                    </div>
                  </label>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowAssignModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleAssignMembers}>
                Assign {selectedMembers.length} Members
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

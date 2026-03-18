import { useState, useRef, useEffect } from 'react';
import { User, Camera, Save, Sun, Moon, Lock, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SettingsStorage, UserSettings } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function AdminProfile() {
  const { user, updateProfile } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
  });
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
    otp: '',
    otpSent: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      const s = SettingsStorage.get(user.id);
      setSettings(s);
      const [first, ...rest] = user.name.split(' ');
      setProfileData({
        firstName: first || '',
        lastName: rest.join(' ') || '',
        companyName: user.companyName || 'Blackroth Group',
      });
      const savedImage = localStorage.getItem(`profile_image_${user.id}`);
      if (savedImage) setProfileImage(savedImage);
    }
  }, [user]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setProfileImage(base64);
      if (user?.id) localStorage.setItem(`profile_image_${user.id}`, base64);
      toast.success('Profile photo updated');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfileImage(null);
    if (user?.id) localStorage.removeItem(`profile_image_${user.id}`);
    toast.success('Photo removed');
  };

  const toggleTheme = () => {
    const newTheme = settings?.theme === 'dark' ? 'light' : 'dark';
    if (settings && user) {
      const updated = { ...settings, theme: newTheme as 'light' | 'dark' };
      setSettings(updated);
      SettingsStorage.save(updated);
      SettingsStorage.setTheme(newTheme as 'light' | 'dark');
      toast.success('Theme updated');
    }
  };

  const handleSettingChange = (key: keyof UserSettings, value: boolean) => {
    if (!user || !settings) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    SettingsStorage.save(updated);
    toast.success('Setting updated');
  };

  const handleSendOTP = () => {
    setPasswordData({ ...passwordData, otpSent: true });
    toast.success('OTP Sent', {
      description: 'A verification code has been sent to your email',
    });
  };

  const handleUpdatePassword = () => {
    if (passwordData.new !== passwordData.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordData.new.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    toast.success('Password Updated', {
      description: 'Your password has been changed successfully',
    });
    setPasswordData({ current: '', new: '', confirm: '', otp: '', otpSent: false });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Admin Profile</h2>
        <p className="text-muted-foreground">Manage administrator settings and preferences</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-4 border-card shadow-sm overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary font-bold text-3xl">{user?.name?.charAt(0) || 'A'}</span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 p-2.5 bg-primary rounded-full text-primary-foreground hover:bg-primary/90 transition-all shadow-lg border-2 border-background"
              title="Change Profile Photo"
            >
              <Camera size={16} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </div>

          <div className="text-center md:text-left flex-1">
            <h3 className="text-xl font-semibold text-foreground">{user?.name}</h3>
            <p className="text-muted-foreground">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
              <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full border">Administrator</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={toggleTheme} className="gap-2 h-10 px-4">
              {settings?.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              {settings?.theme === 'dark' ? 'Light' : 'Dark'}
            </Button>
            <Button onClick={() => toast.success('Saved')} className="gap-2 h-10 px-4">
              <Save size={16} />
              Save
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="personal" className="gap-2">
            <User size={14} />
            Personal Info
          </TabsTrigger>
          <TabsTrigger value="password" className="gap-2">
            <Lock size={14} />
            Change Password
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Shield size={14} />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-6">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input 
                  value={profileData.firstName} 
                  onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input 
                  value={profileData.lastName} 
                  onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled className="bg-muted/30 cursor-not-allowed" />
              </div>
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input 
                  value={profileData.companyName} 
                  onChange={(e) => setProfileData({...profileData, companyName: e.target.value})}
                />
              </div>
            </div>
            <Button className="mt-6 gap-2" onClick={() => {
              updateProfile(profileData.companyName);
            }}>
              <Save size={16} />
              Save Changes
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="password" className="mt-6">
          <div className="bg-card rounded-xl border border-border p-6 max-w-md">
            <h3 className="font-semibold text-foreground mb-6">Change Password</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input 
                  type="password" 
                  value={passwordData.current} 
                  onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input 
                  type="password" 
                  value={passwordData.new} 
                  onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input 
                  type="password" 
                  value={passwordData.confirm} 
                  onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                />
              </div>
              {!passwordData.otpSent ? (
                <Button onClick={handleSendOTP} className="w-full">Send OTP to Email</Button>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Enter OTP</Label>
                    <Input 
                      placeholder="Enter 6-digit code" 
                      value={passwordData.otp} 
                      onChange={(e) => setPasswordData({...passwordData, otp: e.target.value})}
                    />
                  </div>
                  <Button className="w-full gap-2" onClick={handleUpdatePassword}>
                    <Lock size={16} />
                    Update Password
                  </Button>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-6">Settings & Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Dark Theme</p>
                  <p className="text-sm text-muted-foreground">Enable dark mode for the application</p>
                </div>
                <Switch checked={settings?.theme === 'dark'} onCheckedChange={toggleTheme} />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive email notifications about system updates</p>
                </div>
                <Switch 
                  checked={settings?.emailNotifications || false} 
                  onCheckedChange={(v) => handleSettingChange('emailNotifications', v)}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Activity Tracking</p>
                  <p className="text-sm text-muted-foreground">Allow tracking of administrative activities</p>
                </div>
                <Switch 
                  checked={settings?.activityTracking || false} 
                  onCheckedChange={(v) => handleSettingChange('activityTracking', v)}
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

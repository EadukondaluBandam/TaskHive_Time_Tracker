import { useState, useRef, useEffect } from 'react';
import { User, Lock, Shield, Camera, Save, Sun, Moon, Image, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SettingsStorage, UserSettings } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function EmployeeProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null); // State for the image
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
    otp: '',
    otpSent: false,
  });

  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      const userSettings = SettingsStorage.get(user.id);
      setSettings(userSettings);
      const [first, ...rest] = user.name.split(' ');
      setProfileData({
        firstName: first || '',
        lastName: rest.join(' ') || '',
        phone: '',
      });

      // Load saved image from LocalStorage unique to this user
      const savedImage = localStorage.getItem(`profile_image_${user.id}`);
      if (savedImage) {
        setProfileImage(savedImage);
      }
    }
  }, [user]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      // Convert file to Base64 string to display and save
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileImage(base64String); 
        
        if (user?.id) {
          localStorage.setItem(`profile_image_${user.id}`, base64String); 
        }
        
        toast.success('Photo Updated', {
          description: 'Your profile picture has been changed.',
        });
        setShowPhotoOptions(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setProfileImage(null);
    if (user?.id) {
      localStorage.removeItem(`profile_image_${user.id}`);
    }
    toast.success('Photo Removed');
    setShowPhotoOptions(false);
  };

  const handleSaveProfile = () => {
    toast.success('Profile Updated', {
      description: 'Your profile has been saved successfully',
    });
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

  const handleSettingChange = (key: keyof UserSettings, value: boolean) => {
    if (!user || !settings) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    SettingsStorage.save(updated);
    toast.success('Setting Updated');
  };

  const toggleTheme = () => {
    const newTheme = settings?.theme === 'dark' ? 'light' : 'dark';
    if (settings && user) {
      const updated = { ...settings, theme: newTheme as 'light' | 'dark' };
      setSettings(updated);
      SettingsStorage.save(updated);
      SettingsStorage.setTheme(newTheme as 'light' | 'dark');
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Profile</h2>
          <p className="text-muted-foreground">Manage your personal information and preferences</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative group">
              {/* Profile Image Container */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-4 border-card shadow-sm overflow-hidden">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-primary font-bold text-3xl">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              
              <button 
                onClick={() => setShowPhotoOptions(true)}
                className="absolute -bottom-1 -right-1 p-2.5 bg-primary rounded-full text-primary-foreground hover:bg-primary/90 transition-all shadow-lg border-2 border-background hover:scale-110"
                title="Change Profile Photo"
              >
                <Camera size={16} />
              </button>
            </div>
            
            <div className="text-center md:text-left flex-1">
              <h3 className="text-xl font-semibold text-foreground">{user?.name}</h3>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
                <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full border">
                  {user?.department || 'Engineering'}
                </span>
                <span className="px-3 py-1 text-xs font-medium bg-success/10 text-success rounded-full border">
                  Active
                </span>
              </div>
            </div>
            
            <Button variant="outline" onClick={toggleTheme} className="gap-2 h-10 px-4">
              {settings?.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              {settings?.theme === 'dark' ? 'Light' : 'Dark'}
            </Button>
          </div>
        </div>

        {/* Upload Photo Modal */}
        {showPhotoOptions && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-sm rounded-xl border shadow-xl p-6 space-y-4">
              <div className="text-center pb-2">
                <h3 className="text-lg font-semibold text-foreground mb-1">Change Profile Photo</h3>
                <p className="text-sm text-muted-foreground">Upload a new profile picture</p>
              </div>
              
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button 
                  type="button"
                  className="w-full h-12 justify-start gap-3 px-4"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Image className="h-5 w-5 shrink-0 text-primary" />
                  <span className="font-medium">Upload from Device</span>
                </Button>

                {profileImage && (
                  <Button 
                    type="button"
                    className="w-full h-12 justify-start gap-3 px-4 text-destructive hover:text-destructive hover:bg-destructive/10"
                    variant="ghost"
                    onClick={handleRemovePhoto}
                  >
                    <Trash2 className="h-5 w-5 shrink-0" />
                    <span className="font-medium">Remove Current Photo</span>
                  </Button>
                )}
              </div>

              <div className="pt-2">
                <Button 
                  variant="secondary" 
                  className="w-full" 
                  onClick={() => setShowPhotoOptions(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

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
            <TabsTrigger value="consent" className="gap-2">
              <Shield size={14} />
              Consent Management
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
                  <Label>Phone Number</Label>
                  <Input 
                    placeholder="+91 98765 43210" 
                    value={profileData.phone} 
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  />
                </div>
              </div>
              <Button className="mt-6 gap-2" onClick={handleSaveProfile}>
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

          <TabsContent value="consent" className="mt-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-6">Consent Management</h3>
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
                    <p className="text-sm text-muted-foreground">Receive email notifications about your productivity</p>
                  </div>
                  <Switch 
                    checked={settings?.emailNotifications || false} 
                    onCheckedChange={(v) => handleSettingChange('emailNotifications', v)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

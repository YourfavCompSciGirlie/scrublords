import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  User, 
  Briefcase, 
  Users, 
  MessageCircle, 
  VideoIcon,
  Settings,
  Plus,
  FolderSync,
  BookOpen,
  Calendar,
  UserPlus,
  Stethoscope,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { isOnline, hasPendingData, syncData } = useOfflineStorage();

  // Navigation for residents vs other roles
  const navigation = user?.role === 'resident' ? [
    { name: 'Dashboard', href: '/resident-dashboard', icon: LayoutDashboard },
    { name: 'Learning Resources', href: '/learning-resources', icon: BookOpen },
    { name: 'Rotations', href: '/rotations', icon: Calendar },
    { name: 'Mentorship', href: '/mentorship', icon: UserPlus },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Messages', href: '/messages', icon: MessageCircle },
    { name: 'Video Calls', href: '/video-calls', icon: VideoIcon },
  ] : [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Opportunities', href: '/opportunities', icon: Briefcase },
    { name: 'Patients', href: '/patients', icon: Users },
    { name: 'Messages', href: '/messages', icon: MessageCircle },
    { name: 'Video Calls', href: '/video-calls', icon: VideoIcon },
  ];

  const isActive = (href: string) => {
    if (location === href) return true;
    if (user?.role === 'resident' && href === '/resident-dashboard' && location === '/') return true;
    if (user?.role !== 'resident' && href === '/dashboard' && location === '/') return true;
    return false;
  };

  return (
    <aside className="hidden lg:block w-64 bg-card border-r border-border min-h-screen">
      <div className="p-6">
        <nav className="space-y-2">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href}>
              <a
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(item.href)
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
                data-testid={`nav-${item.name.toLowerCase()}`}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.name}
              </a>
            </Link>
          ))}
          
          {user?.role === 'admin' && (
            <Link href="/admin">
              <a
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive('/admin')
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
                data-testid="nav-admin"
              >
                <Settings className="mr-3 h-4 w-4" />
                Admin Panel
              </a>
            </Link>
          )}
        </nav>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</h3>
          <div className="space-y-2">
            {user?.role === 'resident' ? (
              <>
                <Link href="/learning-resources">
                  <Button 
                    className="w-full justify-start" 
                    variant="default"
                    data-testid="button-start-learning"
                  >
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Start Learning
                  </Button>
                </Link>
                <Link href="/mentorship">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    data-testid="button-find-mentor"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Find Mentor
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Button 
                  className="w-full justify-start" 
                  variant="default"
                  data-testid="button-new-patient"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Patient Record
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={syncData}
                  disabled={!isOnline || !hasPendingData}
                  data-testid="button-sync-data"
                >
                  <FolderSync className="mr-2 h-4 w-4" />
                  Sync Data
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Offline Status */}
        <div className="mt-8 p-3 bg-muted rounded-md">
          <div className="flex items-center text-sm">
            <div className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-muted-foreground">
              {isOnline ? 'Online - All synced' : 'Offline mode'}
            </span>
          </div>
          {hasPendingData && (
            <div className="text-xs text-muted-foreground mt-1">
              {hasPendingData ? 'Data pending sync' : 'Last sync: 2 minutes ago'}
            </div>
          )}
        </div>

        {/* User Info & Logout */}
        <div className="mt-8 pt-4 border-t border-border">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={logout}
            className="w-full"
            data-testid="button-logout"
          >
            Logout
          </Button>
        </div>
      </div>
    </aside>
  );
}

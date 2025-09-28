import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  MessageCircle, 
  User,
  BookOpen,
  Calendar,
  UserPlus
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

export default function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  // Navigation for residents vs other roles
  const navigation = user?.role === 'resident' ? [
    { name: 'Dashboard', href: '/resident-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { name: 'Learning', href: '/learning-resources', icon: BookOpen, label: 'Learning' },
    { name: 'Rotations', href: '/rotations', icon: Calendar, label: 'Rotations' },
    { name: 'Messages', href: '/messages', icon: MessageCircle, label: 'Messages', badge: 3 },
    { name: 'Profile', href: '/profile', icon: User, label: 'Profile' },
  ] : [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { name: 'Jobs', href: '/opportunities', icon: Briefcase, label: 'Jobs' },
    { name: 'Patients', href: '/patients', icon: Users, label: 'Patients' },
    { name: 'Messages', href: '/messages', icon: MessageCircle, label: 'Messages', badge: 3 },
    { name: 'Profile', href: '/profile', icon: User, label: 'Profile' },
  ];

  const isActive = (href: string) => {
    if (location === href) return true;
    if (user?.role === 'resident' && href === '/resident-dashboard' && location === '/') return true;
    if (user?.role !== 'resident' && href === '/dashboard' && location === '/') return true;
    return false;
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="grid grid-cols-5 gap-1">
        {navigation.map((item) => (
          <Link key={item.name} href={item.href}>
            <a
              className={`flex flex-col items-center py-2 px-1 relative ${
                isActive(item.href)
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
              data-testid={`mobile-nav-${item.name.toLowerCase()}`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
              {item.badge && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  variant="default"
                >
                  {item.badge}
                </Badge>
              )}
            </a>
          </Link>
        ))}
      </div>
    </nav>
  );
}

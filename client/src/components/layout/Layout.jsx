/**
 * Main Layout Component
 * Shared layout with navigation for authenticated users
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings, 
  LogOut, 
  User,
  BookOpen,
  Clock,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children, userRole }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: `/${userRole}`, icon: Home }
    ];

    switch (userRole) {
      case 'student':
        return [
          ...baseItems,
          { name: 'My Classes', href: '/student/classes', icon: BookOpen },
          { name: 'Attendance', href: '/student/attendance', icon: Clock },
          { name: 'Profile', href: '/student/profile', icon: User }
        ];
      
      case 'teacher':
        return [
          ...baseItems,
          { name: 'My Classes', href: '/teacher/classes', icon: BookOpen },
          { name: 'Attendance', href: '/teacher/attendance', icon: UserCheck },
          { name: 'Students', href: '/teacher/students', icon: Users },
          { name: 'Profile', href: '/teacher/profile', icon: User }
        ];
      
      case 'admin':
        return [
          ...baseItems,
          { name: 'Users', href: '/admin/users', icon: Users },
          { name: 'Classes', href: '/admin/classes', icon: BookOpen },
          { name: 'Attendance', href: '/admin/attendance', icon: UserCheck },
          { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
          { name: 'Settings', href: '/admin/settings', icon: Settings }
        ];
      
      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isCurrentPath = (path) => {
    if (path === `/${userRole}`) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-secondary-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:flex-shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-6 bg-primary-600">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-bold text-sm">SA</span>
            </div>
            <span className="ml-2 text-white font-semibold">Smart Attendance</span>
          </div>
          <button
            className="lg:hidden text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="p-6 border-b border-secondary-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-secondary-500 capitalize">
                {user?.role}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3 pb-20">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isCurrentPath(item.href);
              
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.href);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                    ${isActive 
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600' 
                      : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary-600' : 'text-secondary-400'}`} />
                  {item.name}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Logout button */}
        <div className="absolute bottom-0 w-full p-3 border-t border-secondary-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-secondary-600 rounded-md hover:text-secondary-900 hover:bg-secondary-50 transition-colors duration-200"
          >
            <LogOut className="w-5 h-5 mr-3 text-secondary-400" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-secondary-200">
          <div className="flex items-center h-12 px-4 sm:px-6 lg:px-8 lg:justify-end">
            {/* Mobile menu button - only shown on mobile */}
            <button
              className="lg:hidden text-secondary-600 mr-4"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Spacer for mobile */}
            <div className="flex-1 lg:hidden" />

            {/* Right side header content - positioned at top on desktop */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-600">
                  {user?.email}
                </p>
              </div>
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-600" />
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-2 sm:p-4 lg:p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

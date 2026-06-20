/**
 * Admin Dashboard Component
 * Main dashboard for admin users
 */

import { useEffect, useMemo, useState } from 'react';
import { 
  Users, 
  BookOpen, 
  Clock,
  CalendarCheck,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, attendanceAPI, classAPI } from '../../services/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: '—',
    activeClasses: '—',
    todayAttendance: '—',
    attendanceRate: '—'
  });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const [userStats, attendanceStats, activeClasses] = await Promise.all([
          api.get('/auth/stats'),
          attendanceAPI.getStats(),
          classAPI.getActiveClasses()
        ]);

        if (!mounted) return;

        const overall = attendanceStats.data?.overallStatistics || {};
        setDashboardStats({
          totalUsers: userStats.data?.totalUsers ?? '—',
          activeClasses: activeClasses.data?.classes?.length ?? 0,
          todayAttendance: (overall.presentCount || 0) + (overall.lateCount || 0),
          attendanceRate: overall.attendanceRate != null ? `${overall.attendanceRate}%` : '—'
        });
      } catch (error) {
        console.error('Failed to load admin dashboard data', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => ([
    { title: 'Total Users', value: dashboardStats.totalUsers, icon: Users, color: 'text-primary-600 bg-primary-100' },
    { title: 'Active Classes', value: loading ? 'Loading...' : dashboardStats.activeClasses, icon: BookOpen, color: 'text-success-600 bg-success-100' },
    { title: "Today's Attendance", value: loading ? 'Loading...' : dashboardStats.todayAttendance, icon: CalendarCheck, color: 'text-warning-600 bg-warning-100' },
    { title: 'Attendance Rate', value: loading ? 'Loading...' : dashboardStats.attendanceRate, icon: Clock, color: 'text-secondary-600 bg-secondary-100' }
  ]), [dashboardStats, loading]);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-primary text-white rounded-lg p-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Admin Dashboard
        </h1>
        <p className="opacity-90">
          Monitor system performance and manage all aspects of the attendance system.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-secondary-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card card-hover p-6 text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">
            User Management
          </h3>
          <p className="text-secondary-600 mb-4 text-sm">
            Manage students, teachers, and administrators
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => window.location.href = '/admin/users'}>
            Manage Users
          </button>
        </div>

        <div className="card card-hover p-6 text-center">
          <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-success-600" />
          </div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">
            Analytics
          </h3>
          <p className="text-secondary-600 mb-4 text-sm">
            View comprehensive system analytics
          </p>
          <button className="btn btn-secondary btn-sm" onClick={() => window.location.href = '/admin/analytics'}>
            View Analytics
          </button>
        </div>

      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-secondary-900">
              System Health
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-secondary-600">Database Connection</span>
                <span className="px-2 py-1 bg-success-100 text-success-800 rounded-full text-sm">
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary-600">Face Recognition API</span>
                <span className="px-2 py-1 bg-success-100 text-success-800 rounded-full text-sm">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary-600">Location Services</span>
                <span className="px-2 py-1 bg-success-100 text-success-800 rounded-full text-sm">
                  Running
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-secondary-900">
              Recent Alerts
            </h3>
          </div>
          <div className="card-body">
            <p className="text-secondary-600 text-center py-8">
              No recent alerts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

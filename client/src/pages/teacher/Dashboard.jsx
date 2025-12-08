/**
 * Teacher Dashboard Component
 * Main dashboard for teacher users
 */

import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Calendar,
  BarChart3,
  Plus,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const stats = [
    {
      title: 'Total Classes',
      value: '6',
      icon: BookOpen,
      color: 'text-primary-600 bg-primary-100'
    },
    {
      title: 'Active Students',
      value: '124',
      icon: Users,
      color: 'text-success-600 bg-success-100'
    },
    {
      title: 'Today\'s Attendance',
      value: '89%',
      icon: UserCheck,
      color: 'text-warning-600 bg-warning-100'
    },
    {
      title: 'Classes Today',
      value: '3',
      icon: Clock,
      color: 'text-secondary-600 bg-secondary-100'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-secondary text-white rounded-lg p-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Welcome, Prof. {user?.lastName}
        </h1>
        <p className="opacity-90">
          Manage your classes and track student attendance efficiently.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card card-hover p-6 text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">
            Start Session
          </h3>
          <p className="text-secondary-600 mb-4 text-sm">
            Begin attendance session for your class
          </p>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/teacher/classes')}
          >
            Start Now
          </button>
        </div>

        <div className="card card-hover p-6 text-center">
          <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-success-600" />
          </div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">
            View Reports
          </h3>
          <p className="text-secondary-600 mb-4 text-sm">
            Check attendance reports and analytics
          </p>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/teacher/attendance')}
          >
            View Reports
          </button>
        </div>

        <div className="card card-hover p-6 text-center">
          <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-warning-600" />
          </div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">
            Manage Students
          </h3>
          <p className="text-secondary-600 mb-4 text-sm">
            View and manage enrolled students
          </p>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/teacher/students')}
          >
            Manage
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-secondary-900">
            Recent Activity
          </h3>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-900">Computer Science 101 session completed</p>
                <p className="text-xs text-secondary-500">42 of 45 students attended • 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-900">Chemistry Lab session started</p>
                <p className="text-xs text-secondary-500">28 students present • 3 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-900">Data Structures class scheduled</p>
                <p className="text-xs text-secondary-500">Tomorrow at 2:00 PM • 32 students enrolled</p>
              </div>
            </div>
            <div className="text-center mt-6">
              <button 
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                onClick={() => navigate('/teacher/attendance')}
              >
                View all activity →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;

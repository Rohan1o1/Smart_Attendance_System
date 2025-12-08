/**
 * Teacher Reports Component
 * View attendance reports and analytics
 */

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Filter,
  Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const TeacherReports = () => {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [loading, setLoading] = useState(false);

  // Sample classes data
  const classes = [
    { id: '1', name: 'Computer Science 101', code: 'CS101' },
    { id: '2', name: 'Chemistry Lab', code: 'CHEM201' },
    { id: '3', name: 'Data Structures', code: 'CS301' }
  ];

  // Sample analytics data
  const analyticsData = {
    overall: {
      totalStudents: 115,
      averageAttendance: 89.2,
      totalSessions: 24,
      presentStudents: 102,
      absentStudents: 13,
      trend: 'up'
    },
    classStats: [
      {
        id: '1',
        className: 'Computer Science 101',
        code: 'CS101',
        enrolledStudents: 45,
        averageAttendance: 92.1,
        lastSession: '2024-12-08',
        totalSessions: 8,
        presentToday: 42,
        absentToday: 3,
        trend: 'up'
      },
      {
        id: '2',
        className: 'Chemistry Lab',
        code: 'CHEM201',
        enrolledStudents: 32,
        averageAttendance: 87.5,
        lastSession: '2024-12-08',
        totalSessions: 8,
        presentToday: 28,
        absentToday: 4,
        trend: 'down'
      },
      {
        id: '3',
        className: 'Data Structures',
        code: 'CS301',
        enrolledStudents: 38,
        averageAttendance: 88.7,
        lastSession: '2024-12-06',
        totalSessions: 8,
        presentToday: 32,
        absentToday: 6,
        trend: 'up'
      }
    ],
    weeklyData: [
      { day: 'Mon', attendance: 95 },
      { day: 'Tue', attendance: 87 },
      { day: 'Wed', attendance: 92 },
      { day: 'Thu', attendance: 89 },
      { day: 'Fri', attendance: 84 },
      { day: 'Sat', attendance: 91 },
      { day: 'Sun', attendance: 0 }
    ],
    recentSessions: [
      {
        id: '1',
        className: 'Computer Science 101',
        date: '2024-12-08',
        time: '09:00 AM',
        duration: '90 minutes',
        present: 42,
        absent: 3,
        attendanceRate: 93.3
      },
      {
        id: '2',
        className: 'Chemistry Lab',
        date: '2024-12-08',
        time: '10:00 AM',
        duration: '180 minutes',
        present: 28,
        absent: 4,
        attendanceRate: 87.5
      },
      {
        id: '3',
        className: 'Data Structures',
        date: '2024-12-06',
        time: '02:00 PM',
        duration: '120 minutes',
        present: 32,
        absent: 6,
        attendanceRate: 84.2
      }
    ]
  };

  const exportReport = async (format = 'csv') => {
    try {
      setLoading(true);
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`Report exported successfully as ${format.toUpperCase()}`);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to export report');
      setLoading(false);
    }
  };

  const generateDetailedReport = (classId) => {
    toast.success(`Generating detailed report for ${classes.find(c => c.id === classId)?.name || 'selected class'}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Attendance Reports</h1>
          <p className="text-secondary-600 mt-1">Track and analyze student attendance patterns</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => exportReport('csv')}
            disabled={loading}
            className="btn btn-outline btn-sm flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => exportReport('pdf')}
            disabled={loading}
            className="btn btn-primary btn-sm flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.code})
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Time Period
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="semester">This Semester</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 mb-1">Total Students</p>
              <p className="text-2xl font-bold text-secondary-900">{analyticsData.overall.totalStudents}</p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-100">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 mb-1">Average Attendance</p>
              <p className="text-2xl font-bold text-secondary-900">{analyticsData.overall.averageAttendance}%</p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-100">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-2">
            {analyticsData.overall.trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
            )}
            <span className={`text-sm ${analyticsData.overall.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {analyticsData.overall.trend === 'up' ? '+2.3%' : '-1.2%'} from last week
            </span>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 mb-1">Present Today</p>
              <p className="text-2xl font-bold text-secondary-900">{analyticsData.overall.presentStudents}</p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 mb-1">Total Sessions</p>
              <p className="text-2xl font-bold text-secondary-900">{analyticsData.overall.totalSessions}</p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-100">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Class-wise Performance */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-secondary-900">Class Performance</h3>
        </div>
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Attendance Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Last Session
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Trend
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {analyticsData.classStats.map((cls) => (
                  <tr key={cls.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-secondary-900">{cls.className}</div>
                        <div className="text-sm text-secondary-500">{cls.code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-secondary-900">{cls.enrolledStudents}</div>
                      <div className="text-sm text-secondary-500">
                        {cls.presentToday} present, {cls.absentToday} absent
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-secondary-900">{cls.averageAttendance}%</div>
                      <div className="w-full bg-secondary-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${cls.averageAttendance}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                      {new Date(cls.lastSession).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {cls.trend === 'up' ? (
                          <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                        )}
                        <span className={`text-sm ${cls.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          {cls.trend === 'up' ? 'Improving' : 'Declining'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => generateDetailedReport(cls.id)}
                        className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-secondary-900">Recent Sessions</h3>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            {analyticsData.recentSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h4 className="font-medium text-secondary-900">{session.className}</h4>
                      <p className="text-sm text-secondary-600">
                        {new Date(session.date).toLocaleDateString()} at {session.time}
                      </p>
                    </div>
                    <div className="text-sm text-secondary-600">
                      Duration: {session.duration}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">{session.present}</div>
                    <div className="text-xs text-secondary-500">Present</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600">{session.absent}</div>
                    <div className="text-xs text-secondary-500">Absent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-primary-600">{session.attendanceRate}%</div>
                    <div className="text-xs text-secondary-500">Rate</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherReports;

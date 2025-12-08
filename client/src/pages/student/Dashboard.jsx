/**
 * Student Dashboard Component
 * Main dashboard for student users
 */

import { useState } from 'react';
import { 
  Camera, 
  MapPin, 
  Clock, 
  Calendar, 
  BookOpen, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [attendanceStats] = useState({
    totalClasses: 24,
    attendedClasses: 20,
    percentage: 83.3,
    thisWeek: {
      present: 4,
      total: 5
    }
  });

  const recentClasses = [
    {
      id: 1,
      name: 'Computer Science 101',
      teacher: 'Dr. Smith',
      time: '09:00 AM',
      status: 'present',
      date: '2024-12-04'
    },
    {
      id: 2,
      name: 'Mathematics 201',
      teacher: 'Prof. Johnson',
      time: '11:00 AM',
      status: 'present',
      date: '2024-12-03'
    },
    {
      id: 3,
      name: 'Physics 101',
      teacher: 'Dr. Williams',
      time: '02:00 PM',
      status: 'absent',
      date: '2024-12-02'
    }
  ];

  const upcomingClasses = [
    {
      id: 1,
      name: 'Physics 101',
      teacher: 'Dr. Williams',
      time: '02:00 PM',
      room: 'Room 301',
      canMarkAttendance: true
    },
    {
      id: 2,
      name: 'Chemistry Lab',
      teacher: 'Prof. Davis',
      time: '04:00 PM',
      room: 'Lab B',
      canMarkAttendance: false
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-primary rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.firstName || 'Student'}! 👋
        </h1>
        <p className="opacity-90">
          Ready to mark your attendance? Your classes are waiting.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-base-content/60">Overall Attendance</p>
                <p className="text-2xl font-bold text-primary">{attendanceStats.percentage}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-base-content/60">Classes Attended</p>
                <p className="text-2xl font-bold">{attendanceStats.attendedClasses}/{attendanceStats.totalClasses}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-info/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-base-content/60">This Week</p>
                <p className="text-2xl font-bold">{attendanceStats.thisWeek.present}/{attendanceStats.thisWeek.total}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-base-content/60">Active Classes</p>
                <p className="text-2xl font-bold">{upcomingClasses.filter(c => c.canMarkAttendance).length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mark Attendance Card */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              <Camera className="w-5 h-5 text-primary" />
              Mark Attendance
            </h2>
            
            <div className="space-y-4">
              {upcomingClasses.map((classItem) => (
                <div 
                  key={classItem.id}
                  className={`p-4 rounded-lg border ${
                    classItem.canMarkAttendance 
                      ? 'border-primary/30 bg-primary/5' 
                      : 'border-base-300 bg-base-200/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{classItem.name}</h3>
                      <p className="text-sm text-base-content/60">{classItem.teacher}</p>
                      <div className="flex items-center gap-2 mt-2 text-sm text-base-content/60">
                        <Clock className="w-4 h-4" />
                        <span>{classItem.time}</span>
                        <MapPin className="w-4 h-4 ml-2" />
                        <span>{classItem.room}</span>
                      </div>
                    </div>
                    
                    {classItem.canMarkAttendance ? (
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate('/student/attendance')}
                      >
                        Mark Now
                      </button>
                    ) : (
                      <span className="badge badge-ghost">Not Started</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button 
              className="btn btn-outline btn-primary btn-md w-full mt-4"
              onClick={() => navigate('/student/attendance')}
            >
              <Camera className="w-5 h-5 mr-2" />
              Open Attendance Scanner
            </button>
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              <Clock className="w-5 h-5 text-primary" />
              Recent Attendance
            </h2>
            
            <div className="space-y-3">
              {recentClasses.map((classItem) => (
                <div 
                  key={classItem.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-base-200/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      classItem.status === 'present' 
                        ? 'bg-success/20 text-success' 
                        : 'bg-error/20 text-error'
                    }`}>
                      {classItem.status === 'present' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{classItem.name}</p>
                      <p className="text-sm text-base-content/60">
                        {classItem.date} • {classItem.time}
                      </p>
                    </div>
                  </div>
                  
                  <span className={`badge ${
                    classItem.status === 'present' 
                      ? 'badge-success' 
                      : 'badge-error'
                  }`}>
                    {classItem.status}
                  </span>
                </div>
              ))}
            </div>

            <button
              className="btn btn-outline btn-md w-full mt-4"
              onClick={() => navigate('/student/classes')}
            >
              View All History
            </button>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            Today's Schedule
          </h2>
          
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Subject</th>
                  <th>Teacher</th>
                  <th>Room</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>09:00 - 10:30</td>
                  <td>Computer Science 101</td>
                  <td>Dr. Smith</td>
                  <td>Room 201</td>
                  <td><span className="badge badge-success">Attended</span></td>
                </tr>
                <tr>
                  <td>11:00 - 12:30</td>
                  <td>Mathematics 201</td>
                  <td>Prof. Johnson</td>
                  <td>Room 105</td>
                  <td><span className="badge badge-success">Attended</span></td>
                </tr>
                <tr className="bg-primary/5">
                  <td>14:00 - 15:30</td>
                  <td>Physics 101</td>
                  <td>Dr. Williams</td>
                  <td>Room 301</td>
                  <td><span className="badge badge-warning">In Progress</span></td>
                </tr>
                <tr>
                  <td>16:00 - 17:30</td>
                  <td>Chemistry Lab</td>
                  <td>Prof. Davis</td>
                  <td>Lab B</td>
                  <td><span className="badge badge-ghost">Upcoming</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <button
              className="btn btn-outline btn-md w-full"
              onClick={() => navigate('/student/classes')}
            >
              View Full Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

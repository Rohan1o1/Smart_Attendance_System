/**
 * Teacher Attendance Management Component
 * Manage attendance sessions and track student attendance
 */

import { useState, useEffect } from 'react';
import { 
  Clock, 
  Users, 
  PlayCircle, 
  StopCircle, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  MapPin, 
  BarChart3, 
  Download, 
  Filter,
  Search,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const TeacherAttendance = () => {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Sample data
  const classes = [
    { id: '1', name: 'Computer Science 101', code: 'CS101' },
    { id: '2', name: 'Chemistry Lab', code: 'CHEM201' },
    { id: '3', name: 'Data Structures', code: 'CS301' }
  ];

  const sampleSessions = [
    {
      id: '1',
      classId: '1',
      className: 'Computer Science 101',
      classCode: 'CS101',
      date: '2024-12-08',
      startTime: '09:00',
      endTime: '10:30',
      status: 'completed',
      location: 'Lab A, Engineering Building',
      totalStudents: 45,
      presentStudents: 42,
      absentStudents: 3,
      attendanceRate: 93.3,
      attendees: [
        { id: '1', name: 'John Doe', studentId: 'CS2024001', timeMarked: '09:05', status: 'present' },
        { id: '2', name: 'Jane Smith', studentId: 'CS2024002', timeMarked: '09:08', status: 'present' },
        { id: '3', name: 'Mike Johnson', studentId: 'CS2024003', timeMarked: null, status: 'absent' }
      ]
    },
    {
      id: '2',
      classId: '2',
      className: 'Chemistry Lab',
      classCode: 'CHEM201',
      date: '2024-12-08',
      startTime: '10:00',
      endTime: '13:00',
      status: 'active',
      location: 'Chemistry Lab, Science Building',
      totalStudents: 32,
      presentStudents: 28,
      absentStudents: 4,
      attendanceRate: 87.5,
      attendees: [
        { id: '4', name: 'Sarah Williams', studentId: 'CHEM2024001', timeMarked: '10:15', status: 'present' },
        { id: '5', name: 'David Brown', studentId: 'CHEM2024002', timeMarked: '10:20', status: 'present' }
      ]
    },
    {
      id: '3',
      classId: '1',
      className: 'Computer Science 101',
      classCode: 'CS101',
      date: '2024-12-07',
      startTime: '09:00',
      endTime: '10:30',
      status: 'completed',
      location: 'Lab A, Engineering Building',
      totalStudents: 45,
      presentStudents: 40,
      absentStudents: 5,
      attendanceRate: 88.9,
      attendees: []
    }
  ];

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSessions(sampleSessions);
      
      // Check for active session
      const active = sampleSessions.find(s => s.status === 'active');
      setActiveSession(active);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      toast.error('Failed to load attendance sessions');
      setLoading(false);
    }
  };

  const startSession = async (classId) => {
    try {
      const classInfo = classes.find(c => c.id === classId);
      if (!classInfo) {
        toast.error('Class not found');
        return;
      }

      const newSession = {
        id: Date.now().toString(),
        classId,
        className: classInfo.name,
        classCode: classInfo.code,
        date: new Date().toISOString().split('T')[0],
        startTime: new Date().toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        endTime: null,
        status: 'active',
        location: 'Classroom Location',
        totalStudents: 45,
        presentStudents: 0,
        absentStudents: 0,
        attendanceRate: 0,
        attendees: []
      };

      setSessions(prev => [newSession, ...prev]);
      setActiveSession(newSession);
      toast.success(`Attendance session started for ${classInfo.name}`);
    } catch (error) {
      console.error('Failed to start session:', error);
      toast.error('Failed to start attendance session');
    }
  };

  const endSession = async (sessionId) => {
    try {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) {
        toast.error('Session not found');
        return;
      }

      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { 
              ...s, 
              status: 'completed',
              endTime: new Date().toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit' 
              })
            }
          : s
      ));
      setActiveSession(null);
      toast.success(`Session ended for ${session.className}`);
    } catch (error) {
      console.error('Failed to end session:', error);
      toast.error('Failed to end attendance session');
    }
  };

  const exportAttendance = (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      toast.success(`Exporting attendance for ${session.className}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'completed':
        return 'text-blue-600 bg-blue-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <PlayCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = 
      session.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.classCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = selectedClass === 'all' || session.classId === selectedClass;
    const matchesDate = !selectedDate || session.date === selectedDate;

    return matchesSearch && matchesClass && matchesDate;
  });

  const todaySessions = sessions.filter(s => s.date === new Date().toISOString().split('T')[0]);
  const totalTodayStudents = todaySessions.reduce((acc, s) => acc + s.totalStudents, 0);
  const totalPresentToday = todaySessions.reduce((acc, s) => acc + s.presentStudents, 0);
  const averageAttendanceToday = totalTodayStudents > 0 ? (totalPresentToday / totalTodayStudents * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-secondary-600">Loading attendance sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Attendance Management</h1>
          <p className="text-secondary-600 mt-1">Manage attendance sessions and track student attendance</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 mb-1">Active Sessions</p>
              <p className="text-2xl font-bold text-secondary-900">
                {sessions.filter(s => s.status === 'active').length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-100">
              <PlayCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 mb-1">Today's Sessions</p>
              <p className="text-2xl font-bold text-secondary-900">{todaySessions.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-100">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 mb-1">Present Today</p>
              <p className="text-2xl font-bold text-secondary-900">{totalPresentToday}</p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 mb-1">Avg. Attendance</p>
              <p className="text-2xl font-bold text-secondary-900">{averageAttendanceToday.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-100">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Active Session Alert */}
      {activeSession && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <PlayCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-green-900">Active Session</h4>
                <p className="text-sm text-green-700">
                  {activeSession.className} - Started at {activeSession.startTime}
                </p>
              </div>
            </div>
            <button
              onClick={() => endSession(activeSession.id)}
              className="btn btn-warning btn-sm flex items-center space-x-2"
            >
              <StopCircle className="w-4 h-4" />
              <span>End Session</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Start Session */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Start New Session</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {classes.map(cls => (
            <button
              key={cls.id}
              onClick={() => startSession(cls.id)}
              disabled={activeSession?.classId === cls.id}
              className={`p-4 border rounded-lg text-left transition-colors ${
                activeSession?.classId === cls.id
                  ? 'border-green-200 bg-green-50 cursor-not-allowed'
                  : 'border-secondary-200 hover:border-primary-300 hover:bg-primary-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-secondary-900">{cls.name}</h4>
                  <p className="text-sm text-secondary-600">{cls.code}</p>
                </div>
                {activeSession?.classId === cls.id ? (
                  <span className="text-green-600 text-xs font-medium">Active</span>
                ) : (
                  <PlayCircle className="w-5 h-5 text-primary-600" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by class name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Class Filter */}
          <div className="w-full lg:w-48">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.code}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="w-full lg:w-40">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-secondary-900">Attendance Sessions</h3>
        </div>
        <div className="card-body">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">No Sessions Found</h3>
              <p className="text-secondary-600">
                No attendance sessions match your current filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSessions.map(session => (
                <div key={session.id} className="border border-secondary-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                          {getStatusIcon(session.status)}
                          <span className="ml-1 capitalize">{session.status}</span>
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-secondary-900">{session.className}</h4>
                        <p className="text-sm text-secondary-600">{session.classCode}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-secondary-900">{session.attendanceRate}%</p>
                      <p className="text-xs text-secondary-500">
                        {session.presentStudents}/{session.totalStudents} present
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center text-secondary-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(session.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-secondary-600">
                      <Clock className="w-4 h-4 mr-2" />
                      {session.startTime} - {session.endTime || 'Ongoing'}
                    </div>
                    <div className="flex items-center text-secondary-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {session.location}
                    </div>
                    <div className="flex items-center text-secondary-600">
                      <Users className="w-4 h-4 mr-2" />
                      {session.totalStudents} students
                    </div>
                  </div>

                  <div className="flex justify-end mt-4 space-x-2">
                    <button
                      onClick={() => exportAttendance(session.id)}
                      className="btn btn-outline btn-sm flex items-center space-x-1"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </button>
                    {session.status === 'active' && (
                      <button
                        onClick={() => endSession(session.id)}
                        className="btn btn-warning btn-sm flex items-center space-x-1"
                      >
                        <StopCircle className="w-4 h-4" />
                        <span>End Session</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherAttendance;

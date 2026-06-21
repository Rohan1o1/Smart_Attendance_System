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
  TrendingDown,
  Edit
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { attendanceAPI, classAPI } from '../../services/api';

const TeacherAttendance = () => {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [classesError, setClassesError] = useState(null);
  const [updatingAttendanceId, setUpdatingAttendanceId] = useState(null);

  const getClassStudentCount = (classItem) => (
    classItem.assignedStudentsCount ??
    classItem.statistics?.totalStudents ??
    (Array.isArray(classItem.enrolledStudents) ? classItem.enrolledStudents.length : classItem.enrolledStudents || 0)
  );

  const formatSessionTime = (value, fallback = '00:00') => {
    if (!value) return fallback;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
  fetchSessions();
  fetchClasses();
  }, [selectedDate]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      // There is not a dedicated 'sessions' endpoint; infer sessions from classes (active/completed)
      const activeResponse = await classAPI.getActiveClasses();
      const myResponse = await classAPI.getMyClasses();

      const activeClasses = activeResponse.success ? (activeResponse.data.classes || activeResponse.data || []) : [];
      const myClasses = myResponse.success ? (myResponse.data.classes || myResponse.data || []) : [];

      const reports = await Promise.all(myClasses.map(async (c) => {
        const classId = c._id || c.id;
        try {
          const report = await attendanceAPI.getClassAttendance(classId, { limit: 100 });
          return [String(classId), report.data || {}];
        } catch (error) {
          console.error(`Failed to load attendance report for class ${classId}`, error);
          return [String(classId), null];
        }
      }));
      const reportByClassId = new Map(reports);

      // Map classes to a session-like shape for display
      const mapped = myClasses.map(c => {
        const classId = c._id || c.id;
        const report = reportByClassId.get(String(classId));
        const summary = report?.summary || {};
        const attendanceRecords = report?.attendanceRecords || [];
        const attendees = attendanceRecords;
        const totalStudents = summary.totalAssigned ?? getClassStudentCount(c);
        const presentFromRecords = attendees.filter((record) => (
          ['present', 'late'].includes(record.status)
        )).length;
        const presentStudents = presentFromRecords;

        return {
        id: classId,
        classId,
        className: c.subject || c.name,
        classCode: c.subjectCode || c.code,
        date: selectedDate,
        startTime: c.sessionStartTime ? formatSessionTime(c.sessionStartTime) : (c.schedule?.startTime || '00:00'),
        endTime: c.sessionEndTime ? formatSessionTime(c.sessionEndTime) : (c.schedule?.endTime || '00:00'),
        status: (activeClasses.find(ac => String(ac._id || ac.id) === String(classId)) ? 'active' : (c.status || 'scheduled')),
        location: c.classroom || c.teacherLocation?.address || 'TBA',
        totalStudents,
        presentStudents,
        attendanceRate: totalStudents ? Math.round((presentStudents / totalStudents) * 100) : 0,
        attendees
      };
      });

      setSessions(mapped);
      const active = mapped.find(s => s.status === 'active');
      setActiveSession(active || null);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      toast.error('Failed to load attendance sessions');
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      setClassesLoading(true);
      const response = await classAPI.getMyClasses();
      if (response.success) {
        setClasses(response.data.classes || response.data || []);
      } else {
        setClasses([]);
        setClassesError(response.message || 'Failed to load classes');
      }
    } catch (err) {
      console.error('Failed to fetch teacher classes:', err);
      setClasses([]);
      setClassesError(err?.message || 'Failed to load classes');
    } finally {
      setClassesLoading(false);
    }
  };

  const startSession = async (classId) => {
    try {
      // Normalize lookup: classes may be an array of objects with either `_id` or `id` and fields like `subject`/`subjectCode` or `name`/`code`.
      const classInfo = classes.find(c => String(c._id || c.id) === String(classId));
      if (!classInfo) {
        toast.error('Class not found');
        return;
      }

      const className = classInfo.subject || classInfo.name || classInfo.className || 'Class';
      const classCode = classInfo.subjectCode || classInfo.code || classInfo.classCode || '';

      // Acquire geolocation from browser (server requires location)
      if (!('geolocation' in navigator)) {
        toast.error('Geolocation is not available in your browser. Location is required to start a session.');
        return;
      }

      let position;
      try {
        position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, (err) => reject(err), {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });
      } catch (geoErr) {
        console.error('Geolocation error:', geoErr);
        if (geoErr.code === 1) {
          toast.error('Location permission denied. Please allow location access to start a session.');
        } else if (geoErr.code === 3) {
          toast.error('Unable to retrieve location (timeout). Try again.');
        } else {
          toast.error('Failed to obtain location. Location is required to start a session.');
        }
        return;
      }

      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp || new Date().toISOString()
      };

      // Call backend to start session (backend will validate teacher location/permission)
      try {
        const resp = await classAPI.startSession(classId, { location });
        if (!resp || !resp.success) {
          // Prefer detailed error messages returned by API
          const message = resp?.message || resp?.errors || 'Failed to start session on server';
          // If server returned a locationError, show it too
          if (resp?.locationError) {
            toast.error(`${message}: ${resp.locationError}`);
          } else {
            toast.error(message);
          }
          console.error('Start session API error:', resp);
          return;
        }

        // Server returns class and attendanceWindow; map to UI session shape
        const returnedClass = resp.data?.class || resp.data;
        const attendanceWindow = resp.data?.attendanceWindow || null;

        const serverSession = {
          id: returnedClass._id || returnedClass.id || Date.now().toString(),
          classId: returnedClass._id || returnedClass.id,
          className: returnedClass.subject || returnedClass.name || className,
          classCode: returnedClass.subjectCode || returnedClass.code || classCode,
          date: getLocalDateString(),
          startTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
          endTime: null,
          status: 'active',
          location: returnedClass.classroom || returnedClass.teacherLocation?.address || 'Classroom',
          totalStudents: getClassStudentCount(returnedClass),
          presentStudents: 0,
          attendanceRate: 0,
          attendees: [],
          attendanceWindow
        };

        setSessions(prev => [serverSession, ...prev.filter(s => s.classId !== serverSession.classId)]);
        setActiveSession(serverSession);
        toast.success(`Attendance session started for ${serverSession.className}`);

      } catch (apiErr) {
        console.error('Start session API error:', apiErr);
        toast.error(apiErr?.message || 'Failed to start session (server)');
      }
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

      const response = await classAPI.endSession(session.classId);

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
      const markedAbsent = response?.data?.absenceSummary?.markedAbsent || 0;
      toast.success(
        markedAbsent > 0
          ? `Session ended for ${session.className}. ${markedAbsent} student${markedAbsent === 1 ? '' : 's'} marked absent.`
          : `Session ended for ${session.className}`
      );
      fetchSessions();
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
      (session.className || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (session.classCode || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = selectedClass === 'all' || String(session.classId) === String(selectedClass);
    const matchesDate = !selectedDate || session.date === selectedDate;

    return matchesSearch && matchesClass && matchesDate;
  });

  const todaySessions = sessions.filter(s => s.date === getLocalDateString());
  const totalTodayStudents = todaySessions.reduce((acc, s) => acc + s.totalStudents, 0);
  const totalPresentToday = todaySessions.reduce((acc, s) => acc + s.presentStudents, 0);
  const averageAttendanceToday = totalTodayStudents > 0 ? (totalPresentToday / totalTodayStudents * 100) : 0;

  const updateAttendanceStatus = async (sessionId, attendanceId, status) => {
    try {
      setUpdatingAttendanceId(attendanceId);
      const response = await attendanceAPI.updateAttendance(attendanceId, {
        status,
        notes: `Updated by ${user?.firstName || 'teacher'} ${user?.lastName || ''}`.trim()
      });

      if (!response.success) {
        toast.error(response.message || 'Failed to update attendance');
        return;
      }

      setSessions(prev => prev.map(session => {
        if (session.id !== sessionId) return session;

        const attendees = session.attendees.map(record => (
          String(record.id || record._id) === String(attendanceId)
            ? { ...record, status }
            : record
        ));
        const presentStudents = attendees.filter(record => ['present', 'late'].includes(record.status)).length;

        return {
          ...session,
          attendees,
          presentStudents,
          attendanceRate: session.totalStudents ? Math.round((presentStudents / session.totalStudents) * 100) : 0
        };
      }));

      toast.success('Attendance updated');
    } catch (error) {
      console.error('Failed to update attendance:', error);
      toast.error(error?.message || 'Failed to update attendance');
    } finally {
      setUpdatingAttendanceId(null);
    }
  };

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
              key={cls._id || cls.id}
              onClick={() => startSession(cls._id || cls.id)}
              disabled={String(activeSession?.classId) === String(cls._id || cls.id)}
              className={`p-4 border rounded-lg text-left transition-colors ${
                String(activeSession?.classId) === String(cls._id || cls.id)
                  ? 'border-green-200 bg-green-50 cursor-not-allowed'
                  : 'border-secondary-200 hover:border-primary-300 hover:bg-primary-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-secondary-900">{cls.subject || cls.name}</h4>
                  <p className="text-sm text-secondary-600">{cls.subjectCode || cls.code}</p>
                </div>
                {String(activeSession?.classId) === String(cls._id || cls.id) ? (
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
                <option key={cls._id || cls.id} value={cls._id || cls.id}>
                  {cls.subjectCode || cls.code}
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
                      {session.presentStudents} present / {session.totalStudents} enrolled
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

                  <div className="mt-4 border-t border-secondary-200 pt-4">
                    <h5 className="text-sm font-medium text-secondary-900 mb-3">
                      Student Records
                    </h5>
                    {session.attendees.length === 0 ? (
                      <p className="text-sm text-secondary-500">
                        No attendance records for this date yet.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="text-left text-secondary-500">
                              <th className="py-2 pr-4 font-medium">Student</th>
                              <th className="py-2 pr-4 font-medium">Roll</th>
                              <th className="py-2 pr-4 font-medium">Status</th>
                              <th className="py-2 pr-4 font-medium">Time</th>
                              <th className="py-2 font-medium">Edit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-secondary-100">
                            {session.attendees.map(record => {
                              const attendanceId = record.id || record._id;
                              const student = record.studentId || {};
                              const studentName = student.firstName
                                ? `${student.firstName} ${student.lastName || ''}`.trim()
                                : record.studentName;

                              return (
                                <tr key={attendanceId}>
                                  <td className="py-2 pr-4 text-secondary-900">{studentName}</td>
                                  <td className="py-2 pr-4 text-secondary-600">
                                    {student.studentId || record.studentRollNumber || '-'}
                                  </td>
                                  <td className="py-2 pr-4">
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                      ['present', 'late'].includes(record.status)
                                        ? 'bg-green-100 text-green-700'
                                        : record.status === 'absent'
                                          ? 'bg-red-100 text-red-700'
                                          : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                      {record.status}
                                    </span>
                                  </td>
                                  <td className="py-2 pr-4 text-secondary-600">
                                    {record.timestamp ? new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                  </td>
                                  <td className="py-2">
                                    <div className="flex items-center gap-2">
                                      <Edit className="w-4 h-4 text-secondary-400" />
                                      <select
                                        value={record.status}
                                        disabled={updatingAttendanceId === attendanceId}
                                        onChange={(event) => updateAttendanceStatus(session.id, attendanceId, event.target.value)}
                                        className="px-2 py-1 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                      >
                                        <option value="present">Present</option>
                                        <option value="late">Late</option>
                                        <option value="absent">Absent</option>
                                        <option value="excused">Excused</option>
                                      </select>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
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

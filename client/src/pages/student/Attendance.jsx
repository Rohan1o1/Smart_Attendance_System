/**
 * Student Attendance Page
 * Shows available classes and allows marking attendance
 */

import { useState, useEffect } from 'react';
import { Clock, MapPin, Users, Calendar, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { classAPI, attendanceAPI } from '../../services/api';
import MarkAttendance from './MarkAttendance';

const StudentAttendance = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);

  useEffect(() => {
    loadData();
    // Refresh data every 30 seconds to check for new sessions
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load enrolled classes and active sessions
      const [classesResponse, attendanceResponse] = await Promise.all([
        classAPI.getEnrolledClasses(),
        attendanceAPI.getAttendance({ 
          studentId: user._id,
          limit: 5,
          sort: '-createdAt'
        })
      ]);

      setClasses(classesResponse.data || []);
      setRecentAttendance(attendanceResponse.data || []);

      // Filter active sessions
      const activeSessionsList = (classesResponse.data || [])
        .filter(cls => cls.currentSession && cls.currentSession.isActive)
        .map(cls => ({
          ...cls.currentSession,
          className: cls.name,
          classId: cls._id,
          instructor: cls.instructor
        }));

      setActiveSessions(activeSessionsList);

    } catch (error) {
      console.error('Failed to load data:', error);
      setError(error.message || 'Failed to load attendance data');
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = (session) => {
    setSelectedSession(session);
  };

  const handleAttendanceSuccess = (attendanceData) => {
    setSelectedSession(null);
    loadData(); // Refresh data
    toast.success('Attendance marked successfully!');
  };

  const handleAttendanceCancel = () => {
    setSelectedSession(null);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-secondary-600">Loading attendance data...</span>
      </div>
    );
  }

  if (selectedSession) {
    return (
      <MarkAttendance
        classSession={selectedSession}
        onSuccess={handleAttendanceSuccess}
        onCancel={handleAttendanceCancel}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
            Attendance
          </h1>
          <p className="text-secondary-600 mt-1">
            Mark your attendance for active sessions
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-error-800 font-medium">Error</h4>
            <p className="text-error-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Active Sessions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-secondary-900">
            Active Sessions
          </h2>
          <button
            onClick={loadData}
            className="btn btn-secondary btn-sm"
          >
            Refresh
          </button>
        </div>

        {activeSessions.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-12">
              <Clock className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 mb-2">
                No Active Sessions
              </h3>
              <p className="text-secondary-600">
                There are no active attendance sessions at the moment. Check back later or contact your instructor.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {activeSessions.map((session) => (
              <div key={session._id} className="card card-hover">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-3 h-3 bg-success-500 rounded-full animate-pulse"></div>
                        <h3 className="text-lg font-semibold text-secondary-900">
                          {session.className}
                        </h3>
                        <span className="px-2 py-1 bg-success-100 text-success-800 rounded-full text-xs font-medium">
                          Active
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-secondary-600">
                          <Users className="w-4 h-4" />
                          <span>Instructor: {session.instructor?.firstName} {session.instructor?.lastName}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-secondary-600">
                          <Clock className="w-4 h-4" />
                          <span>
                            Started: {formatTime(session.startTime)}
                            {session.endTime && (
                              <span className="ml-2 text-warning-600">
                                ({getTimeRemaining(session.endTime)})
                              </span>
                            )}
                          </span>
                        </div>
                        
                        {session.location && (
                          <div className="flex items-center gap-2 text-sm text-secondary-600">
                            <MapPin className="w-4 h-4" />
                            <span>{session.location.address || 'Location available'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleMarkAttendance(session)}
                      className="btn btn-primary flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Mark Attendance
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enrolled Classes */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-secondary-900">
          Enrolled Classes
        </h2>

        {classes.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-8">
              <Calendar className="w-10 h-10 text-secondary-400 mx-auto mb-3" />
              <p className="text-secondary-600">No enrolled classes found.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <div key={cls._id} className="card">
                <div className="card-body">
                  <h3 className="font-semibold text-secondary-900 mb-2">
                    {cls.name}
                  </h3>
                  <p className="text-sm text-secondary-600 mb-3">
                    {cls.description}
                  </p>
                  
                  <div className="space-y-1 text-sm text-secondary-600">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{cls.instructor?.firstName} {cls.instructor?.lastName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{cls.schedule || 'Schedule TBA'}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary-600">Status:</span>
                      <span className={`font-medium ${
                        cls.currentSession?.isActive 
                          ? 'text-success-600' 
                          : 'text-secondary-600'
                      }`}>
                        {cls.currentSession?.isActive ? 'Session Active' : 'No Active Session'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Attendance */}
      {recentAttendance.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-secondary-900">
            Recent Attendance
          </h2>

          <div className="card">
            <div className="card-body">
              <div className="space-y-4">
                {recentAttendance.map((record, index) => (
                  <div key={record._id || index} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                      <div>
                        <p className="font-medium text-secondary-900">
                          {record.class?.name || 'Unknown Class'}
                        </p>
                        <p className="text-sm text-secondary-600">
                          {formatDate(record.timestamp)} at {formatTime(record.timestamp)}
                        </p>
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-success-600" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAttendance;

/**
 * Teacher Classes Component
 * Manage classes and start attendance sessions
 */

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  PlayCircle,
  PauseCircle,
  Users,
  ChevronRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { classAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

const TeacherClasses = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use user assignment to filter classes (department/semester/section)
      const params = {};
      if (user?.department) params.department = user.department;
      if (user?.semester) params.semester = user.semester;
      if (user?.section) params.section = user.section;
      const res = await classAPI.getMyClasses(params);
      const data = res && res.data ? res.data : res;
      const items = data.classes || data;
      const mappedItems = items.map((c, idx) => {
        // Some server responses use `id` instead of `_id` (models transform).
        const id = c._id || c.id || `tmp-${idx}`;
        return {
          _id: id,
          subject: c.subject,
          subjectCode: c.subjectCode,
          department: c.department,
          schedule: c.schedule || {},
          location: c.location || {},
          enrolledStudents: Array.isArray(c.enrolledStudents) ? c.enrolledStudents.length : (c.enrolledStudents || 0),
          attendanceWindow: c.attendanceWindow || {},
          status: c.status || 'scheduled'
        };
      });
  console.debug('Fetched classes:', mappedItems.map(mi => ({ id: mi._id, subject: mi.subject, status: mi.status })), 'filterParams:', params);
      setClasses(mappedItems);
    } catch (err) {
      console.error('Failed to fetch teacher classes', err);
      setError(err?.response?.data?.message || err.message || 'Failed to load classes');
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startAttendanceSession = async (classId) => {
    if (!classId) {
      console.warn('startAttendanceSession called without classId');
      return;
    }

    setActionLoading(classId);
    try {
      // Require browser geolocation for teacher location
      if (!navigator.geolocation) {
        toast.error('Geolocation is not supported by your browser');
        setActionLoading(null);
        return;
      }

      // Increase timeout to 25s and allow for higher accuracy when available
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 25000, maximumAge: 5000 });
      }).catch(err => {
        // Surface friendly error to user
        if (err && err.code === 1) {
          throw new Error('Location permission denied. Please allow location access to start a class.');
        }
        if (err && err.code === 2) {
          throw new Error('Location unavailable. Ensure your device has a working GPS signal.');
        }
        if (err && err.code === 3) {
          throw new Error('Location acquisition timed out. Try again or move to an area with better reception.');
        }
        throw err;
      });

      const location = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy || 0
      };

      // Don't send empty address strings - Joi will reject empty strings for optional fields.
      if (pos?.coords?.address) {
        location.address = pos.coords.address;
      }

      // Call server to start session (server will validate geofence and store teacherLocation)
      const res = await classAPI.startSession(classId, { location });
      const returned = res && res.data ? res.data : res;
      const returnedClass = returned.class;

      // Update local state with server result
      setActiveSession(classId);
      toast.success(returned.message || 'Session started');
      setClasses(prev => prev.map(c => (
        String(c._id) === String(classId) ? { ...c, status: 'active', teacherLocation: returnedClass?.teacherLocation || c.teacherLocation, sessionStartTime: returnedClass?.sessionStartTime || c.sessionStartTime } : c
      )));
    } catch (err) {
      console.error('Failed to start session:', err);
      // The API wrapper sometimes throws our own error object; normalize check
      const apiData = err?.response?.data || (err && typeof err === 'object' ? err : null);
      const msg = apiData?.message || err?.message || 'Failed to start attendance session';
      const locationError = apiData?.locationError || apiData?.details?.message || apiData?.details?.message || apiData?.details;
      if (locationError) {
        // If details is an object, JSON stringify a short version
        const locMsg = typeof locationError === 'string' ? locationError : JSON.stringify(locationError);
        toast.error(`${msg}: ${locMsg}`);
      } else {
        toast.error(msg);
      }
    } finally {
      setActionLoading(null);
    }
  };
  const endAttendanceSession = async (classId) => {
    if (!classId) return;
    setActionLoading(classId);
    try {
      const res = await classAPI.endSession(classId);
      const returned = res && res.data ? res.data : res;
      const returnedClass = returned.class;

      setActiveSession(null);
      toast.success(returned.message || 'Session ended');

      setClasses(prev => prev.map(c => 
        String(c._id) === String(classId) 
          ? { ...c, status: 'completed', sessionEndTime: returnedClass?.sessionEndTime || new Date().toISOString() }
          : c
      ));
    } catch (error) {
      console.error('Failed to end session:', error);
      toast.error(error?.response?.data?.message || error.message || 'Failed to end attendance session');
    } finally {
      setActionLoading(null);
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

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Session Active';
      case 'completed':
        return 'Session Ended';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Scheduled';
    }
  };

  const isToday = (dayOfWeek) => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return today === dayOfWeek;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-secondary-600">Loading your classes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-secondary-900 mb-2">Error Loading Classes</h3>
        <p className="text-secondary-600 mb-6">{error}</p>
        <button 
          onClick={fetchClasses}
          className="btn btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-secondary-900 mb-2">No Classes Found</h3>
        <p className="text-secondary-600">You don't have any classes assigned yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Your Classes</h1>
          <p className="text-secondary-600 mt-1">Manage attendance sessions for your classes</p>
        </div>
        <div className="text-sm text-secondary-600">
          {classes.length} class{classes.length !== 1 ? 'es' : ''} found
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classItem, idx) => (
          <div key={classItem._id || `class-${idx}`} className="card overflow-hidden">
            {/* Class Header */}
            <div className="p-6 pb-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-1">
                    {classItem.subject}
                  </h3>
                  <p className="text-sm text-secondary-600 mb-2">{classItem.subjectCode}</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(classItem.status)}`}>
                    {getStatusText(classItem.status)}
                  </span>
                </div>
                <BookOpen className="w-8 h-8 text-primary-600" />
              </div>

              {/* Schedule Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-secondary-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className={isToday(classItem.schedule.dayOfWeek) ? 'font-semibold text-primary-600' : ''}>
                    {classItem.schedule.dayOfWeek}s
                  </span>
                </div>
                <div className="flex items-center text-sm text-secondary-600">
                  <Clock className="w-4 h-4 mr-2" />
                  {classItem.schedule.startTime} - {classItem.schedule.endTime}
                </div>
                <div className="flex items-center text-sm text-secondary-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  {classItem.location.address}
                </div>
                <div className="flex items-center text-sm text-secondary-600">
                  <Users className="w-4 h-4 mr-2" />
                  {classItem.enrolledStudents} students enrolled
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 pb-6">
              {classItem.status === 'scheduled' && (
                <button
                  onClick={() => startAttendanceSession(classItem._id)}
                  className="w-full btn btn-primary btn-sm flex items-center justify-center space-x-2"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Start Session</span>
                </button>
              )}
              
              {classItem.status === 'active' && (
                <div className="space-y-2">
                  <button
                    onClick={() => endAttendanceSession(classItem._id)}
                    className="w-full btn btn-warning btn-sm flex items-center justify-center space-x-2"
                  >
                    <PauseCircle className="w-4 h-4" />
                    <span>End Session</span>
                  </button>
                  <p className="text-xs text-center text-green-600">
                    Session active - Students can mark attendance
                  </p>
                </div>
              )}
              
              {classItem.status === 'completed' && (
                <button
                  className="w-full btn btn-secondary btn-sm flex items-center justify-center space-x-2"
                  disabled
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Session Completed</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Today's Classes Highlight */}
      {classes.filter(c => isToday(c.schedule.dayOfWeek)).length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <h4 className="font-semibold text-primary-900 mb-2">Today's Classes</h4>
          <div className="space-y-2">
            {classes
              .filter(c => isToday(c.schedule.dayOfWeek))
              .map(classItem => (
                <div key={`today-${classItem._id}`} className="flex items-center justify-between bg-white p-3 rounded">
                  <div>
                    <p className="font-medium text-secondary-900">{classItem.subject}</p>
                    <p className="text-sm text-secondary-600">
                      {classItem.schedule.startTime} - {classItem.schedule.endTime}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(classItem.status)}`}>
                    {getStatusText(classItem.status)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherClasses;

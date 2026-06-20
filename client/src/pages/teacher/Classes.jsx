/**
 * Teacher Classes Component
 * Manage classes and start attendance sessions
 */

import React, { useState, useEffect, useMemo } from 'react';
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

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SLOT_MINUTES = 30;
const SCHEDULE_START_MINUTES = 9 * 60;
const SCHEDULE_END_MINUTES = 17 * 60;

function toMinutes(time) {
  const [hours, minutes] = String(time).split(':').map(Number);
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
}

function fromMinutes(minutes) {
  const boundedMinutes = Math.max(0, Math.min(minutes, 23 * 60 + 59));
  const hours = Math.floor(boundedMinutes / 60);
  const mins = boundedMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

const TIME_SLOTS = Array.from(
  { length: (SCHEDULE_END_MINUTES - SCHEDULE_START_MINUTES) / SLOT_MINUTES },
  (_, index) => fromMinutes(SCHEDULE_START_MINUTES + index * SLOT_MINUTES)
);
const BREAK_SLOTS = new Set(['12:00']);
const DEFAULT_DURATION_MINUTES = 60;
const colorClasses = [
  'border-blue-200 bg-blue-50 text-blue-900',
  'border-emerald-200 bg-emerald-50 text-emerald-900',
  'border-amber-200 bg-amber-50 text-amber-900',
  'border-rose-200 bg-rose-50 text-rose-900',
  'border-violet-200 bg-violet-50 text-violet-900',
  'border-cyan-200 bg-cyan-50 text-cyan-900'
];

const getClassId = (classItem) => classItem?._id || classItem?.id;

const getClassDuration = (classItem) => {
  const duration = Number(classItem?.schedule?.duration);
  if (Number.isFinite(duration) && duration > 0) return duration;
  const start = toMinutes(classItem?.schedule?.startTime);
  const end = toMinutes(classItem?.schedule?.endTime);
  return Math.max(SLOT_MINUTES, end - start || DEFAULT_DURATION_MINUTES);
};

const getClassEndTime = (classItem) => fromMinutes(toMinutes(classItem?.schedule?.startTime) + getClassDuration(classItem));

const TeacherClasses = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [viewMode, setViewMode] = useState('list');

  const subjectColorMap = useMemo(() => {
    const map = new Map();
    classes.forEach((item) => {
      const key = item.subjectCode || item.subject;
      if (key && !map.has(key)) {
        map.set(key, colorClasses[map.size % colorClasses.length]);
      }
    });
    return map;
  }, [classes]);

  const getOccupyingClass = (day, time) => {
    const slotMin = toMinutes(time);
    return classes.find((c) => {
      if (c.schedule?.dayOfWeek !== day) return false;
      const startMin = toMinutes(c.schedule?.startTime);
      const duration = getClassDuration(c);
      const endMin = startMin + duration;
      return slotMin >= startMin && slotMin < endMin;
    });
  };

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

      {/* View Switcher Tabs */}
      <div className="flex border-b border-secondary-200">
        <button
          type="button"
          onClick={() => setViewMode('list')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            viewMode === 'list'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-secondary-600 hover:text-secondary-800'
          }`}
        >
          Class List
        </button>
        <button
          type="button"
          onClick={() => setViewMode('routine')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            viewMode === 'routine'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-secondary-600 hover:text-secondary-800'
          }`}
        >
          Weekly Routine
        </button>
      </div>

      {viewMode === 'list' ? (
        classes.length === 0 ? (
          <div className="card p-8 text-center">
            <BookOpen className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-secondary-900 mb-2">
              No Classes Found
            </h3>
            <p className="text-secondary-600">
              You don't have any classes assigned yet.
            </p>
          </div>
        ) : (
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
        )
      ) : (
        /* Weekly Routine Grid View */
        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
          <div className="min-w-[880px] grid grid-cols-[88px_repeat(6,minmax(120px,1fr))] relative bg-gray-50">
            {/* Header Row */}
            <div className="p-3 bg-gray-50 border-b text-sm font-semibold text-gray-700">Time</div>
            {DAYS.map((day) => (
              <div key={day} className="border-l border-b p-3 bg-gray-50 text-sm font-semibold text-gray-700">{day.slice(0, 3)}</div>
            ))}
  
            {/* Time Slots & Background Cells */}
            {TIME_SLOTS.map((time, slotIdx) => {
              const rowIdx = slotIdx + 2;
              const isBreak = BREAK_SLOTS.has(time);
  
              return (
                <React.Fragment key={time}>
                  {/* Time Label */}
                  <div
                    className="flex items-start justify-center p-3 text-sm font-medium text-gray-700 border-b bg-gray-50"
                    style={{ gridColumn: 1, gridRow: rowIdx }}
                  >
                    {time}
                  </div>
  
                  {isBreak ? (
                    <div
                      className="flex items-center justify-center border-l border-b border-gray-200 bg-gray-100 text-xs font-medium text-gray-500"
                      style={{ gridColumn: '2 / span 6', gridRow: rowIdx, minHeight: '88px' }}
                    >
                      Break
                    </div>
                  ) : (
                    DAYS.map((day, dayIdx) => {
                      const colIdx = dayIdx + 2;
                      const occupyingClass = getOccupyingClass(day, time);
  
                      if (occupyingClass) {
                        return (
                          <div
                            key={`${day}-${time}`}
                            className="border-l border-b border-gray-100 bg-white"
                            style={{ gridColumn: colIdx, gridRow: rowIdx, minHeight: '88px' }}
                          />
                        );
                      } else {
                        return (
                          <div
                            key={`${day}-${time}`}
                            className="border-l border-b border-gray-200 bg-white flex items-center justify-center p-2 text-left"
                            style={{ gridColumn: colIdx, gridRow: rowIdx, minHeight: '88px' }}
                          >
                            <div className="flex h-full w-full items-center justify-center rounded border border-dashed border-gray-100 text-xs text-gray-400">
                              Free
                            </div>
                          </div>
                        );
                      }
                    })
                  )}
                </React.Fragment>
              );
            })}
  
            {/* Dynamic Class Cards */}
            {classes.map((classItem) => {
              const dayIdx = DAYS.indexOf(classItem.schedule?.dayOfWeek);
              if (dayIdx === -1) return null;
  
              const startMin = toMinutes(classItem.schedule?.startTime);
              const duration = getClassDuration(classItem);
              const endMin = startMin + duration;
  
              const startRow = Math.max(0, Math.floor((startMin - SCHEDULE_START_MINUTES) / 30)) + 2;
              const endRow = Math.min(TIME_SLOTS.length, Math.ceil((endMin - SCHEDULE_START_MINUTES) / 30)) + 2;
              const rowSpan = Math.max(1, endRow - startRow);
  
              const colIdx = dayIdx + 2;
              const color = subjectColorMap.get(classItem.subjectCode || classItem.subject) || colorClasses[0];
  
              return (
                <div
                  key={getClassId(classItem)}
                  className={`rounded-md border p-3 text-xs shadow-sm flex flex-col justify-between ${color}`}
                  style={{
                    gridColumn: colIdx,
                    gridRow: `${startRow} / span ${rowSpan}`,
                    zIndex: 10,
                    margin: '3px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  <div>
                    <div className="font-bold text-sm tracking-tight leading-tight mb-1">
                      {classItem.subjectCode || classItem.subject}
                    </div>
                    <div className="text-xs font-semibold mb-1 truncate text-gray-800">
                      {classItem.subject}
                    </div>
                    <div className="mt-1 font-medium truncate text-gray-700 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 inline text-gray-700" />
                      <span>{classItem.enrolledStudents} enrolled</span>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-col gap-0.5 text-[10px] opacity-80 border-t border-black/5 pt-1.5">
                    <div className="text-gray-600 font-medium">
                      Room: {classItem.location?.address || 'TBA'}
                    </div>
                    <div className="text-gray-600 font-medium flex items-center justify-between">
                      <span>{classItem.schedule?.startTime} - {getClassEndTime(classItem)} ({duration}m)</span>
                      <span className="capitalize font-bold text-[9px] px-1 bg-black/5 rounded">{classItem.status}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

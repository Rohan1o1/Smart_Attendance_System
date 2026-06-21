/**
 * Student Classes Component
 * View enrolled classes and schedules
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  ChevronRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { classAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SLOT_MINUTES = 30;
const SCHEDULE_START_MINUTES = 10 * 60 + 15;
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
  { length: Math.floor((SCHEDULE_END_MINUTES - SCHEDULE_START_MINUTES) / SLOT_MINUTES) },
  (_, index) => fromMinutes(SCHEDULE_START_MINUTES + index * SLOT_MINUTES)
);
const BREAK_SLOTS = new Set(['13:15']);
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

const StudentClasses = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  // No sample classes; load from API

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use classAPI which wraps axios and handles auth headers
      const response = await classAPI.getEnrolledClasses();
      if (response.success) {
        setClasses(response.data.classes || response.data || []);
      } else {
        setClasses([]);
        setError(response.message || 'Failed to load classes');
      }
      
    } catch (error) {
      console.error('Error fetching classes:', error);
      setClasses([]);
      setError(error?.message || 'Failed to load classes');
      toast.error('Failed to load classes from server');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-success-600 bg-success-100';
      case 'completed':
        return 'text-secondary-600 bg-secondary-100';
      case 'cancelled':
        return 'text-error-600 bg-error-100';
      default:
        return 'text-primary-600 bg-primary-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDurationInMinutes = (startTime, endTime) => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    return endTotalMinutes - startTotalMinutes;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-secondary-900">My Classes</h1>
        </div>
        <div className="grid gap-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="card p-6 animate-pulse">
              <div className="h-4 bg-secondary-200 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-secondary-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-secondary-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-secondary-900">My Classes</h1>
        </div>
        <div className="card p-6 text-center">
          <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">
            Failed to Load Classes
          </h3>
          <p className="text-secondary-600 mb-4">{error}</p>
          <button 
            onClick={fetchClasses}
            className="btn btn-primary btn-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">My Classes</h1>
          <p className="text-secondary-600">
            View your enrolled classes and schedules
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary-600">
            {classes.length}
          </div>
          <div className="text-sm text-secondary-600">
            Enrolled Classes
          </div>
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
              You haven't been enrolled in any classes yet. Contact your academic advisor for enrollment.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {classes.map((classItem) => (
              <div 
                key={classItem._id} 
                className="card card-hover p-6 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-secondary-900 mb-1">
                          {classItem.subject}
                        </h3>
                        <p className="text-secondary-600 mb-2">
                          {classItem.subjectCode} • {classItem.department}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-secondary-600">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{classItem.teacherName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{classItem.teacherLocation?.address || 'TBA'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`badge ${getStatusColor(classItem.status)} flex items-center gap-1`}>
                      {getStatusIcon(classItem.status)}
                      <span className="capitalize">{classItem.status}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-secondary-400" />
                  </div>
                </div>
  
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-secondary-500" />
                    <span className="text-sm text-secondary-600">
                      {classItem.schedule.dayOfWeek}s
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-secondary-500" />
                    <span className="text-sm text-secondary-600">
                      {formatTime(classItem.schedule.startTime)} - {formatTime(classItem.schedule.endTime)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-secondary-500" />
                    <span className="text-sm text-secondary-600">
                      {getDurationInMinutes(classItem.schedule.startTime, classItem.schedule.endTime)} mins
                    </span>
                  </div>
                </div>
  
                {classItem.status === 'active' && (
                  <div className="mt-4 pt-4 border-t border-secondary-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-success-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>Class is currently active - You can mark attendance now</span>
                      </div>
                      <button className="btn btn-success btn-sm">
                        Mark Attendance
                      </button>
                    </div>
                  </div>
                )}
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
                    <div className="mt-1 font-medium truncate text-gray-700">
                      {classItem.teacherName}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-col gap-0.5 text-[10px] opacity-80 border-t border-black/5 pt-1.5">
                    <div className="text-gray-600 font-medium">
                      Room: {classItem.classroom || classItem.teacherLocation?.address || 'TBA'}
                    </div>
                    <div className="text-gray-600 font-medium">
                      {classItem.schedule?.startTime} - {getClassEndTime(classItem)} ({duration}m)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentClasses;

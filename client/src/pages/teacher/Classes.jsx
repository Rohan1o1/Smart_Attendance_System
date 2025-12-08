/**
 * Teacher Classes Component
 * Manage classes and start attendance sessions
 */

import { useState, useEffect } from 'react';
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

  // Sample classes data
  const sampleClasses = [
    {
      _id: '1',
      subject: 'Computer Science 101',
      subjectCode: 'CS101',
      department: 'Computer Science',
      schedule: {
        dayOfWeek: 'Monday',
        startTime: '09:00',
        endTime: '13:00'
      },
      location: {
        latitude: 22.823101464024948,
        longitude: 88.63942781760827,
        address: 'Lab A, Engineering Building'
      },
      enrolledStudents: 45,
      attendanceWindow: {
        beforeMinutes: 300,
        afterMinutes: 300
      },
      status: 'scheduled'
    },
    {
      _id: '2',
      subject: 'Chemistry Lab',
      subjectCode: 'CHEM201',
      department: 'Chemistry',
      schedule: {
        dayOfWeek: 'Wednesday',
        startTime: '10:00',
        endTime: '13:00'
      },
      location: {
        latitude: 22.823001464024948,
        longitude: 88.63942781760827,
        address: 'Chemistry Lab, Science Building'
      },
      enrolledStudents: 32,
      attendanceWindow: {
        beforeMinutes: 300,
        afterMinutes: 300
      },
      status: 'scheduled'
    },
    {
      _id: '3',
      subject: 'Data Structures',
      subjectCode: 'CS301',
      department: 'Computer Science',
      schedule: {
        dayOfWeek: 'Friday',
        startTime: '14:00',
        endTime: '16:00'
      },
      location: {
        latitude: 22.823201464024948,
        longitude: 88.63942781760827,
        address: 'Room 301, Computer Science Building'
      },
      enrolledStudents: 38,
      attendanceWindow: {
        beforeMinutes: 300,
        afterMinutes: 300
      },
      status: 'scheduled'
    }
  ];

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      // For now, use sample data
      setClasses(sampleClasses);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      setError('Failed to load classes');
      toast.error('Failed to load classes');
      setLoading(false);
    }
  };

  const startAttendanceSession = async (classId) => {
    try {
      const classToStart = classes.find(c => c._id === classId);
      if (!classToStart) {
        toast.error('Class not found');
        return;
      }

      // In real implementation, this would make API call
      setActiveSession(classId);
      toast.success(`Attendance session started for ${classToStart.subject}`);
      
      // Update class status
      setClasses(prev => prev.map(c => 
        c._id === classId 
          ? { ...c, status: 'active', sessionStartTime: new Date().toISOString() }
          : c
      ));
    } catch (error) {
      console.error('Failed to start session:', error);
      toast.error('Failed to start attendance session');
    }
  };

  const endAttendanceSession = async (classId) => {
    try {
      const classToEnd = classes.find(c => c._id === classId);
      if (!classToEnd) {
        toast.error('Class not found');
        return;
      }

      setActiveSession(null);
      toast.success(`Attendance session ended for ${classToEnd.subject}`);
      
      // Update class status
      setClasses(prev => prev.map(c => 
        c._id === classId 
          ? { ...c, status: 'completed', sessionEndTime: new Date().toISOString() }
          : c
      ));
    } catch (error) {
      console.error('Failed to end session:', error);
      toast.error('Failed to end attendance session');
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
        {classes.map((classItem) => (
          <div key={classItem._id} className="card overflow-hidden">
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

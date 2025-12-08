/**
 * Student Classes Component
 * View enrolled classes and schedules
 */

import { useState, useEffect } from 'react';
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

const StudentClasses = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data for now
  const sampleClasses = [
    {
      _id: '1',
      subject: 'Computer Science 101',
      subjectCode: 'CS101',
      teacherName: 'Dr. Smith',
      department: 'Computer Science',
      schedule: {
        dayOfWeek: 'Monday',
        startTime: '09:00',
        endTime: '10:30'
      },
      teacherLocation: {
        latitude: 22.823101464024948,
        longitude: 88.63942781760827,
        address: 'Lab A, Engineering Building, Habra'
      },
      status: 'scheduled'
    },
    {
      _id: '2',
      subject: 'Mathematics 201',
      subjectCode: 'MATH201',
      teacherName: 'Prof. Johnson',
      department: 'Mathematics',
      schedule: {
        dayOfWeek: 'Tuesday',
        startTime: '11:00',
        endTime: '12:30'
      },
      teacherLocation: {
        address: 'Room 205, Science Building'
      },
      status: 'scheduled'
    },
    {
      _id: '3',
      subject: 'Physics 101',
      subjectCode: 'PHY101',
      teacherName: 'Dr. Brown',
      department: 'Physics',
      schedule: {
        dayOfWeek: 'Wednesday',
        startTime: '14:00',
        endTime: '15:30'
      },
      teacherLocation: {
        address: 'Lab B, Physics Building'
      },
      status: 'active'
    },
    {
      _id: '4',
      subject: 'Chemistry Lab',
      subjectCode: 'CHEM301',
      teacherName: 'Dr. Wilson',
      department: 'Chemistry',
      schedule: {
        dayOfWeek: 'Friday',
        startTime: '10:00',
        endTime: '13:00'
      },
      teacherLocation: {
        address: 'Lab 201, Chemistry Building'
      },
      status: 'scheduled'
    },
    {
      _id: '5',
      subject: 'English Literature',
      subjectCode: 'ENG202',
      teacherName: 'Prof. Davis',
      department: 'English',
      schedule: {
        dayOfWeek: 'Thursday',
        startTime: '14:00',
        endTime: '15:30'
      },
      teacherLocation: {
        address: 'Room 305, Humanities Building'
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
      setError(null);
      
      // Use actual API call
      const response = await fetch('/api/class/enrolled', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setClasses(data.data.classes || []);
      } else {
        // Fall back to sample data if API fails
        setClasses(sampleClasses);
      }
      
    } catch (error) {
      console.error('Error fetching classes:', error);
      // Use sample data as fallback
      setClasses(sampleClasses);
      toast.error('Using sample data - API endpoint not fully connected');
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

      {/* Classes Grid */}
      {classes.length === 0 ? (
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
      )}
    </div>
  );
};

export default StudentClasses;

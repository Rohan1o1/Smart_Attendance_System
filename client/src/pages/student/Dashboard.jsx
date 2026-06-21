/**
 * Student Dashboard Component
 * Main dashboard for student users
 */

import { useState, useEffect } from 'react';
import { attendanceAPI, classAPI } from '../../services/api';
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

const sameDay = (date) => new Date(date).toISOString().split('T')[0] === new Date().toISOString().split('T')[0];

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [attendanceStats, setAttendanceStats] = useState({
    totalClasses: 0,
    attendedClasses: 0,
    percentage: 0,
    thisWeek: { present: 0, total: 0 }
  });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [markedClassIds, setMarkedClassIds] = useState(new Set());
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [attendanceResponse, classesResponse] = await Promise.all([
          attendanceAPI.getStudentStats(user?._id, { limit: 10 }),
          classAPI.getAssignedClasses()
        ]);

        if (!mounted) return;

        const attendanceData = attendanceResponse.data || {};
        const records = attendanceData.attendanceRecords || [];
        const overall = attendanceData.overallStatistics || attendanceData.statistics || {};
        const thisWeek = attendanceData.dailyTrends ? attendanceData.dailyTrends.slice(-7) : [];
        const markedToday = new Set(
          records
            .filter((record) => sameDay(record.timestamp))
            .map((record) => String(record.classId?._id || record.classId?.id || record.classId))
        );

        const classes = (classesResponse.data?.classes || classesResponse.data || []).map((classItem) => {
          const id = classItem._id || classItem.id;
          return {
            id,
            name: classItem.subject || classItem.name,
            teacher: classItem.teacherId
              ? `${classItem.teacherId.firstName || ''} ${classItem.teacherId.lastName || ''}`.trim()
              : (classItem.teacherName || ''),
            time: classItem.schedule?.startTime || '',
            room: classItem.classroom || classItem.teacherLocation?.address || '',
            status: classItem.status || 'scheduled',
            canMarkAttendance: String(classItem.status) === 'active',
            attendanceMarked: markedToday.has(String(id))
          };
        });

        setRecentAttendance(records);
        setMarkedClassIds(markedToday);
        setUpcomingClasses(classes);
        setAttendanceStats({
          totalClasses: overall.totalRecords || 0,
          attendedClasses: (overall.presentCount || 0) + (overall.lateCount || 0),
          percentage: overall.attendanceRate ? Math.round(overall.attendanceRate * 10) / 10 : 0,
          thisWeek: {
            present: thisWeek.reduce((acc, item) => acc + (item.presentCount || 0) + (item.lateCount || 0), 0),
            total: thisWeek.reduce((acc, item) => acc + (item.totalRecords || 0), 0)
          }
        });
      } catch (error) {
        console.error('Failed to load student dashboard', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboard();
    return () => { mounted = false; };
  }, [user]);

  const activeUnmarkedClasses = upcomingClasses.filter((classItem) => classItem.canMarkAttendance && !classItem.attendanceMarked);

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-primary rounded-2xl px-6">
        <h1 className="text-2xl font-bold mb-2 text-black">
          Welcome back, {user?.firstName || 'Student'}!
        </h1>
        <p className="opacity-90 text-black">Ready to mark your attendance? Your classes are waiting.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={TrendingUp} label="Overall Attendance" value={`${attendanceStats.percentage}%`} />
        <MetricCard icon={CheckCircle} label="Classes Attended" value={`${attendanceStats.attendedClasses}/${attendanceStats.totalClasses}`} />
        <MetricCard icon={Calendar} label="This Week" value={`${attendanceStats.thisWeek.present}/${attendanceStats.thisWeek.total}`} />
        <MetricCard icon={BookOpen} label="Active Classes" value={activeUnmarkedClasses.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              <Camera className="w-5 h-5 text-primary" />
              Mark Attendance
            </h2>

            <div className="space-y-4">
              {loading ? (
                <div className="p-4 text-center text-sm text-base-content/60">Loading classes...</div>
              ) : upcomingClasses.length === 0 ? (
                <div className="p-4 text-center text-sm text-base-content/60">No assigned classes found.</div>
              ) : (
                upcomingClasses.map((classItem) => (
                  <div
                    key={classItem.id}
                    className={`p-4 rounded-lg border ${
                      classItem.canMarkAttendance && !classItem.attendanceMarked
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-base-300 bg-base-200/50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-semibold">{classItem.name}</h3>
                        <p className="text-sm text-base-content/60">{classItem.teacher}</p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-base-content/60">
                          <Clock className="w-4 h-4" />
                          <span>{classItem.time || 'TBA'}</span>
                          <MapPin className="w-4 h-4 ml-2" />
                          <span>{classItem.room || 'TBA'}</span>
                        </div>
                      </div>

                      {classItem.attendanceMarked ? (
                        <span className="badge badge-success">Marked</span>
                      ) : classItem.canMarkAttendance ? (
                        <button className="btn btn-primary btn-sm" onClick={() => navigate('/student/attendance')}>
                          Mark Now
                        </button>
                      ) : (
                        <span className="badge badge-ghost">Not Started</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button className="btn btn-outline btn-primary btn-md w-full mt-4" onClick={() => navigate('/student/attendance')}>
              <Camera className="w-5 h-5 mr-2" />
              Open Attendance Scanner
            </button>
          </div>
        </div>

        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              <Clock className="w-5 h-5 text-primary" />
              Recent Attendance
            </h2>

            <div className="space-y-3">
              {recentAttendance.length === 0 ? (
                <div className="p-4 text-center text-sm text-base-content/60">No attendance records yet.</div>
              ) : (
                recentAttendance.map((record) => {
                  const classInfo = record.classId || {};
                  const status = record.status || 'present';
                  const attended = ['present', 'late'].includes(status);

                  return (
                    <div key={record._id || record.id} className="flex items-center justify-between p-3 rounded-lg bg-base-200/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${attended ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                          {attended ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium">{classInfo.subject || record.className}</p>
                          <p className="text-sm text-base-content/60">
                            {new Date(record.timestamp).toLocaleDateString()} - {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <span className={`badge ${attended ? 'badge-success' : 'badge-error'}`}>{status}</span>
                    </div>
                  );
                })
              )}
            </div>

            <button className="btn btn-outline btn-md w-full mt-4" onClick={() => navigate('/student/classes')}>
              View All History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ icon: Icon, label, value }) => (
  <div className="card bg-base-100 shadow-sm">
    <div className="card-body p-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-base-content/60">{label}</p>
          <p className="text-2xl font-bold text-primary">{value}</p>
        </div>
      </div>
    </div>
  </div>
);

export default StudentDashboard;

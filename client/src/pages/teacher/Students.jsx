/**
 * Teacher Students Management Component
 * View students assigned to your classes
 */

import { useState, useEffect } from 'react';
import { 
  Users, 
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  Edit,
  Eye,
  UserPlus,
  Download,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { attendanceAPI, classAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

const TeacherStudents = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [updatingAttendanceId, setUpdatingAttendanceId] = useState(null);

  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [classesError, setClassesError] = useState(null);



  useEffect(() => {
  fetchStudents();
  fetchClasses();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const allStudents = [];
      const studentMap = new Map(); // Use map to avoid duplicates (same student in multiple classes)

      // Get teacher's classes first
      const classesResponse = await classAPI.getMyClasses();
      if (classesResponse.success) {
        const teacherClasses = classesResponse.data.classes || classesResponse.data || [];
        
        // For each class, fetch class details to get assigned students
        for (const cls of teacherClasses) {
          try {
            const classDetailsResponse = await classAPI.getClass(cls._id || cls.id);
            if (classDetailsResponse.success) {
              const classData = classDetailsResponse.data.class || classDetailsResponse.data;
              const assignedStudents = classData.enrolledStudents || [];
              
              // Extract student data and add to map (avoiding duplicates)
              for (const assignment of assignedStudents) {
                const studentData = assignment.studentId || assignment;
                if (studentData && studentData._id) {
                  if (!studentMap.has(studentData._id)) {
                    studentMap.set(studentData._id, {
                      _id: studentData._id,
                      firstName: studentData.firstName || '',
                      lastName: studentData.lastName || '',
                      email: studentData.email || '',
                      studentId: studentData.studentId || '',
                      phone: studentData.phoneNumber || studentData.phone || '',
                      department: studentData.department || '',
                      enrolledClasses: [],
                      attendanceStats: studentData.attendanceStats || {
                        totalSessions: 0,
                        attendedSessions: 0,
                        attendanceRate: 0,
                        lastAttendance: null
                      },
                      status: 'active',
                      attendanceRecords: []
                    });
                  }
                  // Add this class to the student's assigned classes
                  const student = studentMap.get(studentData._id);
                  if (!student.enrolledClasses.includes(cls._id || cls.id)) {
                    student.enrolledClasses.push(cls._id || cls.id);
                  }
                }
              }
            }
          } catch (classError) {
            console.error(`Failed to fetch details for class ${cls._id || cls.id}:`, classError);
          }

          try {
            const classId = cls._id || cls.id;
            const reportResponse = await attendanceAPI.getClassAttendance(classId, { limit: 100 });
            const records = reportResponse.success
              ? (reportResponse.data.attendanceRecords || [])
              : [];

            records.forEach(record => {
              const studentId = String(record.studentId?._id || record.studentId?.id || record.studentId);
              const student = studentMap.get(studentId);
              if (!student) return;

              student.attendanceRecords.push({
                ...record,
                classId,
                className: cls.subject || cls.name,
                classCode: cls.subjectCode || cls.code
              });
            });
          } catch (attendanceError) {
            console.error(`Failed to fetch attendance for class ${cls._id || cls.id}:`, attendanceError);
          }
        }
      }

      const mappedStudents = Array.from(studentMap.values()).map(student => {
        const totalSessions = student.attendanceRecords.length;
        const attendedSessions = student.attendanceRecords.filter(record => ['present', 'late'].includes(record.status)).length;

        return {
          ...student,
          attendanceStats: {
            ...student.attendanceStats,
            totalSessions,
            attendedSessions,
            attendanceRate: totalSessions ? Math.round((attendedSessions / totalSessions) * 100) : 0,
            lastAttendance: student.attendanceRecords[0]?.timestamp || null
          }
        };
      });

      setStudents(mappedStudents);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      toast.error('Failed to load students');
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      setClassesLoading(true);
      setClassesError(null);
      const response = await classAPI.getMyClasses();
      if (response.success) {
        const items = response.data.classes || response.data || [];
        setClasses(items.map(c => ({ id: c._id || c.id, name: c.subject || c.name, code: c.subjectCode || c.code })));
      } else {
        setClasses([]);
        setClassesError(response.message || 'Failed to load classes');
      }
    } catch (err) {
      console.error('Failed to fetch classes for teacher:', err);
      setClassesError(err?.message || 'Failed to load classes');
      setClasses([]);
    } finally {
      setClassesLoading(false);
    }
  };

  // Filter students based on search and filters
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = selectedClass === 'all' || 
      student.enrolledClasses.some(classId => String(classId) === String(selectedClass));

    const matchesStatus = selectedStatus === 'all' || 
      student.status === selectedStatus;

    return matchesSearch && matchesClass && matchesStatus;
  });

  const getStatusColor = (status) => {
    return status === 'active' 
      ? 'text-green-600 bg-green-100' 
      : 'text-red-600 bg-red-100';
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const viewStudentDetails = (student) => {
    setSelectedStudentDetails(student);
  };

  const editStudent = (student) => {
    setEditingStudent(student);
  };

  const updateAttendanceStatus = async (studentId, attendanceId, status) => {
    try {
      setUpdatingAttendanceId(attendanceId);
      const response = await attendanceAPI.updateAttendance(attendanceId, {
        status,
        notes: `Updated from manage students by ${user?.firstName || 'teacher'} ${user?.lastName || ''}`.trim()
      });

      if (!response.success) {
        toast.error(response.message || 'Failed to update attendance');
        return;
      }

      const applyUpdate = (student) => {
        if (!student || String(student._id) !== String(studentId)) return student;

        const attendanceRecords = student.attendanceRecords.map(record => (
          String(record.id || record._id) === String(attendanceId)
            ? { ...record, status }
            : record
        ));
        const totalSessions = attendanceRecords.length;
        const attendedSessions = attendanceRecords.filter(record => ['present', 'late'].includes(record.status)).length;

        return {
          ...student,
          attendanceRecords,
          attendanceStats: {
            ...student.attendanceStats,
            totalSessions,
            attendedSessions,
            attendanceRate: totalSessions ? Math.round((attendedSessions / totalSessions) * 100) : 0
          }
        };
      };

      setStudents(prev => prev.map(applyUpdate));
      setSelectedStudentDetails(prev => applyUpdate(prev));
      setEditingStudent(prev => applyUpdate(prev));
      toast.success('Attendance updated');
    } catch (error) {
      console.error('Failed to update attendance:', error);
      toast.error(error?.message || 'Failed to update attendance');
    } finally {
      setUpdatingAttendanceId(null);
    }
  };

  const exportStudents = () => {
    toast.success('Student list exported successfully');
  };

  const getEnrolledClassNames = (classIds) => {
    return classIds.map(id => {
      const cls = classes.find(c => String(c.id) === String(id));
      return cls ? cls.code : '';
    }).join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-secondary-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Manage Students</h1>
          <p className="text-secondary-600 mt-1">View students assigned by department and semester across your classes</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={exportStudents}
            className="btn btn-outline btn-sm flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-sm flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
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
                placeholder="Search by name, email, or student ID..."
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
              {!classesLoading && classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.code}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-32">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Count */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-secondary-600">
          Showing {filteredStudents.length} of {students.length} students
        </p>
        <div className="text-sm text-secondary-500">
          {classesLoading ? 'Loading classes...' : (classesError ? `Classes: ${classesError}` : `${classes.length} class${classes.length !== 1 ? 'es' : ''}`)}
        </div>
      </div>

      {/* Students Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Classes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Attendance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {filteredStudents.map((student) => (
                <tr key={student._id} className="hover:bg-secondary-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600">
                            {student.firstName[0]}{student.lastName[0]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-secondary-900">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-sm text-secondary-500">
                          {student.studentId} • {student.department}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-secondary-900 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-secondary-400" />
                      {student.email}
                    </div>
                    <div className="text-sm text-secondary-500 flex items-center mt-1">
                      <Phone className="w-4 h-4 mr-2 text-secondary-400" />
                      {student.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-secondary-900">
                      {getEnrolledClassNames(student.enrolledClasses)}
                    </div>
                    <div className="text-sm text-secondary-500">
                      {student.enrolledClasses.length} class{student.enrolledClasses.length !== 1 ? 'es' : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${getAttendanceColor(student.attendanceStats.attendanceRate)}`}>
                      {student.attendanceStats.attendanceRate}%
                    </div>
                    <div className="text-sm text-secondary-500">
                      {student.attendanceStats.attendedSessions}/{student.attendanceStats.totalSessions} sessions
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                      {student.status === 'active' ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => viewStudentDetails(student)}
                        className="text-primary-600 hover:text-primary-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => editStudent(student)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Edit Student"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">No Students Found</h3>
            <p className="text-secondary-600">
              {searchTerm || selectedClass !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No students match your classes yet'}
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-primary-600 mb-2">
            {students.filter(s => s.status === 'active').length}
          </div>
          <div className="text-sm text-secondary-600">Active Students</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {students.length
              ? Math.round(students.reduce((acc, s) => acc + s.attendanceStats.attendanceRate, 0) / students.length)
              : 0}%
          </div>
          <div className="text-sm text-secondary-600">Average Attendance</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {students.reduce((acc, s) => acc + s.enrolledClasses.length, 0)}
          </div>
          <div className="text-sm text-secondary-600">Total Assignments</div>
        </div>
      </div>

      {selectedStudentDetails && (
        <StudentAttendanceModal
          title={`${selectedStudentDetails.firstName} ${selectedStudentDetails.lastName}`}
          student={selectedStudentDetails}
          onClose={() => setSelectedStudentDetails(null)}
        />
      )}

      {editingStudent && (
        <StudentAttendanceModal
          title={`Edit ${editingStudent.firstName} ${editingStudent.lastName}`}
          student={editingStudent}
          editable
          updatingAttendanceId={updatingAttendanceId}
          onStatusChange={updateAttendanceStatus}
          onClose={() => setEditingStudent(null)}
        />
      )}
    </div>
  );
};

const StudentAttendanceModal = ({
  title,
  student,
  editable = false,
  updatingAttendanceId,
  onStatusChange,
  onClose
}) => (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-200">
        <div>
          <h3 className="text-lg font-semibold text-secondary-900">{title}</h3>
          <p className="text-sm text-secondary-500">
            {student.studentId} • {student.attendanceStats.attendedSessions}/{student.attendanceStats.totalSessions} sessions
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-secondary-500 hover:text-secondary-900"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 overflow-y-auto max-h-[70vh]">
        {student.attendanceRecords.length === 0 ? (
          <div className="text-center py-10 text-secondary-600">
            No attendance records available for this student yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Class</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Status</th>
                  {editable && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {student.attendanceRecords.map(record => {
                  const attendanceId = record.id || record._id;

                  return (
                    <tr key={attendanceId}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-secondary-900">{record.className}</div>
                        <div className="text-sm text-secondary-500">{record.classCode}</div>
                      </td>
                      <td className="px-4 py-3 text-secondary-600">
                        {record.timestamp ? new Date(record.timestamp).toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3">
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
                      {editable && (
                        <td className="px-4 py-3">
                          <select
                            value={record.status}
                            disabled={updatingAttendanceId === attendanceId}
                            onChange={(event) => onStatusChange(student._id, attendanceId, event.target.value)}
                            className="px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="present">Present</option>
                            <option value="late">Late</option>
                            <option value="absent">Absent</option>
                            <option value="excused">Excused</option>
                          </select>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default TeacherStudents;

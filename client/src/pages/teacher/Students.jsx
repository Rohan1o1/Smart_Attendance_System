/**
 * Teacher Students Management Component
 * View and manage enrolled students
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
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const TeacherStudents = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Sample classes data
  const classes = [
    { id: '1', name: 'Computer Science 101', code: 'CS101' },
    { id: '2', name: 'Chemistry Lab', code: 'CHEM201' },
    { id: '3', name: 'Data Structures', code: 'CS301' }
  ];

  // Sample students data
  const sampleStudents = [
    {
      _id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@student.edu',
      studentId: 'CS2024001',
      phone: '+1234567890',
      department: 'Computer Science',
      year: '2nd Year',
      enrolledClasses: ['1', '3'],
      attendanceStats: {
        totalSessions: 15,
        attendedSessions: 14,
        attendanceRate: 93.3,
        lastAttendance: '2024-12-08'
      },
      status: 'active',
      profileImage: null,
      address: 'Student Hostel A, Room 201'
    },
    {
      _id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@student.edu',
      studentId: 'CS2024002',
      phone: '+1234567891',
      department: 'Computer Science',
      year: '2nd Year',
      enrolledClasses: ['1'],
      attendanceStats: {
        totalSessions: 8,
        attendedSessions: 7,
        attendanceRate: 87.5,
        lastAttendance: '2024-12-07'
      },
      status: 'active',
      profileImage: null,
      address: 'Student Hostel B, Room 105'
    },
    {
      _id: '3',
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike.johnson@student.edu',
      studentId: 'CHEM2024003',
      phone: '+1234567892',
      department: 'Chemistry',
      year: '3rd Year',
      enrolledClasses: ['2'],
      attendanceStats: {
        totalSessions: 8,
        attendedSessions: 6,
        attendanceRate: 75.0,
        lastAttendance: '2024-12-06'
      },
      status: 'active',
      profileImage: null,
      address: 'Off-campus Housing'
    },
    {
      _id: '4',
      firstName: 'Sarah',
      lastName: 'Williams',
      email: 'sarah.williams@student.edu',
      studentId: 'CS2024004',
      phone: '+1234567893',
      department: 'Computer Science',
      year: '2nd Year',
      enrolledClasses: ['1', '3'],
      attendanceStats: {
        totalSessions: 15,
        attendedSessions: 12,
        attendanceRate: 80.0,
        lastAttendance: '2024-12-08'
      },
      status: 'inactive',
      profileImage: null,
      address: 'Student Hostel A, Room 305'
    }
  ];

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStudents(sampleStudents);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      toast.error('Failed to load students');
      setLoading(false);
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
      student.enrolledClasses.includes(selectedClass);

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
    toast.success(`Viewing details for ${student.firstName} ${student.lastName}`);
  };

  const editStudent = (student) => {
    toast.success(`Editing ${student.firstName} ${student.lastName}`);
  };

  const exportStudents = () => {
    toast.success('Student list exported successfully');
  };

  const getEnrolledClassNames = (classIds) => {
    return classIds.map(id => {
      const cls = classes.find(c => c.id === id);
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
          <p className="text-secondary-600 mt-1">View and manage enrolled students across your classes</p>
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
              {classes.map(cls => (
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
                : 'No students are enrolled in your classes yet'}
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
            {Math.round(students.reduce((acc, s) => acc + s.attendanceStats.attendanceRate, 0) / students.length)}%
          </div>
          <div className="text-sm text-secondary-600">Average Attendance</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {students.reduce((acc, s) => acc + s.enrolledClasses.length, 0)}
          </div>
          <div className="text-sm text-secondary-600">Total Enrollments</div>
        </div>
      </div>
    </div>
  );
};

export default TeacherStudents;

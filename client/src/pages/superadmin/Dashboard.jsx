/**
 * SuperAdmin Dashboard Component
 * Main dashboard for system administrators
 */

import { useState, useEffect } from 'react';
import { 
  Shield, Building, Users, BookOpen, GraduationCap,
  Plus, Trash2, RefreshCw, AlertCircle, CheckCircle,
  Search, Filter, Eye, X, Loader
} from 'lucide-react';
import { superAdminAPI, authAPI } from '../../services/api';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('admins'); // 'admins', 'teachers', 'students'

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, adminsRes, allUsersRes] = await Promise.all([
        superAdminAPI.getSystemStats(),
        superAdminAPI.getAllAdmins(),
        superAdminAPI.getAllUsers()
      ]);

      if (statsRes.success) {
        setStats(statsRes.data);
      }
      if (adminsRes.success) {
        setAdmins(adminsRes.data.admins);
      }
      if (allUsersRes.success) {
        const allUsers = allUsersRes.data.users || [];
        setTeachers(allUsers.filter(u => u.role === 'teacher'));
        setStudents(allUsers.filter(u => u.role === 'student'));
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleDeleteAdmin = async (adminId, department) => {
    if (!window.confirm(`Are you sure you want to deactivate the admin for "${department}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await superAdminAPI.deleteAdmin(adminId);
      if (result.success) {
        await fetchData();
      } else {
        alert(result.message || 'Failed to delete admin');
      }
    } catch (err) {
      alert('Failed to delete admin');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SuperAdmin Dashboard</h1>
          <p className="text-gray-600">Manage departments and administrators</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            Create Admin
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Departments"
          value={stats?.stats?.totalDepartments || 0}
          icon={Building}
          color="bg-purple-500"
        />
        <StatCard
          title="Total Admins"
          value={stats?.stats?.totalAdmins || 0}
          icon={Shield}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Teachers"
          value={stats?.stats?.totalTeachers || 0}
          icon={BookOpen}
          color="bg-green-500"
          subtitle={`${stats?.stats?.unverifiedTeachers || 0} pending`}
        />
        <StatCard
          title="Total Students"
          value={stats?.stats?.totalStudents || 0}
          icon={GraduationCap}
          color="bg-orange-500"
          subtitle={`${stats?.stats?.unverifiedStudents || 0} pending`}
        />
      </div>

      {/* Users Management Section with Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Manage Users</h2>
          <p className="text-sm text-gray-600">View and manage all users across the system</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('admins')}
            className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'admins'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            Admins ({admins.length})
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'teachers'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Teachers ({teachers.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'students'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Students ({students.length})
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'admins' && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Departments & Admins</h3>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <Plus className="w-4 h-4" />
                  Create Admin
                </button>
              </div>
              {admins.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No departments yet</h3>
              <p className="text-gray-600 mb-4">Create the first department admin to get started</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="w-4 h-4" />
                Create Admin
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3 font-medium">Department</th>
                    <th className="pb-3 font-medium">Admin</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {admins.map((admin) => (
                    <tr key={admin._id} className="hover:bg-gray-50">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Building className="w-5 h-5 text-purple-600" />
                          </div>
                          <span className="font-medium text-gray-900">{admin.department}</span>
                        </div>
                      </td>
                      <td className="py-4 text-gray-700">{admin.name}</td>
                      <td className="py-4 text-gray-600">{admin.email}</td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          admin.isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {admin.isActive ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3" />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-4 text-gray-600 text-sm">
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => handleDeleteAdmin(admin._id, admin.department)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Deactivate Admin"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
            </>
          )}

          {activeTab === 'teachers' && (
            <>
              {teachers.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No teachers yet</h3>
                  <p className="text-gray-600">Teachers will appear here once they register</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b">
                        <th className="pb-3 font-medium">Name</th>
                        <th className="pb-3 font-medium">Email</th>
                        <th className="pb-3 font-medium">Department</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Verification</th>
                        <th className="pb-3 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {teachers.map((teacher) => (
                        <tr key={teacher._id} className="hover:bg-gray-50">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-green-600" />
                              </div>
                              <span className="font-medium text-gray-900">{teacher.firstName} {teacher.lastName}</span>
                            </div>
                          </td>
                          <td className="py-4 text-gray-600">{teacher.email}</td>
                          <td className="py-4 text-gray-700">{teacher.department || 'N/A'}</td>
                          <td className="py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              teacher.isActive 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {teacher.isActive ? (
                                <>
                                  <CheckCircle className="w-3 h-3" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <X className="w-3 h-3" />
                                  Inactive
                                </>
                              )}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              teacher.verified 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {teacher.verified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                          <td className="py-4 text-gray-600 text-sm">
                            {new Date(teacher.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === 'students' && (
            <>
              {students.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No students yet</h3>
                  <p className="text-gray-600">Students will appear here once they register</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b">
                        <th className="pb-3 font-medium">Name</th>
                        <th className="pb-3 font-medium">Email</th>
                        <th className="pb-3 font-medium">Department</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Verification</th>
                        <th className="pb-3 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {students.map((student) => (
                        <tr key={student._id} className="hover:bg-gray-50">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <GraduationCap className="w-5 h-5 text-orange-600" />
                              </div>
                              <span className="font-medium text-gray-900">{student.firstName} {student.lastName}</span>
                            </div>
                          </td>
                          <td className="py-4 text-gray-600">{student.email}</td>
                          <td className="py-4 text-gray-700">{student.department || 'N/A'}</td>
                          <td className="py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              student.isActive 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {student.isActive ? (
                                <>
                                  <CheckCircle className="w-3 h-3" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <X className="w-3 h-3" />
                                  Inactive
                                </>
                              )}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              student.verified 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {student.verified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                          <td className="py-4 text-gray-600 text-sm">
                            {new Date(student.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Departments Grid */}
      {stats?.departments?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Departments</h2>
          <div className="flex flex-wrap gap-2">
            {stats.departments.map((dept) => (
              <span
                key={dept}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {dept}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {showCreateModal && (
        <CreateAdminModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchData();
          }}
          existingDepartments={stats?.departments || []}
        />
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  </div>
);

// Create Admin Modal Component
const CreateAdminModal = ({ onClose, onSuccess, existingDepartments }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    password: '',
    phone: '',
    employeeId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isDepartmentTaken = existingDepartments
    .map(d => d.toLowerCase())
    .includes(formData.department.toLowerCase().trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isDepartmentTaken) {
      setError('This department already exists');
      return;
    }

    if (!formData.name || !formData.email || !formData.department || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const result = await superAdminAPI.createAdmin({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        department: formData.department.trim(),
        password: formData.password,
        phone: formData.phone?.trim() || undefined,
        employeeId: formData.employeeId?.trim() || undefined
      });

      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || 'Failed to create admin');
      }
    } catch (err) {
      setError(err.message || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Create New Admin</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Dr. John Smith"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department Name (New) *</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                isDepartmentTaken ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Computer Science"
            />
            {isDepartmentTaken && (
              <p className="mt-1 text-xs text-red-600">This department already exists</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Min 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
            <input
              type="text"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Optional"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isDepartmentTaken}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Create Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;

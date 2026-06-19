/**
 * SuperAdmin Dashboard Component
 * Section-aware dashboard for system administrators.
 */

import { useMemo, useState, useEffect } from 'react';
import {
  Shield,
  Building,
  Users,
  BookOpen,
  GraduationCap,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  X,
  Loader,
  Mail,
  Phone,
  Calendar,
  UserCheck
} from 'lucide-react';
import { superAdminAPI } from '../../services/api';

const SuperAdminDashboard = ({ section = 'overview' }) => {
  const [stats, setStats] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const allUsers = useMemo(() => [...admins, ...teachers, ...students], [admins, teachers, students]);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return allUsers.filter((user) => {
      const name = getUserName(user).toLowerCase();
      const department = (user.department || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const matchesSearch = !query || name.includes(query) || department.includes(query) || email.includes(query);
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive) ||
        (statusFilter === 'verified' && user.verified) ||
        (statusFilter === 'pending' && !user.verified && user.role !== 'admin');

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [allUsers, roleFilter, searchTerm, statusFilter]);

  const departmentSummaries = useMemo(() => {
    const departments = Array.from(new Set([
      ...(stats?.departments || []),
      ...admins.map((admin) => admin.department).filter(Boolean)
    ]));

    return departments.map((department) => {
      const admin = admins.find((item) => item.department === department);
      const departmentTeachers = teachers.filter((item) => item.department === department);
      const departmentStudents = students.filter((item) => item.department === department);

      return {
        name: department,
        admin,
        teachers: departmentTeachers.length,
        students: departmentStudents.length,
        pending:
          departmentTeachers.filter((item) => !item.verified).length +
          departmentStudents.filter((item) => !item.verified).length
      };
    });
  }, [admins, stats, students, teachers]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [statsRes, adminsRes, allUsersRes] = await Promise.all([
        superAdminAPI.getSystemStats(),
        superAdminAPI.getAllAdmins(),
        superAdminAPI.getAllUsers()
      ]);

      if (statsRes.success) {
        setStats(statsRes.data);
      }
      if (adminsRes.success) {
        setAdmins((adminsRes.data.admins || []).map((admin) => ({ ...admin, role: 'admin' })));
      }
      if (allUsersRes.success) {
        const users = allUsersRes.data.users || [];
        setTeachers(users.filter((user) => user.role === 'teacher'));
        setStudents(users.filter((user) => user.role === 'student'));
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
    if (!window.confirm(`Deactivate the admin for "${department}"?`)) {
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        section={section}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onCreateAdmin={() => setShowCreateModal(true)}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {section === 'overview' && (
        <OverviewSection
          stats={stats}
          admins={admins}
          teachers={teachers}
          students={students}
          departments={departmentSummaries}
        />
      )}

      {section === 'departments' && (
        <DepartmentsSection
          admins={admins}
          departments={departmentSummaries}
          onCreateAdmin={() => setShowCreateModal(true)}
          onDeleteAdmin={handleDeleteAdmin}
        />
      )}

      {section === 'users' && (
        <UsersSection
          users={filteredUsers}
          searchTerm={searchTerm}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          setSearchTerm={setSearchTerm}
          setRoleFilter={setRoleFilter}
          setStatusFilter={setStatusFilter}
          totalUsers={allUsers.length}
        />
      )}

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

const PageHeader = ({ section, refreshing, onRefresh, onCreateAdmin }) => {
  const copy = {
    overview: {
      title: 'SuperAdmin Dashboard',
      description: 'Monitor departments, admins, teachers, and students across the system.'
    },
    departments: {
      title: 'Departments',
      description: 'Manage department admins and review department-level user coverage.'
    },
    users: {
      title: 'All Users',
      description: 'Search, filter, and review every user account in one place.'
    }
  }[section];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{copy.title}</h1>
          <p className="text-sm text-gray-600 mt-1">{copy.description}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {section !== 'users' && (
            <button
              onClick={onCreateAdmin}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="w-4 h-4" />
              Create Admin
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const OverviewSection = ({ stats, admins, teachers, students, departments }) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard title="Departments" value={stats?.stats?.totalDepartments || 0} icon={Building} tone="violet" />
      <StatCard title="Admins" value={stats?.stats?.totalAdmins || 0} icon={Shield} tone="blue" />
      <StatCard
        title="Teachers"
        value={stats?.stats?.totalTeachers || 0}
        icon={BookOpen}
        tone="green"
        subtitle={`${stats?.stats?.unverifiedTeachers || 0} pending`}
      />
      <StatCard
        title="Students"
        value={stats?.stats?.totalStudents || 0}
        icon={GraduationCap}
        tone="amber"
        subtitle={`${stats?.stats?.unverifiedStudents || 0} pending`}
      />
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <div className="xl:col-span-2 bg-white border border-gray-200 rounded-lg">
        <SectionTitle title="Recent Department Coverage" description="Quick health check by department." />
        <div className="divide-y divide-gray-100">
          {departments.slice(0, 6).map((department) => (
            <DepartmentRow key={department.name} department={department} compact />
          ))}
          {departments.length === 0 && <EmptyState icon={Building} title="No departments yet" text="Create an admin to open the first department." />}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <SectionTitle title="User Mix" description="Current account distribution." />
        <div className="p-5 space-y-3">
          <MiniMetric label="Admins" value={admins.length} icon={Shield} />
          <MiniMetric label="Teachers" value={teachers.length} icon={BookOpen} />
          <MiniMetric label="Students" value={students.length} icon={GraduationCap} />
        </div>
      </div>
    </div>
  </>
);

const DepartmentsSection = ({ admins, departments, onCreateAdmin, onDeleteAdmin }) => (
  <div className="space-y-5">
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {departments.map((department) => (
        <DepartmentCard key={department.name} department={department} />
      ))}
    </div>

    {departments.length === 0 && (
      <div className="bg-white border border-gray-200 rounded-lg">
        <EmptyState icon={Building} title="No departments yet" text="Create the first department admin to get started." actionLabel="Create Admin" onAction={onCreateAdmin} />
      </div>
    )}

    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <SectionTitle title="Department Admins" description="One admin controls verification and management for each department." />
      {admins.length === 0 ? (
        <EmptyState icon={Shield} title="No admins found" text="Department admins will appear here after creation." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Department</th>
                <th className="px-5 py-3 font-semibold">Admin</th>
                <th className="px-5 py-3 font-semibold">Contact</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Created</th>
                <th className="px-5 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {admins.map((admin) => (
                <tr key={admin._id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <IconBadge icon={Building} tone="violet" />
                      <span className="font-medium text-gray-900">{admin.department}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-900">{getUserName(admin)}</td>
                  <td className="px-5 py-4">
                    <div className="text-sm text-gray-700">{admin.email}</div>
                    <div className="text-xs text-gray-500">{admin.phone || 'No phone added'}</div>
                  </td>
                  <td className="px-5 py-4"><StatusBadge active={admin.isActive} /></td>
                  <td className="px-5 py-4 text-sm text-gray-600">{formatDate(admin.createdAt)}</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => onDeleteAdmin(admin._id, admin.department)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Deactivate admin"
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
    </div>
  </div>
);

const UsersSection = ({
  users,
  searchTerm,
  roleFilter,
  statusFilter,
  setSearchTerm,
  setRoleFilter,
  setStatusFilter,
  totalUsers
}) => (
  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
    <div className="p-5 border-b border-gray-200">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">User Directory</h2>
          <p className="text-sm text-gray-600">{users.length} of {totalUsers} users shown</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(220px,1fr)_160px_170px] gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Search users"
            />
          </div>
          <FilterSelect icon={Users} value={roleFilter} onChange={setRoleFilter}>
            <option value="all">All roles</option>
            <option value="admin">Admins</option>
            <option value="teacher">Teachers</option>
            <option value="student">Students</option>
          </FilterSelect>
          <FilterSelect icon={Filter} value={statusFilter} onChange={setStatusFilter}>
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
          </FilterSelect>
        </div>
      </div>
    </div>

    {users.length === 0 ? (
      <EmptyState icon={Users} title="No users match your filters" text="Try a different search term, role, or status." />
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-5 py-3 font-semibold">User</th>
              <th className="px-5 py-3 font-semibold">Role</th>
              <th className="px-5 py-3 font-semibold">Department</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Verification</th>
              <th className="px-5 py-3 font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <UserRow key={user._id} user={user} />
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

const UserRow = ({ user }) => {
  const roleMeta = {
    admin: { icon: Shield, tone: 'blue', label: 'Admin' },
    teacher: { icon: BookOpen, tone: 'green', label: 'Teacher' },
    student: { icon: GraduationCap, tone: 'amber', label: 'Student' }
  }[user.role] || { icon: Users, tone: 'slate', label: user.role || 'User' };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <IconBadge icon={roleMeta.icon} tone={roleMeta.tone} />
          <div>
            <div className="font-medium text-gray-900">{getUserName(user)}</div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" />{user.email}</span>
              {user.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{user.phone}</span>}
            </div>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          {roleMeta.label}
        </span>
      </td>
      <td className="px-5 py-4 text-sm text-gray-700">{user.department || 'Not assigned'}</td>
      <td className="px-5 py-4"><StatusBadge active={user.isActive} /></td>
      <td className="px-5 py-4">
        {user.role === 'admin' ? (
          <span className="text-sm text-gray-500">Auto approved</span>
        ) : (
          <VerificationBadge verified={user.verified} />
        )}
      </td>
      <td className="px-5 py-4 text-sm text-gray-600">{formatDate(user.createdAt)}</td>
    </tr>
  );
};

const DepartmentCard = ({ department }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-5">
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <IconBadge icon={Building} tone="violet" />
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{department.name}</h3>
          <p className="text-sm text-gray-600 truncate">{department.admin?.name || 'No admin assigned'}</p>
        </div>
      </div>
      <StatusBadge active={Boolean(department.admin?.isActive)} />
    </div>
    <div className="grid grid-cols-3 gap-3 mt-5">
      <MetricTile label="Teachers" value={department.teachers} />
      <MetricTile label="Students" value={department.students} />
      <MetricTile label="Pending" value={department.pending} />
    </div>
  </div>
);

const DepartmentRow = ({ department, compact = false }) => (
  <div className={`flex items-center justify-between gap-4 ${compact ? 'p-4' : 'p-5'}`}>
    <div className="flex items-center gap-3 min-w-0">
      <IconBadge icon={Building} tone="violet" />
      <div className="min-w-0">
        <p className="font-medium text-gray-900 truncate">{department.name}</p>
        <p className="text-sm text-gray-600 truncate">{department.admin?.name || 'No admin assigned'}</p>
      </div>
    </div>
    <div className="hidden sm:flex items-center gap-6 text-sm">
      <span className="text-gray-600"><strong className="text-gray-900">{department.teachers}</strong> teachers</span>
      <span className="text-gray-600"><strong className="text-gray-900">{department.students}</strong> students</span>
      <span className="text-gray-600"><strong className="text-gray-900">{department.pending}</strong> pending</span>
    </div>
  </div>
);

const StatCard = ({ title, value, icon: Icon, tone, subtitle }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-5">
    <div className="flex items-center gap-4">
      <IconBadge icon={Icon} tone={tone} size="lg" />
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  </div>
);

const SectionTitle = ({ title, description }) => (
  <div className="p-5 border-b border-gray-200">
    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
  </div>
);

const MiniMetric = ({ label, value, icon: Icon }) => (
  <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
    <span className="inline-flex items-center gap-2 text-sm text-gray-700">
      <Icon className="w-4 h-4 text-gray-400" />
      {label}
    </span>
    <span className="font-semibold text-gray-900">{value}</span>
  </div>
);

const MetricTile = ({ label, value }) => (
  <div className="rounded-lg bg-gray-50 px-3 py-2 text-center">
    <p className="text-lg font-bold text-gray-900">{value}</p>
    <p className="text-xs text-gray-500">{label}</p>
  </div>
);

const IconBadge = ({ icon: Icon, tone = 'slate', size = 'md' }) => {
  const tones = {
    violet: 'bg-violet-100 text-violet-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    slate: 'bg-slate-100 text-slate-700'
  };
  const sizes = {
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`${sizes[size]} ${tones[tone]} rounded-lg flex items-center justify-center flex-shrink-0`}>
      <Icon className={size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} />
    </div>
  );
};

const StatusBadge = ({ active }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
    active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
  }`}>
    {active ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
    {active ? 'Active' : 'Inactive'}
  </span>
);

const VerificationBadge = ({ verified }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
    verified ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
  }`}>
    {verified ? <UserCheck className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
    {verified ? 'Verified' : 'Pending'}
  </span>
);

const FilterSelect = ({ icon: Icon, value, onChange, children }) => (
  <div className="relative">
    <Icon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none"
    >
      {children}
    </select>
  </div>
);

const EmptyState = ({ icon: Icon, title, text, actionLabel, onAction }) => (
  <div className="text-center py-12 px-4">
    <Icon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600">{text}</p>
    {actionLabel && (
      <button
        onClick={onAction}
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
      >
        <Plus className="w-4 h-4" />
        {actionLabel}
      </button>
    )}
  </div>
);

const getUserName = (user) => {
  if (user.name) return user.name;
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unnamed user';
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString();
};

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
    .map((department) => department.toLowerCase())
    .includes(formData.department.toLowerCase().trim());

  const handleSubmit = async (event) => {
    event.preventDefault();

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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
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

          <FormInput label="Full Name *" value={formData.name} onChange={(value) => setFormData({ ...formData, name: value })} placeholder="Dr. John Smith" />
          <FormInput label="Email *" type="email" value={formData.email} onChange={(value) => setFormData({ ...formData, email: value })} placeholder="admin@example.com" />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department Name (New) *</label>
            <input
              type="text"
              value={formData.department}
              onChange={(event) => setFormData({ ...formData, department: event.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                isDepartmentTaken ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Computer Science"
            />
            {isDepartmentTaken && (
              <p className="mt-1 text-xs text-red-600">This department already exists</p>
            )}
          </div>

          <FormInput label="Password *" type="password" value={formData.password} onChange={(value) => setFormData({ ...formData, password: value })} placeholder="Min 6 characters" />
          <FormInput label="Employee ID" value={formData.employeeId} onChange={(value) => setFormData({ ...formData, employeeId: value })} placeholder="Optional" />
          <FormInput label="Phone" type="tel" value={formData.phone} onChange={(value) => setFormData({ ...formData, phone: value })} placeholder="Optional" />

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

const FormInput = ({ label, type = 'text', value, onChange, placeholder }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
      placeholder={placeholder}
    />
  </div>
);

export default SuperAdminDashboard;

import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';

const UserCard = ({ user, onVerify, onReject, onRemove }) => (
  <div className="p-4 border rounded mb-3 flex items-center justify-between">
    <div>
      <div className="font-semibold">{user.firstName} {user.lastName} {user.studentId || user.teacherId || ''}</div>
      <div className="text-sm text-secondary-600">{user.email} • {user.role}</div>
    </div>
    <div className="space-x-2">
      {onVerify && <button className="btn btn-success btn-sm" onClick={() => onVerify(user._id)}>Verify</button>}
      {onReject && <button className="btn btn-ghost btn-sm" onClick={() => onReject(user._id)}>Reject</button>}
      {onRemove && (
        <button
          className="btn btn-danger btn-sm inline-flex items-center gap-2"
          onClick={() => onRemove(user)}
        >
          <Trash2 className="w-4 h-4" />
          Remove
        </button>
      )}
    </div>
  </div>
);

const UserManagement = () => {
  const [pending, setPending] = useState([]);
  const [verified, setVerified] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const resUnverified = await adminAPI.getUnverifiedUsers();
      if (resUnverified.success) {
        // API returns { users, count } in data — normalize to array
        const pendingUsers = resUnverified.data?.users || resUnverified.data || [];
        setPending(Array.isArray(pendingUsers) ? pendingUsers : []);
      }

      const resAll = await adminAPI.getDepartmentUsers({ includeInactive: true });
      if (resAll.success) {
        const all = resAll.data?.users || resAll.data || [];
        setVerified(all.filter(u => u.verified));
        setRejected(all.filter(u => !u.isActive));
      }
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleVerify = async (userId) => {
    try {
      const res = await adminAPI.verifyUser(userId);
      if (res.success) loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (userId) => {
    try {
      const res = await adminAPI.rejectUser(userId);
      if (res.success) loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveVerified = async (user) => {
    if (!user?.verified || !window.confirm(`Remove ${user.firstName} ${user.lastName}?`)) {
      return;
    }

    try {
      const res = await adminAPI.deactivateUser(user._id);
      if (res.success) {
        loadUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div>
          <button className="btn btn-secondary btn-sm mr-2" onClick={() => navigate(-1)}>Back</button>
          <button className="btn btn-primary btn-sm" onClick={loadUsers}>Refresh</button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="card p-4">
          <h3 className="font-semibold mb-3">Pending Verification ({pending.length})</h3>
          {loading && <div>Loading...</div>}
          {!loading && pending.length === 0 && <div className="text-sm text-secondary-600">No pending users</div>}
          {!loading && Array.isArray(pending) && pending.map(u => <UserCard key={u._id} user={u} onVerify={handleVerify} onReject={handleReject} />)}
        </div>

        <div className="card p-4">
          <h3 className="font-semibold mb-3">Verified Users ({verified.length})</h3>
          {!loading && verified.length === 0 && <div className="text-sm text-secondary-600">No verified users</div>}
          {!loading && Array.isArray(verified) && verified.map(u => <UserCard key={u._id} user={u} onRemove={handleRemoveVerified} />)}
        </div>

        <div className="card p-4">
          <h3 className="font-semibold mb-3">Rejected Users ({rejected.length})</h3>
          {!loading && rejected.length === 0 && <div className="text-sm text-secondary-600">No rejected users</div>}
          {!loading && rejected.map(u => <UserCard key={u._id} user={u} />)}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;

import React, { useEffect, useState } from 'react';
import { adminAPI, classAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const emptyForm = {
  subject: '',
  subjectCode: '',
  department: '',
  semester: '',
  academicYear: '',
  // schedule form fields
  schedule: [],
  scheduleDay: 'Monday',
  scheduleStartTime: '09:00',
  scheduleEndTime: '10:00',
  geofenceRadius: 20,
  classroom: '',
  description: '',
  teacherId: '',
  section: 'A'
};

const ClassesPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchTeachers();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (user?.role === 'admin' && user.department) {
      setForm((current) => ({
        ...current,
        department: current.department || user.department,
        section: current.section || 'A'
      }));
    }
  }, [user]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getTeachers({ perPage: 200 });
      if (res.success && res.data && res.data.users) {
        setTeachers(res.data.users);
      } else if (res.success && Array.isArray(res.data)) {
        setTeachers(res.data);
      } else {
        setTeachers([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    setLoading(true);
    try {
      // Try teacher endpoint when client thinks user is teacher; fallback to active classes on 403
      let res;
      if (user && user.role === 'admin') {
        res = await classAPI.getAdminRoutines();
      } else if (user && user.role === 'teacher') {
        try {
          res = await classAPI.getMyClasses({ page: 1, limit: 100 });
        } catch (err) {
          // If server rejects due to role mismatch, fallback to active classes
          if (err.status === 403 || (err.message && err.message.includes('Required role'))) {
            res = await classAPI.getActiveClasses({});
          } else {
            throw err;
          }
        }
      } else {
        res = await classAPI.getActiveClasses({});
      }
      if (res.success && res.data && res.data.classes) {
        setClasses(res.data.classes);
      } else if (res.success && Array.isArray(res.data)) {
        setClasses(res.data);
      } else {
        setClasses([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Ensure token exists
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Not authenticated. Please login again.');
        setLoading(false);
        return;
      }

      // If admin is creating the class, require teacher selection
      if (user && user.role === 'admin' && !form.teacherId) {
        setError('Please select a teacher to assign this class to');
        setLoading(false);
        return;
      }
      // Build payload matching server validation schema
      const semesterNum = (() => {
        if (!form.semester) return null;
        const m = String(form.semester).match(/(\d+)/);
        return m ? parseInt(m[1], 10) : parseInt(form.semester, 10) || null;
      })();

      const currentYear = new Date().getFullYear();
      const defaultAcademicYear = `${currentYear}-${currentYear + 1}`;

      // compute schedule and duration from form fields
      const start = form.scheduleStartTime || (Array.isArray(form.schedule) && form.schedule[0]?.startTime) || '09:00';
      const end = form.scheduleEndTime || (Array.isArray(form.schedule) && form.schedule[0]?.endTime) || '10:00';
      const day = form.scheduleDay || (Array.isArray(form.schedule) && form.schedule[0]?.dayOfWeek) || 'Monday';

      const parseMinutes = (hhmm) => {
        const [h, m] = String(hhmm).split(':').map(Number);
        return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
      };

      const durationMinutes = parseMinutes(end) - parseMinutes(start);
      if (durationMinutes <= 0) {
        setError('End time must be after start time');
        setLoading(false);
        return;
      }

      const scheduleObj = {
        dayOfWeek: day,
        startTime: start,
        endTime: end,
        duration: durationMinutes
      };

      const payload = {
        subject: form.subject,
        subjectCode: (form.subjectCode || '').toUpperCase(),
        department: form.department || user?.department || '',
        semester: semesterNum || 1,
        academicYear: form.academicYear && /\d{4}-\d{4}/.test(form.academicYear) ? form.academicYear : defaultAcademicYear,
        section: form.section ? String(form.section).toUpperCase() : undefined,
        // send computed schedule with duration
        schedule: scheduleObj,
        geofenceRadius: form.geofenceRadius || 20,
        classroom: form.classroom || undefined,
        description: form.description || undefined,
        teacherId: form.teacherId
      };

      // Remove empty string or undefined fields so Joi optional fields don't trigger 'is not allowed to be empty'
      Object.keys(payload).forEach(key => {
        const val = payload[key];
        if (val === '' || val === null || typeof val === 'undefined') {
          delete payload[key];
        }
      });

      if (editingId) {
        const res = await classAPI.updateClass(editingId, payload);
        console.debug('Update class response', res);
        if (res.success) {
          await fetchClasses();
          setForm({ ...emptyForm, department: user?.department || '', section: 'A' });
          setEditingId(null);
        } else {
          setError(res.errors || res.message || 'Failed to update class');
        }
      } else {
        const res = await classAPI.createClass(payload);
        console.debug('Create class response', res);
        if (res.success) {
          await fetchClasses();
          setForm({ ...emptyForm, department: user?.department || '', section: 'A' });
        } else {
          setError(res.errors || res.message || 'Failed to create class');
        }
      }
    } catch (err) {
      console.error('Class submit error', err);
      // err may be an object returned from handleError
      setError(err.errors || err.message || JSON.stringify(err) || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cls) => {
    setEditingId(cls._id);
    setForm({
      subject: cls.subject || '',
      subjectCode: cls.subjectCode || '',
      department: cls.department || '',
  semester: cls.semester || '',
  academicYear: cls.academicYear || '',
  section: cls.section || '',
  schedule: cls.schedule || [],
  scheduleDay: cls.schedule?.dayOfWeek || (cls.schedule && cls.schedule[0]?.dayOfWeek) || 'Monday',
  scheduleStartTime: cls.schedule?.startTime || (cls.schedule && cls.schedule[0]?.startTime) || '09:00',
  scheduleEndTime: cls.schedule?.endTime || (cls.schedule && cls.schedule[0]?.endTime) || '10:00',
  geofenceRadius: cls.geofenceRadius || 20,
      classroom: cls.classroom || '',
      description: cls.description || '',
      teacherId: cls.teacherId?._id || ''
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this class?')) return;
    setLoading(true);
    try {
      const res = await classAPI.deleteClass(id);
      if (res.success) {
        await fetchClasses();
      } else {
        setError(res.message || 'Failed to delete class');
      }
    } catch (err) {
      setError(err.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Admin Classes</h2>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-2">{editingId ? 'Edit Class' : 'Create Class'}</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm">Subject</label>
              <input name="subject" value={form.subject} onChange={handleChange} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm">Subject Code</label>
              <input name="subjectCode" value={form.subjectCode} onChange={handleChange} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm">Teacher</label>
              <select name="teacherId" value={form.teacherId} onChange={handleChange} className="input w-full">
                <option value="">-- Select Teacher --</option>
                {teachers.map(t => (
                  <option key={t._id} value={t._id}>{t.firstName} {t.lastName} ({t.employeeId || t.teacherId || t._id})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm">Academic Year</label>
              <input name="academicYear" value={form.academicYear} onChange={handleChange} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm">Day of Week</label>
              <select name="scheduleDay" value={form.scheduleDay} onChange={handleChange} className="input w-full">
                <option key="mon" value="Monday">Monday</option>
                <option key="tue" value="Tuesday">Tuesday</option>
                <option key="wed" value="Wednesday">Wednesday</option>
                <option key="thu" value="Thursday">Thursday</option>
                <option key="fri" value="Friday">Friday</option>
                <option key="sat" value="Saturday">Saturday</option>
              </select>
            </div>
            <div>
              <label className="block text-sm">Start Time</label>
              <input name="scheduleStartTime" type="time" value={form.scheduleStartTime} onChange={handleChange} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm">End Time</label>
              <input name="scheduleEndTime" type="time" value={form.scheduleEndTime} onChange={handleChange} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm">Semester</label>
              <input name="semester" value={form.semester} onChange={handleChange} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm">Department</label>
              <input name="department" value={form.department} onChange={handleChange} placeholder="e.g., Computer Science" className="input w-full" />
            </div>
            <div>
              <label className="block text-sm">Section (optional)</label>
              <input name="section" value={form.section || ''} onChange={handleChange} placeholder="e.g., A" className="input w-full" />
            </div>
            <div>
              <label className="block text-sm">Classroom</label>
              <input name="classroom" value={form.classroom} onChange={handleChange} className="input w-full" />
            </div>

            <div className="flex items-center space-x-2">
              <button type="submit" className="btn btn-primary" disabled={loading}>{editingId ? 'Update' : 'Create'}</button>
              {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ ...emptyForm, department: user?.department || '', section: 'A' }); }} className="btn">Cancel</button>}
            </div>

            {error && <div className="text-red-600">{error}</div>}
          </form>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Classes</h3>
          {loading && <div>Loading...</div>}
          {!loading && classes.length === 0 && <div>No classes found.</div>}
          {!loading && classes.length > 0 && (
            <div className="space-y-2">
                {classes.map((cls, idx) => (
                <div key={cls._id || cls.classId || idx} className="p-3 border rounded flex justify-between items-center">
                  <div>
                    <div className="font-medium">{cls.subject} ({cls.subjectCode})</div>
                    <div className="text-sm text-gray-600">Teacher: {cls.teacherId?.firstName} {cls.teacherId?.lastName}</div>
                    <div className="text-sm text-gray-600">Year: {cls.academicYear} • Sem: {cls.semester} • Dept: {cls.department}</div>
                  </div>
                  <div className="space-x-2">
                    <button onClick={() => handleEdit(cls)} className="btn btn-sm">Edit</button>
                    <button onClick={() => handleDelete(cls._id)} className="btn btn-sm btn-danger">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassesPage;

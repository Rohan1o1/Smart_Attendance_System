import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BookOpen, CalendarDays, GripVertical, Plus, Save, Trash2, X } from 'lucide-react';
import { adminAPI, classAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
const BREAK_SLOTS = new Set(['12:00']);
const DEFAULT_DURATION_MINUTES = 60;
const DEFAULT_YEARS = [1, 2, 3, 4];
const DEFAULT_SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const DEFAULT_SECTIONS = ['A', 'B', 'C', 'D'];

const emptyDraft = {
  _id: '',
  subject: '',
  subjectCode: '',
  teacherId: '',
  department: '',
  year: '',
  semester: '',
  section: '',
  academicYear: '',
  dayOfWeek: 'Monday',
  startTime: '09:00',
  endTime: '10:00',
  classroom: '',
  description: '',
  teacherId: ''
};

const ClassesPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    department: user?.department || '',
    semester: '',
    section: '',
    teacherId: ''
  });
  const [draft, setDraft] = useState(null);
  const [draggedClassId, setDraggedClassId] = useState(null);

  const teachers = useMemo(
    () => users.filter((item) => item.role === 'teacher' && item.verified !== false),
    [users]
  );

  const students = useMemo(
    () => users.filter((item) => item.role === 'student'),
    [users]
  );

  const departments = useMemo(() => {
    const values = new Set();
    if (user?.department) values.add(user.department);
    users.forEach((item) => {
      if (item.department) values.add(item.department);
    });
    return [...values].sort();
  }, [user, users]);

  const semesters = useMemo(() => {
    const values = new Set();
    students
      .filter((item) => !filters.department || item.department === filters.department)
      .forEach((item) => {
        if (item.semester) values.add(Number(item.semester));
      });
    classes.forEach((item) => {
      if ((!filters.department || item.department === filters.department) && item.semester) {
        values.add(Number(item.semester));
      }
    });
    DEFAULT_SEMESTERS.forEach((semester) => values.add(semester));
    return [...values].sort((a, b) => a - b);
  }, [classes, filters.department, students]);

  const years = useMemo(() => {
    const values = new Set();
    students
      .filter((item) => !filters.department || item.department === filters.department)
      .forEach((item) => {
        if (item.year) values.add(Number(item.year));
      });
    classes.forEach((item) => {
      const classYear = item.year || (item.semester ? Math.ceil(Number(item.semester) / 2) : null);
      if ((!filters.department || item.department === filters.department) && classYear) {
        values.add(Number(classYear));
      }
    });
    DEFAULT_YEARS.forEach((year) => values.add(year));
    return [...values].sort((a, b) => a - b);
  }, [classes, filters.department, students]);

  const sections = useMemo(() => {
    const values = new Set();
    students
      .filter((item) => !filters.department || item.department === filters.department)
      .filter((item) => !filters.semester || Number(item.semester) === Number(filters.semester))
      .forEach((item) => {
        if (item.section) values.add(String(item.section).toUpperCase());
      });
    classes.forEach((item) => {
      if (
        (!filters.department || item.department === filters.department) &&
        (!filters.semester || Number(item.semester) === Number(filters.semester)) &&
        item.section
      ) {
        values.add(String(item.section).toUpperCase());
      }
    });
    DEFAULT_SECTIONS.forEach((section) => values.add(section));
    return [...values].sort();
  }, [classes, filters.department, filters.semester, students]);

  const filteredTeachers = useMemo(
    () => teachers.filter((item) => !filters.department || item.department === filters.department),
    [filters.department, teachers]
  );

  const draftTeachers = useMemo(() => {
    const draftDepartment = draft?.department || filters.department;
    return teachers.filter((item) => !draftDepartment || item.department === draftDepartment);
  }, [draft?.department, filters.department, teachers]);

  const draftSemesters = useMemo(() => {
    if (!draft) return semesters;
    const values = new Set();
    students
      .filter((item) => !draft.department || item.department === draft.department)
      .filter((item) => !draft.year || Number(item.year) === Number(draft.year))
      .forEach((item) => {
        if (item.semester) values.add(Number(item.semester));
      });
    classes.forEach((item) => {
      const classYear = item.year || (item.semester ? Math.ceil(Number(item.semester) / 2) : null);
      if (
        (!draft.department || item.department === draft.department) &&
        (!draft.year || Number(classYear) === Number(draft.year)) &&
        item.semester
      ) {
        values.add(Number(item.semester));
      }
    });
    DEFAULT_SEMESTERS.forEach((semester) => values.add(semester));
    return [...values].sort((a, b) => a - b);
  }, [classes, draft, semesters, students]);

  const draftSections = useMemo(() => {
    if (!draft) return sections;
    const values = new Set();
    students
      .filter((item) => !draft.department || item.department === draft.department)
      .filter((item) => !draft.year || Number(item.year) === Number(draft.year))
      .filter((item) => !draft.semester || Number(item.semester) === Number(draft.semester))
      .forEach((item) => {
        if (item.section) values.add(String(item.section).toUpperCase());
      });
    classes.forEach((item) => {
      const classYear = item.year || (item.semester ? Math.ceil(Number(item.semester) / 2) : null);
      if (
        (!draft.department || item.department === draft.department) &&
        (!draft.year || Number(classYear) === Number(draft.year)) &&
        (!draft.semester || Number(item.semester) === Number(draft.semester)) &&
        item.section
      ) {
        values.add(String(item.section).toUpperCase());
      }
    });
    DEFAULT_SECTIONS.forEach((section) => values.add(section));
    return [...values].sort();
  }, [classes, draft, sections, students]);

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

  useEffect(() => {
    fetchUsers();
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

  useEffect(() => {
    fetchClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.department, filters.semester, filters.section, filters.teacherId]);

  useEffect(() => {
    if (!filters.department && departments.length > 0) {
      setFilters((prev) => ({ ...prev, department: departments[0] }));
    }
  }, [departments, filters.department]);

  const fetchUsers = async () => {
    try {
      setError('');
      const response = await adminAPI.getDepartmentUsers({ limit: 500 });
      if (response.success) {
        setUsers(response.data?.users || response.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load department users');
    }
  };

  const fetchClasses = async () => {
    setLoading(true);
    try {
      // Try teacher endpoint when client thinks user is teacher; fallback to active classes on 403
      let res;
      if (user && user.role === 'teacher') {
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
        setError(response.message || 'Failed to load schedule');
      }
    } catch (err) {
      setClasses([]);
      setError(err.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'department' ? { semester: '', section: '', teacherId: '' } : {}),
      ...(name === 'semester' ? { section: '' } : {})
    }));
  };

  const getClassesAt = (day, time) => classes.filter((item) => (
    item.schedule?.dayOfWeek === day && item.schedule?.startTime === time
  ));

  const openAdd = (dayOfWeek, startTime) => {
    if (BREAK_SLOTS.has(startTime)) return;
    const endTime = fromMinutes(toMinutes(startTime) + DEFAULT_DURATION_MINUTES);
    setDraft({
      ...emptyDraft,
      department: filters.department || user?.department || departments[0] || '',
      semester: filters.semester || '',
      year: filters.semester ? Math.ceil(Number(filters.semester) / 2) : years[0] || '',
      section: filters.section || '',
      teacherId: filters.teacherId || '',
      academicYear: getDefaultAcademicYear(),
      dayOfWeek,
      startTime,
      endTime
    });
  };

  const openEdit = (classItem) => {
    setDraft({
      _id: getClassId(classItem),
      subject: classItem.subject || '',
      subjectCode: classItem.subjectCode || '',
      teacherId: classItem.teacherId?._id || classItem.teacherId || '',
      department: classItem.department || filters.department || user?.department || '',
      year: classItem.year || (classItem.semester ? Math.ceil(Number(classItem.semester) / 2) : ''),
      semester: classItem.semester || '',
      section: classItem.section || '',
      academicYear: classItem.academicYear || getDefaultAcademicYear(),
      dayOfWeek: classItem.schedule?.dayOfWeek || 'Monday',
      startTime: classItem.schedule?.startTime || '09:00',
      endTime: classItem.schedule?.endTime || '10:00',
      classroom: classItem.classroom || '',
      description: classItem.description || ''
    });
  };

  const updateDraft = (event) => {
    const { name, value } = event.target;
    setDraft((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'department' ? { year: '', semester: '', section: '', teacherId: '' } : {}),
      ...(name === 'year' ? { semester: '', section: '' } : {}),
      ...(name === 'semester' ? { section: '' } : {}),
      ...(name === 'section' ? { section: value.toUpperCase() } : {})
    }));
  };

  const draftConflict = useMemo(() => {
    if (!draft) return null;
    return classes.find((item) => {
      if (getClassId(item) === draft._id) return false;
      const sameSlot = item.schedule?.dayOfWeek === draft.dayOfWeek && item.schedule?.startTime === draft.startTime;
      if (!sameSlot) return false;
      const sameTeacher = String(item.teacherId?._id || item.teacherId) === String(draft.teacherId);
      const sameGroup = item.department === draft.department &&
        Number(item.semester) === Number(draft.semester) &&
        String(item.section || '').toUpperCase() === String(draft.section || '').toUpperCase();
      return sameTeacher || sameGroup;
    });
  }, [classes, draft]);

  const saveDraft = async (event) => {
    event.preventDefault();
    if (!draft || draftConflict) return;

    const payload = {
      subject: draft.subject.trim(),
      subjectCode: draft.subjectCode.trim().toUpperCase(),
      teacherId: draft.teacherId,
      department: draft.department,
      year: draft.year ? Number(draft.year) : draft.semester ? Math.ceil(Number(draft.semester) / 2) : undefined,
      semester: Number(draft.semester),
      section: draft.section ? draft.section.trim().toUpperCase() : undefined,
      academicYear: draft.academicYear || getDefaultAcademicYear(),
      schedule: {
        dayOfWeek: draft.dayOfWeek,
        startTime: draft.startTime,
        endTime: draft.endTime
      },
      classroom: draft.classroom || undefined,
      description: draft.description || undefined
    };

    try {
      setSaving(true);
      setError('');
      const response = draft._id
        ? await classAPI.updateClass(draft._id, payload)
        : await classAPI.createClass(payload);

      if (!response.success) {
        setError(response.message || 'Failed to save class');
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
        department: form.department,
        semester: semesterNum || 1,
        academicYear: form.academicYear && /\d{4}-\d{4}/.test(form.academicYear) ? form.academicYear : defaultAcademicYear,
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
          setForm(emptyForm);
          setEditingId(null);
        } else {
          setError(res.errors || res.message || 'Failed to update class');
        }
      } else {
        const res = await classAPI.createClass(payload);
        console.debug('Create class response', res);
        if (res.success) {
          await fetchClasses();
          setForm(emptyForm);
        } else {
          setError(res.errors || res.message || 'Failed to create class');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to delete class');
    } finally {
      setSaving(false);
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
      setError(err.message || 'Failed to move class');
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Schedule</h1>
          <p className="text-sm text-gray-600">Assign classes to a teacher, department, semester, and section.</p>
        </div>
        <button onClick={() => openAdd('Monday', '09:00')} className="btn btn-primary inline-flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Class
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border bg-white p-4 md:grid-cols-4">
        <label className="space-y-1">
          <span className="text-xs font-medium text-gray-600">Department</span>
          <select name="department" value={filters.department} onChange={handleFilterChange} className="input w-full">
            {departments.map((department) => (
              <option key={department} value={department}>{department}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-gray-600">Semester</span>
          <select name="semester" value={filters.semester} onChange={handleFilterChange} className="input w-full">
            <option value="">All semesters</option>
            {semesters.map((semester) => (
              <option key={semester} value={semester}>Semester {semester}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-gray-600">Section</span>
          <select name="section" value={filters.section} onChange={handleFilterChange} className="input w-full">
            <option value="">All sections</option>
            {sections.map((section) => (
              <option key={section} value={section}>Section {section}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-gray-600">Teacher</span>
          <select name="teacherId" value={filters.teacherId} onChange={handleFilterChange} className="input w-full">
            <option value="">All teachers</option>
            {filteredTeachers.map((teacher) => (
              <option key={teacher._id} value={teacher._id}>{teacher.firstName} {teacher.lastName}</option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <div className="min-w-[880px]">
          <div className="grid grid-cols-[88px_repeat(6,minmax(120px,1fr))] border-b bg-gray-50 text-sm font-semibold text-gray-700">
            <div className="p-3">Time</div>
            {DAYS.map((day) => (
              <div key={day} className="border-l p-3">{day.slice(0, 3)}</div>
            ))}
          </div>

          {TIME_SLOTS.map((time) => (
            <div key={time} className="grid min-h-[88px] grid-cols-[88px_repeat(6,minmax(120px,1fr))] border-b last:border-b-0">
              <div className="flex items-start justify-center p-3 text-sm font-medium text-gray-700">{time}</div>
              {DAYS.map((day) => {
                const slotClasses = getClassesAt(day, time);
                const isBreak = BREAK_SLOTS.has(time);
                return (
                  <button
                    type="button"
                    key={`${day}-${time}`}
                    onClick={() => !isBreak && slotClasses.length === 0 && openAdd(day, time)}
                    onDragOver={(event) => !isBreak && event.preventDefault()}
                    onDrop={() => handleDrop(day, time)}
                    className={`min-h-[88px] border-l p-2 text-left transition ${isBreak ? 'cursor-not-allowed bg-gray-50' : 'hover:bg-gray-50'}`}
                    disabled={isBreak}
                  >
                    {isBreak ? (
                      <div className="flex h-full items-center justify-center rounded bg-gray-100 text-xs font-medium text-gray-500">
                        Break
                      </div>
                    ) : slotClasses.length === 0 ? (
                      <div className="flex h-full items-center justify-center rounded border border-dashed border-gray-200 text-xs text-gray-400">
                        Free
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {slotClasses.map((classItem) => {
                          const color = subjectColorMap.get(classItem.subjectCode || classItem.subject) || colorClasses[0];
                          const teacherName = classItem.teacherId
                            ? `${classItem.teacherId.firstName || ''} ${classItem.teacherId.lastName || ''}`.trim()
                            : classItem.teacherName;
                          return (
                            <div
                              key={getClassId(classItem)}
                              draggable
                              onDragStart={(event) => {
                                event.stopPropagation();
                                setDraggedClassId(getClassId(classItem));
                              }}
                              onClick={(event) => {
                                event.stopPropagation();
                                openEdit(classItem);
                              }}
                              className={`rounded-md border p-2 text-xs shadow-sm ${color}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold">{classItem.subjectCode || classItem.subject}</span>
                                <GripVertical className="h-3.5 w-3.5 opacity-60" />
                              </div>
                              <div className="mt-1 truncate">{teacherName || 'Teacher'}</div>
                              <div className="mt-1 truncate text-[11px] opacity-80">
                                Sem {classItem.semester} | Sec {classItem.section || 'All'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-sm text-gray-500">Loading schedule...</div>
      )}

      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary-600" />
                <h2 className="text-lg font-semibold">{draft._id ? 'Edit Class' : 'Add Class'}</h2>
              </div>
              <button type="button" onClick={() => setDraft(null)} className="rounded p-1 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={saveDraft} className="space-y-4 p-5">
              {draftConflict && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Conflict detected with {draftConflict.subject} at this time.
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-gray-600">Subject</span>
                  <input name="subject" value={draft.subject} onChange={updateDraft} required className="input w-full" />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-gray-600">Subject Code</span>
                  <input name="subjectCode" value={draft.subjectCode} onChange={updateDraft} required className="input w-full uppercase" />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-gray-600">Teacher</span>
                  <select name="teacherId" value={draft.teacherId} onChange={updateDraft} required className="input w-full">
                    <option value="">Select teacher</option>
                    {draftTeachers.map((teacher) => (
                      <option key={teacher._id} value={teacher._id}>{teacher.firstName} {teacher.lastName}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-gray-600">Department</span>
                  <select name="department" value={draft.department} onChange={updateDraft} required className="input w-full">
                    {departments.map((department) => (
                      <option key={department} value={department}>{department}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-gray-600">Semester</span>
                  <select name="semester" value={draft.semester} onChange={updateDraft} required className="input w-full">
                    <option value="">Select semester</option>
                    {draftSemesters.map((semester) => (
                      <option key={semester} value={semester}>Semester {semester}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-gray-600">Year</span>
                  <select name="year" value={draft.year} onChange={updateDraft} required className="input w-full">
                    <option value="">Select year</option>
                    {years.map((year) => (
                      <option key={year} value={year}>Year {year}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-gray-600">Section</span>
                  <select name="section" value={draft.section} onChange={updateDraft} required className="input w-full">
                    <option value="">Select section</option>
                    {draftSections.map((section) => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </label>
              </div>

            <div className="flex items-center space-x-2">
              <button type="submit" className="btn btn-primary" disabled={loading}>{editingId ? 'Update' : 'Create'}</button>
              {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="btn">Cancel</button>}
            </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-gray-600">Classroom</span>
                  <input name="classroom" value={draft.classroom} onChange={updateDraft} className="input w-full" />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-gray-600">Description</span>
                  <input name="description" value={draft.description} onChange={updateDraft} className="input w-full" />
                </label>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  {draft._id && (
                    <button type="button" onClick={deleteDraft} disabled={saving} className="btn btn-outline inline-flex items-center gap-2 text-red-600">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setDraft(null)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" disabled={saving || !!draftConflict} className="btn btn-primary inline-flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
        <div className="mb-2 flex items-center gap-2 font-medium text-gray-900">
          <CalendarDays className="h-4 w-4" />
          Schedule rules
        </div>
        Empty slots create a class. Existing blocks edit a class. Drag blocks to move them. Conflicts are blocked when a teacher or the same department-semester-section already has a class in that slot.
      </div>
    </div>
  );
};

export default ClassesPage;

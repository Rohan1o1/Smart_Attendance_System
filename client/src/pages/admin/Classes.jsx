import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BookOpen, CalendarDays, GripVertical, Plus, Save, Trash2, X } from 'lucide-react';
import { adminAPI, classAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SLOT_MINUTES = 30;
const SCHEDULE_START_MINUTES = 9 * 60;
const SCHEDULE_END_MINUTES = 17 * 60;
const ROW_HEIGHT = 48;
const toMinutes = (time) => {
  const [hours, minutes] = String(time).split(':').map(Number);
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
};

const fromMinutes = (minutes) => {
  const boundedMinutes = Math.max(0, Math.min(minutes, 23 * 60 + 59));
  const hours = Math.floor(boundedMinutes / 60);
  const mins = boundedMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const TIME_SLOTS = Array.from(
  { length: (SCHEDULE_END_MINUTES - SCHEDULE_START_MINUTES) / SLOT_MINUTES },
  (_, index) => fromMinutes(SCHEDULE_START_MINUTES + index * SLOT_MINUTES)
);
const BREAK_SLOTS = new Set(['12:00']);
const DEFAULT_DURATION_MINUTES = 60;
const DURATION_OPTIONS = [30, 45, 60, 75, 90, 120, 150, 180];
const DEFAULT_YEARS = [1, 2, 3, 4];
const DEFAULT_SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const DEFAULT_SECTIONS = ['A', 'B', 'C', 'D'];
const colorClasses = [
  'border-blue-200 bg-blue-50 text-blue-900',
  'border-emerald-200 bg-emerald-50 text-emerald-900',
  'border-amber-200 bg-amber-50 text-amber-900',
  'border-rose-200 bg-rose-50 text-rose-900',
  'border-violet-200 bg-violet-50 text-violet-900',
  'border-cyan-200 bg-cyan-50 text-cyan-900'
];

const getClassId = (classItem) => classItem?._id || classItem?.id;

const getDefaultAcademicYear = () => {
  const currentYear = new Date().getFullYear();
  return `${currentYear}-${currentYear + 1}`;
};

const getClassDuration = (classItem) => {
  const duration = Number(classItem?.schedule?.duration);
  if (Number.isFinite(duration) && duration > 0) return duration;
  const start = toMinutes(classItem?.schedule?.startTime);
  const end = toMinutes(classItem?.schedule?.endTime);
  return Math.max(SLOT_MINUTES, end - start || DEFAULT_DURATION_MINUTES);
};

const getClassEndTime = (classItem) => fromMinutes(toMinutes(classItem?.schedule?.startTime) + getClassDuration(classItem));

const rangesOverlap = (startA, endA, startB, endB) => startA < endB && startB < endA;

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
  durationMinutes: DEFAULT_DURATION_MINUTES,
  classroom: '',
  description: ''
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
    year: '',
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
    fetchClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.department, filters.year, filters.semester, filters.section, filters.teacherId]);

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
        res = await classAPI.getManageClasses(filters);
      }
      if (res.success && res.data && res.data.classes) {
        setClasses(res.data.classes);
      } else if (res.success && Array.isArray(res.data)) {
        setClasses(res.data);
      } else {
        setClasses([]);
        setError(res.message || 'Failed to load schedule');
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

  const getOccupyingClass = (day, time) => {
    const slotMin = toMinutes(time);
    return classes.find((c) => {
      if (c.schedule?.dayOfWeek !== day) return false;
      const startMin = toMinutes(c.schedule?.startTime);
      const duration = getClassDuration(c);
      const endMin = startMin + duration;
      return slotMin >= startMin && slotMin < endMin;
    });
  };

  const openAdd = (dayOfWeek, startTime) => {
    if (BREAK_SLOTS.has(startTime)) return;
    const endTime = fromMinutes(toMinutes(startTime) + DEFAULT_DURATION_MINUTES);
    setDraft({
      ...emptyDraft,
      department: filters.department || user?.department || departments[0] || '',
      semester: filters.semester || '',
      year: filters.year || (filters.semester ? Math.ceil(Number(filters.semester) / 2) : years[0] || ''),
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
      endTime: getClassEndTime(classItem),
      classroom: classItem.classroom || '',
      description: classItem.description || ''
    });
  };

  const updateDraft = (event) => {
    const { name, value } = event.target;
    setDraft((prev) => {
      let updated = {
        ...prev,
        [name]: value,
        ...(name === 'department' ? { year: '', semester: '', section: '', teacherId: '' } : {}),
        ...(name === 'year' ? { semester: '', section: '' } : {}),
        ...(name === 'semester' ? { section: '' } : {}),
        ...(name === 'section' ? { section: value.toUpperCase() } : {})
      };

      if (name === 'startTime') {
        const duration = toMinutes(prev.endTime) - toMinutes(prev.startTime);
        updated.endTime = fromMinutes(toMinutes(value) + duration);
      }

      return updated;
    });
  };

  const draftConflict = useMemo(() => {
    if (!draft) return null;
    const draftStart = toMinutes(draft.startTime);
    const draftEnd = toMinutes(draft.endTime);
    if (draftEnd <= draftStart) return null;

    return classes.find((item) => {
      if (getClassId(item) === draft._id) return false;
      if (item.schedule?.dayOfWeek !== draft.dayOfWeek) return false;

      const itemStart = toMinutes(item.schedule?.startTime);
      const itemEnd = toMinutes(getClassEndTime(item));

      const overlaps = rangesOverlap(draftStart, draftEnd, itemStart, itemEnd);
      if (!overlaps) return false;

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

      setDraft(null);
      await fetchClasses();
    } catch (err) {
      setError(err.message || 'Failed to save class');
    } finally {
      setSaving(false);
    }
  };

  const handleDrop = async (dayOfWeek, startTime) => {
    if (!draggedClassId || BREAK_SLOTS.has(startTime)) return;
    const classItem = classes.find((item) => getClassId(item) === draggedClassId);
    setDraggedClassId(null);
    if (!classItem) return;

    const duration = getClassDuration(classItem);
    const endTime = fromMinutes(toMinutes(startTime) + duration);

    // Find any overlapping class in the target slot
    const targetStart = toMinutes(startTime);
    const targetEnd = targetStart + duration;

    const overlappingClasses = classes.filter((item) => {
      if (getClassId(item) === draggedClassId) return false;
      if (item.schedule?.dayOfWeek !== dayOfWeek) return false;

      const itemStart = toMinutes(item.schedule?.startTime);
      const itemEnd = toMinutes(getClassEndTime(item));

      return rangesOverlap(targetStart, targetEnd, itemStart, itemEnd);
    });

    try {
      setSaving(true);
      setError('');

      if (overlappingClasses.length > 0) {
        const conflictingNames = overlappingClasses.map((c) => c.subject).join(', ');
        const confirmReplace = window.confirm(
          `Conflict detected with existing class(es): ${conflictingNames}. Do you want to replace them?`
        );

        if (!confirmReplace) {
          setSaving(false);
          return;
        }

        // Delete the conflicting classes
        for (const confClass of overlappingClasses) {
          const delRes = await classAPI.deleteClass(getClassId(confClass));
          if (!delRes.success) {
            setError(delRes.message || 'Failed to replace existing class');
            setSaving(false);
            return;
          }
        }
      }

      // Update the dragged class schedule
      const response = await classAPI.updateClass(draggedClassId, {
        schedule: {
          ...(classItem.schedule || {}),
          dayOfWeek,
          startTime,
          endTime
        }
      });

      if (!response.success) {
        setError(response.message || 'Failed to move class');
        return;
      }

      await fetchClasses();
    } catch (err) {
      setError(err.message || 'Failed to move class');
    } finally {
      setSaving(false);
    }
  };

  const deleteDraft = async () => {
    if (!draft?._id || !window.confirm('Delete this class?')) return;
    try {
      setSaving(true);
      setError('');
      const response = await classAPI.deleteClass(draft._id);
      if (!response.success) {
        setError(response.message || 'Failed to delete class');
        return;
      }
      setDraft(null);
      await fetchClasses();
    } catch (err) {
      setError(err.message || 'Failed to delete class');
    } finally {
      setSaving(false);
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

      <div className="grid grid-cols-1 gap-3 rounded-lg border bg-white p-4 md:grid-cols-5">
        <label className="space-y-1">
          <span className="text-xs font-medium text-gray-600">Department</span>
          <select name="department" value={filters.department} onChange={handleFilterChange} className="input w-full">
            {departments.map((department) => (
              <option key={department} value={department}>{department}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-gray-600">Year</span>
          <select name="year" value={filters.year} onChange={handleFilterChange} className="input w-full">
            <option value="">All years</option>
            {years.map((year) => (
              <option key={year} value={year}>Year {year}</option>
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
        <div className="min-w-[880px] grid grid-cols-[88px_repeat(6,minmax(120px,1fr))] relative bg-gray-50">
          {/* Header Row */}
          <div className="p-3 bg-gray-50 border-b text-sm font-semibold text-gray-700">Time</div>
          {DAYS.map((day) => (
            <div key={day} className="border-l border-b p-3 bg-gray-50 text-sm font-semibold text-gray-700">{day.slice(0, 3)}</div>
          ))}

          {/* Time Slots & Background Cells */}
          {TIME_SLOTS.map((time, slotIdx) => {
            const rowIdx = slotIdx + 2;
            const isBreak = BREAK_SLOTS.has(time);

            return (
              <React.Fragment key={time}>
                {/* Time Label */}
                <div
                  className="flex items-start justify-center p-3 text-sm font-medium text-gray-700 border-b bg-gray-50"
                  style={{ gridColumn: 1, gridRow: rowIdx }}
                >
                  {time}
                </div>

                {isBreak ? (
                  /* Break Span across all columns */
                  <div
                    className="flex items-center justify-center border-l border-b border-gray-200 bg-gray-100 text-xs font-medium text-gray-500"
                    style={{ gridColumn: '2 / span 6', gridRow: rowIdx, minHeight: '88px' }}
                  >
                    Break
                  </div>
                ) : (
                  DAYS.map((day, dayIdx) => {
                    const colIdx = dayIdx + 2;
                    const occupyingClass = getOccupyingClass(day, time);

                    if (occupyingClass) {
                      return (
                        <div
                          key={`${day}-${time}`}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => handleDrop(day, time)}
                          className="border-l border-b border-gray-100 bg-white"
                          style={{ gridColumn: colIdx, gridRow: rowIdx, minHeight: '88px' }}
                        />
                      );
                    } else {
                      return (
                        <button
                          type="button"
                          key={`${day}-${time}`}
                          onClick={() => openAdd(day, time)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => handleDrop(day, time)}
                          className="border-l border-b border-gray-200 bg-white hover:bg-gray-50/50 transition flex items-center justify-center p-2 text-left"
                          style={{ gridColumn: colIdx, gridRow: rowIdx, minHeight: '88px' }}
                        >
                          <div className="flex h-full w-full items-center justify-center rounded border border-dashed border-gray-200 text-xs text-gray-400">
                            Free
                          </div>
                        </button>
                      );
                    }
                  })
                )}
              </React.Fragment>
            );
          })}

          {/* Dynamic Class Cards */}
          {classes.map((classItem) => {
            const dayIdx = DAYS.indexOf(classItem.schedule?.dayOfWeek);
            if (dayIdx === -1) return null;

            const startMin = toMinutes(classItem.schedule?.startTime);
            const duration = getClassDuration(classItem);
            const endMin = startMin + duration;

            const startRow = Math.max(0, Math.floor((startMin - SCHEDULE_START_MINUTES) / 30)) + 2;
            const endRow = Math.min(TIME_SLOTS.length, Math.ceil((endMin - SCHEDULE_START_MINUTES) / 30)) + 2;
            const rowSpan = Math.max(1, endRow - startRow);

            const colIdx = dayIdx + 2;
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
                className={`rounded-md border p-3 text-xs shadow-sm cursor-pointer transition select-none flex flex-col justify-between ${color}`}
                style={{
                  gridColumn: colIdx,
                  gridRow: `${startRow} / span ${rowSpan}`,
                  zIndex: 10,
                  margin: '3px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <div>
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="font-bold text-sm tracking-tight leading-tight">{classItem.subjectCode || classItem.subject}</span>
                    <GripVertical className="h-3.5 w-3.5 opacity-60 flex-shrink-0 cursor-grab active:cursor-grabbing" />
                  </div>
                  <div className="mt-1.5 font-medium truncate text-gray-700">{teacherName || 'Teacher'}</div>
                </div>
                <div className="mt-2 flex flex-col gap-0.5 text-[10px] opacity-80 border-t border-black/5 pt-1.5">
                  <div className="font-semibold text-gray-800">
                    Sem {classItem.semester} | Sec {classItem.section || 'All'}
                  </div>
                  <div className="text-gray-600 font-medium">
                    {classItem.schedule?.startTime} - {getClassEndTime(classItem)} ({duration}m)
                  </div>
                </div>
              </div>
            );
          })}
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-gray-600">Day of Week</span>
                  <select name="dayOfWeek" value={draft.dayOfWeek} onChange={updateDraft} required className="input w-full">
                    {DAYS.map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-gray-600">Start Time</span>
                  <select name="startTime" value={draft.startTime} onChange={updateDraft} required className="input w-full">
                    {TIME_SLOTS.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-gray-600">Duration</span>
                  <select
                    name="durationMinutes"
                    value={toMinutes(draft.endTime) - toMinutes(draft.startTime)}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setDraft((prev) => ({
                        ...prev,
                        endTime: fromMinutes(toMinutes(prev.startTime) + val)
                      }));
                    }}
                    required
                    className="input w-full"
                  >
                    {DURATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt} minutes</option>
                    ))}
                  </select>
                </label>
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

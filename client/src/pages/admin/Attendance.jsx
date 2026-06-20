import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarDays, GraduationCap, Loader, Pencil, Save, Users, X } from 'lucide-react';
import { adminAPI, classAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const YEARS = [1, 2, 3, 4];
const SECTIONS = ['A', 'B'];
const SEMESTERS_BY_YEAR = {
  1: [1, 2],
  2: [3, 4],
  3: [5, 6],
  4: [7, 8]
};
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AdminAttendance = () => {
  const { user } = useAuth();
  const department = user?.department || '';
  const [activeTab, setActiveTab] = useState('students');
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [editingClass, setEditingClass] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [classesResult, usersResult] = await Promise.allSettled([
        classAPI.getAdminRoutines(),
        adminAPI.getDepartmentUsers()
      ]);

      if (classesResult.status === 'rejected') {
        throw classesResult.reason;
      }

      const classesRes = classesResult.value;
      const usersRes = usersResult.status === 'fulfilled' ? usersResult.value : { data: { users: [] } };
      const allClasses = classesRes.data?.classes || classesRes.data || [];
      const departmentUsers = usersRes.data?.users || usersRes.data || [];

      setClasses(Array.isArray(allClasses) ? allClasses : []);
      setUsers(Array.isArray(departmentUsers) ? departmentUsers : []);
    } catch (err) {
      console.error('Failed to load admin routine data', err);
      setError(err?.message || 'Failed to load routine data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadMountedData = async () => {
      try {
        setLoading(true);
        setError('');

        const [classesResult, usersResult] = await Promise.allSettled([
          classAPI.getAdminRoutines(),
          adminAPI.getDepartmentUsers()
        ]);

        if (classesResult.status === 'rejected') {
          throw classesResult.reason;
        }

        if (!mounted) return;

        const classesRes = classesResult.value;
        const usersRes = usersResult.status === 'fulfilled' ? usersResult.value : { data: { users: [] } };
        const allClasses = classesRes.data?.classes || classesRes.data || [];
        const departmentUsers = usersRes.data?.users || usersRes.data || [];

        setClasses(Array.isArray(allClasses) ? allClasses : []);
        setUsers(Array.isArray(departmentUsers) ? departmentUsers : []);
      } catch (err) {
        if (!mounted) return;
        console.error('Failed to load admin routine data', err);
        setError(err?.message || 'Failed to load routine data');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadMountedData();
    return () => {
      mounted = false;
    };
  }, []);

  const students = useMemo(() => users.filter((userItem) => userItem.role === 'student'), [users]);
  const teachers = useMemo(() => users.filter((userItem) => userItem.role === 'teacher'), [users]);

  const routineMap = useMemo(() => {
    const grouped = {};
    YEARS.forEach((year) => {
      grouped[year] = {};
      SECTIONS.forEach((section) => {
        grouped[year][section] = classes.filter((cls) => {
          const classYear = classToYear(cls.semester);
          const classSection = (cls.section || '').toUpperCase();
          return classYear === year && classSection === section;
        });
      });
    });
    return grouped;
  }, [classes]);

  const unassignedClasses = useMemo(() => (
    classes.filter((cls) => !SECTIONS.includes((cls.section || '').toUpperCase()))
  ), [classes]);

  const teacherClassMap = useMemo(() => {
    const grouped = {};
    teachers.forEach((teacher) => {
      grouped[teacher._id] = YEARS.reduce((yearMap, year) => {
        yearMap[year] = SECTIONS.reduce((sectionMap, section) => {
          sectionMap[section] = classes.filter((cls) => {
            const classYear = classToYear(cls.semester);
            const classSection = (cls.section || '').toUpperCase();
            const teacherMatches = String(cls.teacherId?._id || cls.teacherId) === String(teacher._id);
            return classYear === year && classSection === section && teacherMatches;
          });
          return sectionMap;
        }, {});
        return yearMap;
      }, {});
    });
    return grouped;
  }, [classes, teachers]);

  const beginEdit = (cls) => {
    setEditingClass(cls);
    setEditForm({
      semester: String(cls.semester || 1),
      section: (cls.section || 'A').toUpperCase(),
      dayOfWeek: cls.schedule?.dayOfWeek || 'Monday',
      startTime: cls.schedule?.startTime || '09:00',
      endTime: cls.schedule?.endTime || '10:00',
      classroom: cls.classroom || ''
    });
    setError('');
  };

  const cancelEdit = () => {
    setEditingClass(null);
    setEditForm(null);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  };

  const saveRoutine = async (event) => {
    event.preventDefault();
    if (!editingClass || !editForm) return;

    const duration = getDurationMinutes(editForm.startTime, editForm.endTime);
    if (duration <= 0) {
      setError('End time must be after start time.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        semester: Number(editForm.semester),
        section: editForm.section,
        schedule: {
          dayOfWeek: editForm.dayOfWeek,
          startTime: editForm.startTime,
          endTime: editForm.endTime,
          duration
        },
        classroom: editForm.classroom || undefined
      };

      const res = await classAPI.updateClass(editingClass._id, payload);
      const updatedClass = res.data?.class;

      if (res.success && updatedClass) {
        setClasses((current) => current.map((cls) => (cls._id === updatedClass._id ? updatedClass : cls)));
        cancelEdit();
        return;
      }

      await loadData();
      cancelEdit();
    } catch (err) {
      console.error('Failed to update routine', err);
      setError(err?.message || 'Failed to update routine');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-secondary-600">
          <Loader className="w-5 h-5 animate-spin" />
          Loading routines...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-primary text-white rounded-lg p-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Routines</h1>
        <p className="opacity-90">{department || 'Department'} routines grouped by year, semester, and section.</p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

      <div className="flex gap-2 rounded-xl bg-white border border-secondary-200 p-2 w-fit">
        <TabButton active={activeTab === 'students'} onClick={() => setActiveTab('students')} icon={GraduationCap} label="Students" />
        <TabButton active={activeTab === 'teacher'} onClick={() => setActiveTab('teacher')} icon={BookOpen} label="Teacher" />
      </div>

      {editingClass && editForm && (
        <form onSubmit={saveRoutine} className="card p-5 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-secondary-900">Edit Routine</h2>
              <p className="text-sm text-secondary-600">{editingClass.subject} ({editingClass.subjectCode})</p>
            </div>
            <button type="button" onClick={cancelEdit} className="btn inline-flex items-center gap-2 self-start">
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <label className="space-y-1 text-sm">
              <span className="text-secondary-700">Semester</span>
              <select name="semester" value={editForm.semester} onChange={handleEditChange} className="input w-full">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                  <option key={semester} value={semester}>Semester {semester}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-secondary-700">Section</span>
              <select name="section" value={editForm.section} onChange={handleEditChange} className="input w-full">
                {SECTIONS.map((section) => (
                  <option key={section} value={section}>Section {section}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-secondary-700">Day</span>
              <select name="dayOfWeek" value={editForm.dayOfWeek} onChange={handleEditChange} className="input w-full">
                {DAYS.map((day) => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-secondary-700">Start</span>
              <input name="startTime" type="time" value={editForm.startTime} onChange={handleEditChange} className="input w-full" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-secondary-700">End</span>
              <input name="endTime" type="time" value={editForm.endTime} onChange={handleEditChange} className="input w-full" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-secondary-700">Room</span>
              <input name="classroom" value={editForm.classroom} onChange={handleEditChange} className="input w-full" />
            </label>
          </div>

          <button type="submit" className="btn btn-primary inline-flex items-center gap-2" disabled={saving}>
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Routine
          </button>
        </form>
      )}

      {activeTab === 'students' ? (
        <section className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard title="Department" value={department || '-'} icon={Users} />
            <SummaryCard title="Students" value={students.length} icon={GraduationCap} />
            <SummaryCard title="Routines" value={classes.length} icon={CalendarDays} />
          </div>

          <div className="space-y-5">
            {YEARS.map((year) => (
              <div key={year} className="card overflow-hidden">
                <div className="p-5 border-b border-secondary-200 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-secondary-900">{ordinalYear(year)} Year</h2>
                    <p className="text-sm text-secondary-600">Semesters {SEMESTERS_BY_YEAR[year].join(' and ')} - Sections A and B</p>
                  </div>
                  <div className="text-sm text-secondary-500">{sectionClassCount(routineMap[year])} classes</div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 p-5">
                  {SECTIONS.map((section) => (
                    <RoutineColumn key={section} year={year} section={section} classes={routineMap[year][section]} onEdit={beginEdit} />
                  ))}
                </div>
              </div>
            ))}

            {unassignedClasses.length > 0 && (
              <div className="card p-5">
                <h2 className="text-lg font-semibold text-secondary-900 mb-3">Needs Section</h2>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {unassignedClasses.map((cls) => (
                    <RoutineCard key={cls._id} cls={cls} onEdit={beginEdit} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard title="Teachers" value={teachers.length} icon={BookOpen} />
            <SummaryCard title="Department" value={department || '-'} icon={Users} />
            <SummaryCard title="Assigned Classes" value={classes.length} icon={CalendarDays} />
          </div>

          <div className="space-y-5">
            {teachers.length === 0 ? (
              <div className="card p-6 text-secondary-600">No teachers found for {department || 'this department'}.</div>
            ) : (
              teachers.map((teacher) => (
                <div key={teacher._id} className="card overflow-hidden">
                  <div className="p-5 border-b border-secondary-200 flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-secondary-900">{teacher.firstName} {teacher.lastName}</h2>
                      <p className="text-sm text-secondary-600">{teacher.email}</p>
                    </div>
                    <div className="text-sm text-secondary-500">{teacher.teacherId || teacher.employeeId || 'Teacher'}</div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 p-5">
                    {YEARS.map((year) => (
                      <div key={year} className="rounded-xl border border-secondary-200 bg-secondary-50 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-secondary-900">{ordinalYear(year)} Year</h3>
                          <span className="text-xs text-secondary-500">Sem {SEMESTERS_BY_YEAR[year].join('/')}</span>
                        </div>

                        <div className="space-y-3">
                          {SECTIONS.map((section) => {
                            const sectionClasses = teacherClassMap[teacher._id]?.[year]?.[section] || [];
                            return (
                              <div key={section} className="rounded-lg bg-white border border-secondary-200 p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-secondary-900">Section {section}</span>
                                  <span className="text-xs text-secondary-500">{sectionClasses.length} classes</span>
                                </div>
                                {sectionClasses.length === 0 ? (
                                  <p className="text-sm text-secondary-500">No classes assigned.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {sectionClasses.map((cls) => (
                                      <RoutineCard key={cls._id} cls={cls} onEdit={beginEdit} compact />
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
};

const classToYear = (semester) => {
  const sem = Number(semester) || 1;
  if (sem <= 2) return 1;
  if (sem <= 4) return 2;
  if (sem <= 6) return 3;
  return 4;
};

const getDurationMinutes = (startTime, endTime) => {
  const parseMinutes = (time) => {
    const [hours, minutes] = String(time).split(':').map(Number);
    return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
  };

  return parseMinutes(endTime) - parseMinutes(startTime);
};

const ordinalYear = (year) => {
  const suffix = year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th';
  return `${year}${suffix}`;
};

const sectionClassCount = (sections = {}) => Object.values(sections || {}).reduce((total, sectionClasses) => total + (sectionClasses?.length || 0), 0);

const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${active ? 'bg-primary-600 text-white' : 'bg-white text-secondary-700 hover:bg-secondary-50'}`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

const SummaryCard = ({ title, value, icon: Icon }) => (
  <div className="card p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-secondary-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-secondary-900">{value}</p>
      </div>
      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary-100 text-primary-600">
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

const RoutineColumn = ({ year, section, classes, onEdit }) => (
  <div className="rounded-xl border border-secondary-200 bg-white p-4">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="font-semibold text-secondary-900">Section {section}</h3>
        <p className="text-xs text-secondary-500">{ordinalYear(year)} Year - Sem {SEMESTERS_BY_YEAR[year].join('/')}</p>
      </div>
      <span className="text-xs rounded-full bg-secondary-100 px-2 py-1 text-secondary-700">{classes.length} classes</span>
    </div>

    {classes.length === 0 ? (
      <div className="rounded-lg border border-dashed border-secondary-300 px-4 py-6 text-sm text-secondary-500">
        No classes scheduled.
      </div>
    ) : (
      <div className="space-y-3">
        {classes.map((cls) => (
          <RoutineCard key={cls._id} cls={cls} onEdit={onEdit} />
        ))}
      </div>
    )}
  </div>
);

const RoutineCard = ({ cls, onEdit, compact = false }) => (
  <div className="rounded-lg border border-secondary-200 bg-secondary-50 p-3">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="font-medium text-secondary-900">{cls.subject} ({cls.subjectCode})</div>
        <div className="text-sm text-secondary-600">{cls.teacherId?.firstName} {cls.teacherId?.lastName}</div>
      </div>
      <button
        type="button"
        onClick={() => onEdit(cls)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-primary-600 hover:bg-primary-50"
        title="Edit routine"
        aria-label={`Edit ${cls.subject} routine`}
      >
        <Pencil className="w-4 h-4" />
      </button>
    </div>
    <div className={`mt-3 text-sm text-secondary-700 ${compact ? '' : 'space-y-1'}`}>
      <div>{cls.schedule?.dayOfWeek || 'Not scheduled'} - {cls.schedule?.startTime || '--:--'} to {cls.schedule?.endTime || '--:--'}</div>
      <div>Semester {cls.semester} - Section {cls.section || 'Not set'} - {cls.department}</div>
      {cls.classroom && <div>Room {cls.classroom}</div>}
    </div>
  </div>
);

export default AdminAttendance;

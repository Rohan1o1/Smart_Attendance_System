import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, BarChart3, CalendarDays, TrendingDown, TrendingUp } from 'lucide-react';
import { attendanceAPI } from '../../services/api';

const AdminAnalytics = () => {
  const [attendanceTrend, setAttendanceTrend] = useState([]);
  const [departmentComparison, setDepartmentComparison] = useState([]);
  const [summary, setSummary] = useState({ todayAttendance: '—', attendanceRate: '—', trendDelta: 0 });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const response = await attendanceAPI.getStats();
        const overall = response.data?.overallStatistics || {};
        const dailyTrends = response.data?.dailyTrends || [];
        const departmentStats = response.data?.departmentStatistics || [];

        if (!mounted) return;

        const trend = dailyTrends.slice(-5).map((item) => ({
          day: new Date(item._id).toLocaleDateString('en-US', { weekday: 'short' }),
          value: item.totalRecords ? Math.round(((item.presentCount + item.lateCount) / item.totalRecords) * 100) : 0
        }));

        const latestRate = overall.attendanceRate != null ? overall.attendanceRate : trend.at(-1)?.value || 0;
        const previousRate = trend.length > 1 ? trend[trend.length - 2].value : latestRate;

        setAttendanceTrend(trend);
        setDepartmentComparison(
          departmentStats
            .filter((item) => item._id)
            .map((item) => ({ name: item._id, value: Math.round(item.attendanceRate || 0) }))
        );
        setSummary({
          todayAttendance: (overall.presentCount || 0) + (overall.lateCount || 0),
          attendanceRate: latestRate,
          trendDelta: Math.round((latestRate - previousRate) * 10) / 10
        });
      } catch (error) {
        console.error('Failed to load admin analytics', error);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const latestRate = useMemo(() => summary.attendanceRate || 0, [summary.attendanceRate]);
  const trendDelta = summary.trendDelta;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-primary text-white rounded-lg p-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="opacity-90">
          Monitor attendance trends across the week and compare performance by department.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 mb-1">Today's Attendance</p>
              <p className="text-2xl font-bold text-secondary-900">{summary.todayAttendance}</p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-warning-100">
              <CalendarDays className="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 mb-1">Attendance Rate</p>
              <p className="text-2xl font-bold text-secondary-900">{latestRate}%</p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-success-100">
              <TrendingUp className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 mb-1">Weekly Change</p>
              <p className="text-2xl font-bold text-secondary-900">{trendDelta >= 0 ? '+' : ''}{trendDelta}%</p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary-100">
              <ArrowUpRight className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-secondary-900">Attendance Trend</h2>
              <p className="text-sm text-secondary-600">Shows attendance percentage over time.</p>
            </div>
            <BarChart3 className="w-5 h-5 text-primary-600" />
          </div>

          <div className="h-72 rounded-xl border border-secondary-200 bg-secondary-50 p-4">
            <TrendLineChart data={attendanceTrend} />
          </div>

          <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs text-secondary-600">
            {attendanceTrend.map((item) => (
              <div key={item.day} className="space-y-1">
                <div className="font-medium text-secondary-900">{item.value}%</div>
                <div>{item.day}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-secondary-900">Department Comparison</h2>
              <p className="text-sm text-secondary-600">Compares attendance across departments.</p>
            </div>
            <TrendingDown className="w-5 h-5 text-warning-600 rotate-180" />
          </div>

          <div className="space-y-4">
            {departmentComparison.map((department) => (
              <div key={department.name}>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium text-secondary-900">{department.name}</span>
                  <span className="text-secondary-600">{department.value}%</span>
                </div>
                <div className="h-3 rounded-full bg-secondary-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 to-success-500"
                    style={{ width: `${department.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-secondary-600">
            {departmentComparison.map((department) => (
              <div key={department.name} className="rounded-lg border border-secondary-200 bg-white px-4 py-3 flex items-center justify-between">
                <span>{department.name}</span>
                <span className="font-semibold text-secondary-900">{department.value}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const TrendLineChart = ({ data }) => {
  const width = 640;
  const height = 260;
  const padding = 32;
  const points = data.map((item, index) => {
    const x = padding + (index * (width - padding * 2)) / (data.length - 1);
    const y = height - padding - (item.value / 100) * (height - padding * 2);
    return { ...item, x, y };
  });

  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      {[0, 1, 2, 3].map((index) => {
        const y = padding + index * ((height - padding * 2) / 3);
        return <line key={index} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e5e7eb" strokeDasharray="4 4" />;
      })}

      <path d={path} fill="none" stroke="#7c3aed" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((point) => (
        <g key={point.day}>
          <circle cx={point.x} cy={point.y} r="7" fill="#7c3aed" />
          <circle cx={point.x} cy={point.y} r="12" fill="rgba(124,58,237,0.12)" />
        </g>
      ))}
    </svg>
  );
};

export default AdminAnalytics;
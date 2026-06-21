/**
 * Main App Component
 * Root application component with routing and global providers
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import LoginSelector from './components/auth/LoginSelector';
import StudentLogin from './components/auth/StudentLogin';
import TeacherLogin from './components/auth/TeacherLogin';
import AdminLogin from './components/auth/AdminLogin';
import SuperAdminLogin from './components/auth/SuperAdminLogin';
import RegisterSelector from './components/auth/RegisterSelector';
import StudentRegister from './components/auth/StudentRegister';
import TeacherRegister from './components/auth/TeacherRegister';
import AdminRegister from './components/auth/AdminRegister';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Layout Components
import Layout from './components/layout/Layout';

// Page Components
import LandingPage from './pages/LandingPage';
import StudentDashboard from './pages/student/Dashboard';
import StudentAttendance from './pages/student/Attendance';
import StudentClasses from './pages/student/Classes';
import MarkAttendanceNew from './pages/student/MarkAttendanceNew';
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherClasses from './pages/teacher/Classes';
import TeacherAttendance from './pages/teacher/Attendance';
import TeacherStudents from './pages/teacher/Students';
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import AdminClasses from './pages/admin/Classes';
import AdminAnalytics from './pages/admin/Analytics';
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import Profile from './pages/Profile';
import NotFoundPage from './pages/error/NotFound';
import UnauthorizedPage from './pages/error/Unauthorized';
import ServerErrorPage from './pages/error/ServerError';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

/**
 * App Router Component
 * Contains all application routes
 */
const AppRouter = () => {
  const { isAuthenticated, user } = useAuth();

  // Helper to get redirect path based on role
  const getRedirectPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'superadmin': return '/superadmin';
      case 'admin': return '/admin';
      case 'teacher': return '/teacher';
      case 'student': return '/student';
      default: return '/login';
    }
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? (
            <Navigate to={getRedirectPath()} replace />
          ) : (
            <LandingPage />
          )
        } 
      />
      
      {/* Login Routes */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? (
            <Navigate to={getRedirectPath()} replace />
          ) : (
            <LoginSelector />
          )
        } 
      />

      <Route 
        path="/login/student" 
        element={
          isAuthenticated ? (
            <Navigate to={getRedirectPath()} replace />
          ) : (
            <StudentLogin />
          )
        } 
      />

      <Route 
        path="/login/teacher" 
        element={
          isAuthenticated ? (
            <Navigate to={getRedirectPath()} replace />
          ) : (
            <TeacherLogin />
          )
        } 
      />

      <Route 
        path="/login/admin" 
        element={
          isAuthenticated ? (
            <Navigate to={getRedirectPath()} replace />
          ) : (
            <AdminLogin />
          )
        } 
      />

      <Route 
        path="/login/superadmin" 
        element={
          isAuthenticated ? (
            <Navigate to={getRedirectPath()} replace />
          ) : (
            <SuperAdminLogin />
          )
        } 
      />

      {/* Registration Routes */}
      <Route 
        path="/register" 
        element={
          isAuthenticated ? (
            <Navigate to={getRedirectPath()} replace />
          ) : (
            <RegisterSelector />
          )
        } 
      />

      <Route 
        path="/register/student" 
        element={
          isAuthenticated ? (
            <Navigate to={getRedirectPath()} replace />
          ) : (
            <StudentRegister />
          )
        } 
      />

      <Route 
        path="/register/teacher" 
        element={
          isAuthenticated ? (
            <Navigate to={getRedirectPath()} replace />
          ) : (
            <TeacherRegister />
          )
        } 
      />

      <Route 
        path="/register/admin" 
        element={
          isAuthenticated ? (
            <Navigate to={getRedirectPath()} replace />
          ) : (
            <AdminRegister />
          )
        } 
      />

      {/* Protected Routes */}
      <Route
        path="/student/*"
        element={
          <ProtectedRoute requiredRole="student">
            <Layout userRole="student">
              <Routes>
                <Route index element={<StudentDashboard />} />
                <Route path="attendance" element={<MarkAttendanceNew />} />
                <Route path="classes" element={<StudentClasses />} />
                <Route path="profile" element={<Profile />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/*"
        element={
          <ProtectedRoute requiredRole="teacher">
            <Layout userRole="teacher">
              <Routes>
                <Route index element={<TeacherDashboard />} />
                <Route path="classes" element={<TeacherClasses />} />
                <Route path="attendance" element={<TeacherAttendance />} />
                <Route path="students" element={<TeacherStudents />} />
                <Route path="profile" element={<Profile />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requiredRole="admin">
            <Layout userRole="admin">
              <Routes>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="classes" element={<AdminClasses />} />
                <Route path="routines" element={<Navigate to="/admin/classes" replace />} />
                <Route path="attendance" element={<Navigate to="/admin/classes" replace />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="profile" element={<Profile />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/superadmin/*"
        element={
          <ProtectedRoute requiredRole="superadmin">
            <Layout userRole="superadmin">
              <Routes>
                <Route index element={<SuperAdminDashboard />} />
                <Route path="admins" element={<SuperAdminDashboard section="departments" />} />
                <Route path="users" element={<SuperAdminDashboard section="users" />} />
                <Route path="profile" element={<Profile />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Dashboard redirect based on role */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Navigate to={getRedirectPath()} replace />
          </ProtectedRoute>
        }
      />

      {/* Error Pages */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

/**
 * Main App Component
 */
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <div className="App">
            <AppRouter />
          </div>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;

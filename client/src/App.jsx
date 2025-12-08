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

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? (
            <Navigate to={`/${user?.role || 'student'}`} replace />
          ) : (
            <LandingPage />
          )
        } 
      />
      
      <Route 
        path="/login" 
        element={
          isAuthenticated ? (
            <Navigate to={`/${user?.role || 'student'}`} replace />
          ) : (
            <Login />
          )
        } 
      />
      
      <Route 
        path="/register" 
        element={
          isAuthenticated ? (
            <Navigate to={`/${user?.role || 'student'}`} replace />
          ) : (
            <Register />
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
                <Route path="users" element={<div>Admin Users</div>} />
                <Route path="classes" element={<div>Admin Classes</div>} />
                <Route path="attendance" element={<div>Admin Attendance</div>} />
                <Route path="analytics" element={<div>Admin Analytics</div>} />
                <Route path="settings" element={<div>Admin Settings</div>} />
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
            <Navigate to={`/${user?.role || 'student'}`} replace />
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

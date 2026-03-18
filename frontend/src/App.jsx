import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import PostTask from './pages/PostTask';
import Finance from './pages/Finance';
import AdminPanel from './pages/AdminPanel';
import Settings from './pages/Settings';
import Verify from './pages/Verify';
import AdvertiserDashboard from './pages/AdvertiserDashboard';
import MySubmissions from './pages/MySubmissions';

function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center items-center h-screen text-xl">جاري التحميل...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role && user.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/tasks" element={<PrivateRoute><Tasks /></PrivateRoute>} />
        <Route path="/tasks/:id" element={<PrivateRoute><TaskDetail /></PrivateRoute>} />
        <Route path="/post-task" element={<PrivateRoute><PostTask /></PrivateRoute>} />
        <Route path="/finance" element={<PrivateRoute><Finance /></PrivateRoute>} />
        <Route path="/my-submissions" element={<PrivateRoute><MySubmissions /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/verify" element={<PrivateRoute><Verify /></PrivateRoute>} />
        <Route path="/advertiser" element={<PrivateRoute><AdvertiserDashboard /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute role="admin"><AdminPanel /></PrivateRoute>} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" toastOptions={{ style: { fontFamily: 'Cairo', direction: 'rtl' } }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

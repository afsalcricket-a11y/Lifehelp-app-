import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageLoader from '../ui/PageLoader';

// Signed-in users only. Real enforcement of data access happens with Supabase RLS.
export function ProtectedRoute() {
  const { session, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// Login/register are only for signed-out visitors.
export function PublicOnlyRoute() {
  const { session, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (session) return <Navigate to="/" replace />;
  return <Outlet />;
}

// Admins only. This hides the screen; the database (RLS + admin functions) is what actually protects the data.
export function AdminRoute() {
  const { profile, profileLoading, loading } = useAuth();
  if (loading || profileLoading) return <PageLoader />;
  if (!profile?.is_admin) return <Navigate to="/" replace />;
  return <Outlet />;
}

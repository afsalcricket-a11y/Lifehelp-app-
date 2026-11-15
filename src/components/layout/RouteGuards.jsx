import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageLoader from '../ui/PageLoader';

// Signed-in users only. Real enforcement of data access happens with Supabase RLS in later parts.
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

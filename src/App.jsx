import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import SplashScreen from './components/layout/SplashScreen';
import AppLayout from './components/layout/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from './components/layout/RouteGuards';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Emergency from './pages/Emergency';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Blood from './pages/Blood';
import Community from './pages/Community';
import Jobs from './pages/Jobs';
import Education from './pages/Education';
import Donations from './pages/Donations';

export default function App() {
  const { loading } = useAuth();
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setMinTimePassed(true), 2200);
    return () => clearTimeout(id);
  }, []);

  if (!minTimePassed || loading) return <SplashScreen />;

  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="explore" element={<Explore />} />
          <Route path="emergency" element={<Emergency />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/edit" element={<EditProfile />} />
          <Route path="blood" element={<Blood />} />
          <Route path="community" element={<Community />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="education" element={<Education />} />
          <Route path="donations" element={<Donations />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

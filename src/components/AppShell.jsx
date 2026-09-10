import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants/routes';
import AuthLoadingScreen from './AuthLoadingScreen';
import Sidebar from './Sidebar';
import AppHeader from './layout/AppHeader';

export default function AppShell() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  if (loading) return <AuthLoadingScreen />;
  if (!user) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }

  return (
    <div className="min-h-dvh w-full bg-canvas">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} unread={unread} onUnread={setUnread} />
      <div className="flex min-h-dvh flex-col min-w-0 md:pl-[4.25rem] lg:pl-60">
        <AppHeader unread={unread} onMenu={() => setMenuOpen(true)} />
        <main className="flex-1 w-full flex flex-col min-w-0 min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

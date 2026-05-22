import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import GamePage from './pages/GamePage';
import AuthPage from './pages/AuthPage';
import AdminPage from './pages/AdminPage';
import { useStore } from './store/gameStore';

export default function App() {
  const { user, authLoading, loadUser } = useStore();

  useEffect(() => { loadUser(); }, []);

  if (authLoading) return null;

  return (
    <Routes>
      <Route path="/" element={user ? <GamePage /> : <Navigate to="/auth" />} />
      <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/" />} />
      <Route path="/admin" element={user?.isAdmin ? <AdminPage /> : <Navigate to="/" />} />
    </Routes>
  );
}

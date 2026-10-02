import { useEffect } from 'react';
import DashboardPage from './pages/DashboardPage';
import LandingPage from './pages/LandingPage';
import SettingsPage from './pages/SettingsPage';
import DoubtPage from './pages/DoubtPage';
import AdminDashboard from './pages/AdminDashboard';
import ErrorBoundary from './components/ui/ErrorBoundary';
import useAppStore from './stores/appStore';
import { watchAuth } from './services/firebaseService';

export default function App() {
    const { currentPage, userName, setAuthUser, setAuthReady, setUserName } = useAppStore();

    useEffect(() => {
        const unsub = watchAuth((u) => {
            setAuthUser(u);
            if (u) setUserName(u.name);
            setAuthReady(true);
        });
        const t = setTimeout(() => setAuthReady(true), 2500); // never hang if Firebase missing
        return () => { try { unsub?.(); } catch (e) {} clearTimeout(t); };
    }, []);

    if (!userName || currentPage === 'landing') {
        return <LandingPage />;
    }

    switch (currentPage) {
        case 'settings':
            return <ErrorBoundary name="settings"><SettingsPage /></ErrorBoundary>;
        case 'doubt':
            return <ErrorBoundary name="setup guide"><DoubtPage /></ErrorBoundary>;
        case 'admin':
            return <ErrorBoundary name="admin"><AdminDashboard /></ErrorBoundary>;
        case 'dashboard':
        default:
            return <ErrorBoundary name="dashboard"><DashboardPage /></ErrorBoundary>;
    }
}

import DashboardPage from './pages/DashboardPage';
import LandingPage from './pages/LandingPage';
import SettingsPage from './pages/SettingsPage';
import DoubtPage from './pages/DoubtPage';
import useAppStore from './stores/appStore';

export default function App() {
    const { currentPage, userName } = useAppStore();

    if (!userName || currentPage === 'landing') {
        return <LandingPage />;
    }

    switch (currentPage) {
        case 'settings':
            return <SettingsPage />;
        case 'doubt':
            return <DoubtPage />;
        case 'dashboard':
        default:
            return <DashboardPage />;
    }
}


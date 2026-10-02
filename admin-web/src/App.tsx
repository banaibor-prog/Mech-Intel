import { useRoute } from './router';
import { SessionProvider, useSession } from './session';
import { FeedbackProvider, Loading } from './components/ui';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import Jobs from './pages/Jobs';
import Bookings from './pages/Bookings';
import Reports from './pages/Reports';
import Reviews from './pages/Reviews';
import Settings from './pages/Settings';
import Activity from './pages/Activity';

function Routes() {
  const [section, id, value] = useRoute();
  const filter = id === 'filter' ? value : undefined;
  switch (section) {
    case 'users':
      return id && id !== 'filter' ? <UserDetail key={id} uid={id} /> : <Users key={filter ?? 'all'} initialFilter={filter} />;
    case 'jobs':
      return <Jobs key={filter ?? 'live'} initialFilter={filter} />;
    case 'bookings':
      return <Bookings key={filter ?? 'active'} initialFilter={filter} />;
    case 'reports':
      return <Reports />;
    case 'reviews':
      return <Reviews />;
    case 'settings':
      return <Settings />;
    case 'activity':
      return <Activity />;
    default:
      return <Dashboard />;
  }
}

function Gate() {
  const session = useSession();
  if (session.status === 'loading') return <Loading label="Checking your access…" />;
  if (session.status === 'signedOut') return <Login />;
  if (session.status === 'denied') return <Login denied />;
  return <Routes />;
}

export default function App() {
  return (
    <SessionProvider>
      <FeedbackProvider>
        <Gate />
      </FeedbackProvider>
    </SessionProvider>
  );
}

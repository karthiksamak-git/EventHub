import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/auth-context';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UpiSetup from './pages/UpiSetup';
import EventsList from './pages/EventsList';
import EventDetail from './pages/EventDetail';
import CreateEvent from './pages/CreateEvent';
import Calendar from './pages/Calendar';
import Venues from './pages/Venues';
import VenueDetail from './pages/VenueDetail';
import Network from './pages/Network';
import MyTickets from './pages/MyTickets';
import Dashboard from './pages/Dashboard';
import CheckIn from './pages/CheckIn';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { isAuth, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (isAuth) return children;
  // Remember where the visitor was going so login can return them there.
  return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
};

const AppRoutes = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        {/* These pages redirect signed-in visitors themselves, so they can honour
            the page that originally sent the visitor to sign in. */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile/upi-setup" element={<ProtectedRoute><UpiSetup /></ProtectedRoute>} />
        <Route path="/events" element={<EventsList />} />
        <Route path="/events/create" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/events/:id/edit" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/venues" element={<Venues />} />
        <Route path="/venues/:id" element={<VenueDetail />} />
        <Route path="/network" element={<Network />} />
        <Route path="/my-tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/checkin" element={<ProtectedRoute><CheckIn /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1A1B2E',
              color: '#F0F0FF',
              border: '1px solid rgba(108,99,255,0.25)',
              borderRadius: '10px',
              fontSize: '0.875rem'
            },
            success: { iconTheme: { primary: '#4ECDC4', secondary: '#1A1B2E' } },
            error: { iconTheme: { primary: '#FF6B6B', secondary: '#1A1B2E' } }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
export default App;

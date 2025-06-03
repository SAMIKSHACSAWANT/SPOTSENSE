import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Auth Provider
import { AuthProvider } from './context/AuthContext';

// Pages
import HomePage from './pages/HomePage';
import ParkingSlotPage from './pages/ParkingSlotPage';
import ParkingDetailPage from './pages/ParkingDetailPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import MyBookingsPage from './pages/MyBookingsPage';
import AndheriParkingPage from './pages/NearbyMallsPage';
import ComponentsShowcase from './pages/ComponentsShowcase';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/parking/:parkingId" element={<ParkingSlotPage />} />
            <Route path="/parking-detail/:parkingId" element={<ParkingDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/my-bookings" element={<MyBookingsPage />} />
            <Route path="/nearby-malls" element={<AndheriParkingPage />} />
            <Route path="/components" element={<ComponentsShowcase />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
        <ToastContainer position="bottom-right" />
      </div>
    </AuthProvider>
  );
}

export default App; 
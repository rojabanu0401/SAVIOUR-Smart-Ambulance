import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import LandingPage from './pages/LandingPage';
import CommonLogin from './pages/common/CommonLogin';
import CommonDashboard from './pages/common/CommonDashboard';
import DriverLogin from './pages/driver/DriverLogin';
import DriverVerification from './pages/driver/DriverVerification';
import DriverDashboard from './pages/driver/DriverDashboard';
import DriverNavigation from './pages/driver/DriverNavigation';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            {/* Landing / Role Selection */}
            <Route path="/" element={<LandingPage />} />

            {/* Common User Routes */}
            <Route path="/common/login" element={<CommonLogin />} />
            <Route
              path="/common/dashboard"
              element={
                <ProtectedRoute requiredRole="common_user">
                  <CommonDashboard />
                </ProtectedRoute>
              }
            />

            {/* Driver Routes */}
            <Route path="/driver/login" element={<DriverLogin />} />
            <Route path="/driver/verification" element={<DriverVerification />} />
            <Route
              path="/driver/dashboard"
              element={
                <ProtectedRoute requiredRole="driver">
                  <DriverDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver/navigation"
              element={
                <ProtectedRoute requiredRole="driver">
                  <DriverNavigation />
                </ProtectedRoute>
              }
            />

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
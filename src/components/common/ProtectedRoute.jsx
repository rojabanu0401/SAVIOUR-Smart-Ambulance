import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

export const ProtectedRoute = ({ children, requiredRole = 'common_user' }) => {
  const { commonUser, driver, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          gap: '1rem',
        }}
      >
        <LoadingSpinner size={36} color="var(--primary-600)" />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Verifying authorization session...
        </p>
      </div>
    );
  }

  if (requiredRole === 'common_user' && !commonUser) {
    return <Navigate to="/common/login" state={{ from: location }} replace />;
  }

  if (requiredRole === 'driver' && !driver) {
    return <Navigate to="/driver/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;

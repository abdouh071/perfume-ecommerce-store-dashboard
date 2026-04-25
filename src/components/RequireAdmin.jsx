import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STAFF_ROLES = ['admin', 'manager', 'confirmer'];

/**
 * Route guard for the Admin Dashboard.
 * - If the user is not logged in → redirect to /login
 * - If the user is logged in but does not have a staff role → redirect to /
 * - If the user is staff → render children normally
 *
 * Because AuthContext already waits for Firebase to resolve before rendering
 * children (via {!loading && children}), by the time this guard runs the
 * auth state is guaranteed to be known — no flash of admin content.
 */
export default function RequireAdmin({ children }) {
  const { currentUser, userProfile } = useAuth();

  // Not logged in at all → send to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but profile not yet loaded (edge case) → show nothing
  if (!userProfile) {
    return null;
  }

  // Logged in but not staff → redirect to home silently
  if (!STAFF_ROLES.includes(userProfile.role)) {
    return <Navigate to="/" replace />;
  }

  // All checks passed — render the admin page
  return children;
}

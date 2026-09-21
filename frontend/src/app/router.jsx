import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import RouteSkeleton from '../components/feedback/RouteSkeleton';

// Dashboard is loaded eagerly per performance specification
import DashboardPage from '../pages/DashboardPage';

// All other routes are lazy-loaded with Suspense + skeleton fallback
const RecommendationsPage = lazy(() => import('../pages/RecommendationsPage'));
const RecommendationDetailPage = lazy(() => import('../pages/RecommendationDetailPage'));
const TelemetryPage = lazy(() => import('../pages/TelemetryPage'));
const ForecastsPage = lazy(() => import('../pages/ForecastsPage'));
const AnomaliesPage = lazy(() => import('../pages/AnomaliesPage'));
const HistoryPage = lazy(() => import('../pages/HistoryPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const SystemStatusPage = lazy(() => import('../pages/SystemStatusPage'));


function withSuspense(Component) {
  return (
    <Suspense fallback={<RouteSkeleton />}>
      <Component />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'recommendations',
        element: withSuspense(RecommendationsPage),
      },
      {
        path: 'recommendations/:id',
        element: withSuspense(RecommendationDetailPage),
      },
      {
        path: 'telemetry',
        element: withSuspense(TelemetryPage),
      },
      {
        path: 'forecasts',
        element: withSuspense(ForecastsPage),
      },
      {
        path: 'anomalies',
        element: withSuspense(AnomaliesPage),
      },
      {
        path: 'history',
        element: withSuspense(HistoryPage),
      },
      {
        path: 'settings',
        element: withSuspense(SettingsPage),
      },
      {
        path: 'system-status',
        element: withSuspense(SystemStatusPage),
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);

export default router;

import { lazy, Suspense } from 'react';
import type { ReactElement } from 'react';
import { Navigate, useRoutes } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoadingScreen } from './components/feedback/LoadingScreen';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const SuppliersPage = lazy(() => import('./pages/SuppliersPage'));
const OutsourcersPage = lazy(() => import('./pages/OutsourcersPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const MachineryPage = lazy(() => import('./pages/MachineryPage'));
const OperationsPage = lazy(() => import('./pages/OperationsPage'));
const BillingPage = lazy(() => import('./pages/BillingPage'));
const CollectionsPage = lazy(() => import('./pages/CollectionsPage'));
const AccountsPage = lazy(() => import('./pages/AccountsPage'));
const PersonelPage = lazy(() => import('./pages/PersonelPage'));
const TaxCalculationPage = lazy(() => import('./pages/TaxCalculationPage'));
const PdfGenerationPage = lazy(() => import('./pages/PdfGenerationPage'));

function withSuspense(element: ReactElement) {
  return <Suspense fallback={<LoadingScreen />}>{element}</Suspense>;
}

export function AppRoutes() {
  const element = useRoutes([
    {
      path: '/login',
      element: <LoginPage />,
    },
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: withSuspense(<DashboardPage />) },
        { path: 'customers', element: withSuspense(<CustomersPage />) },
        { path: 'suppliers', element: withSuspense(<SuppliersPage />) },
        { path: 'outsourcers', element: withSuspense(<OutsourcersPage />) },
        { path: 'inventory', element: withSuspense(<InventoryPage />) },
        { path: 'machinery', element: withSuspense(<MachineryPage />) },
        { path: 'operations', element: withSuspense(<OperationsPage />) },
        { path: 'billing', element: withSuspense(<BillingPage />) },
        { path: 'collections', element: withSuspense(<CollectionsPage />) },
        { path: 'accounts', element: withSuspense(<AccountsPage />) },
        { path: 'personel', element: withSuspense(<PersonelPage />) },
        { path: 'tax-calculation', element: withSuspense(<TaxCalculationPage />) },
        { path: 'pdf-generation', element: withSuspense(<PdfGenerationPage />) },
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ]);

  return element;
}


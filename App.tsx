
import React, { Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { TenantProvider, useTenant } from './context/TenantContext';
import Layout from './components/Layout';
import ImpersonationBanner from './components/ImpersonationBanner';
import ScrollToTop from './components/ScrollToTop';
import { ToastProvider } from './components/Toast';

// Lazy-loaded pages for code splitting
const Home = React.lazy(() => import('./pages/Home'));
const Menu = React.lazy(() => import('./pages/Menu'));
const OrderPage = React.lazy(() => import('./pages/Order'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const PlatformDashboard = React.lazy(() => import('./pages/platform/PlatformDashboard'));
const Login = React.lazy(() => import('./pages/Login'));
const CustomerProfile = React.lazy(() => import('./pages/CustomerProfile'));
const CustomerInsights = React.lazy(() => import('./pages/CustomerInsights'));
const DIY = React.lazy(() => import('./pages/DIY'));
const Contact = React.lazy(() => import('./pages/Contact'));
const Events = React.lazy(() => import('./pages/Events'));
const Rewards = React.lazy(() => import('./pages/Rewards'));
const Promoters = React.lazy(() => import('./pages/Promoters'));
const Tracking = React.lazy(() => import('./pages/Tracking'));
const Booking = React.lazy(() => import('./pages/Booking'));
const SharedPlan = React.lazy(() => import('./pages/SharedPlan'));
const ContractSign = React.lazy(() => import('./pages/ContractSign'));
const VendorPack = React.lazy(() => import('./pages/VendorPack'));
const DataSetup = React.lazy(() => import('./pages/admin/DataSetup'));
const Maintenance = React.lazy(() => import('./pages/Maintenance'));
const PitmasterAI = React.lazy(() => import('./pages/PitmasterAI'));
const Gallery = React.lazy(() => import('./pages/Gallery'));
const PaymentSuccess = React.lazy(() => import('./pages/PaymentSuccess'));

const PageLoader = () => (
  <div className="h-screen bg-black flex items-center justify-center text-white">Loading...</div>
);

// Protected Admin Route (allows both ADMIN and DEV roles)
const ProtectedAdminRoute: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const { user } = useApp();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'DEV')) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Protected DEV Route (platform owner only)
const ProtectedDevRoute: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const { user } = useApp();
  if (!user || user.role !== 'DEV') return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Protected Customer Route
const ProtectedCustomerRoute: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { settings, user, isLoading, connectionError, businessConfig } = useApp();
  const { isImpersonating } = useTenant();
  const feat = businessConfig.features;
  const location = useLocation();

  if (isLoading) return <div className="h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

  if (connectionError) {
      return (
          <div className="h-screen bg-black flex flex-col items-center justify-center text-white p-4 text-center">
              <h1 className="text-2xl font-bold text-red-500 mb-4">Connection Error</h1>
              <p className="mb-4">{connectionError}</p>
              <p className="text-sm text-gray-400">Please check your configuration and try again.</p>
          </div>
      );
  }

  // DEV user: redirect to platform dashboard (unless impersonating a tenant)
  if (user?.role === 'DEV' && !isImpersonating && location.pathname === '/') {
    return <Navigate to="/platform" replace />;
  }

  // Maintenance Mode Check
  const isMaintenance = settings?.maintenanceMode;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'DEV';
  const isAllowedPath = ['/login', '/admin', '/setup', '/platform'].some(path => location.pathname.startsWith(path));

  if (isMaintenance && !isAdmin && !isAllowedPath) {
      return <Maintenance />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      {/* Impersonation Banner */}
      <ImpersonationBanner />

      {isMaintenance && isAdmin && (
        <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white text-xs font-bold text-center py-1 z-[100] animate-pulse">
          MAINTENANCE MODE ACTIVE - Public access restricted
        </div>
      )}
      <Routes>
        {/* Setup Route - Outside Layout for Focus */}
        <Route path="/setup" element={<DataSetup />} />

        {/* Platform Dashboard - DEV only */}
        <Route path="/platform" element={
          <ProtectedDevRoute>
            <PlatformDashboard />
          </ProtectedDevRoute>
        } />

        {/* Main App Routes */}
        <Route path="*" element={
          <Layout>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                {feat.menuBrowsing && <Route path="/menu" element={<Menu />} />}
                {feat.catering && <Route path="/diy" element={<DIY />} />}
                {feat.onlineOrdering && <Route path="/order" element={<OrderPage />} />}
                {feat.events && <Route path="/events" element={<Events />} />}
                <Route path="/contact" element={<Contact />} />
                {feat.promoters && <Route path="/promoters" element={<Promoters />} />}
                {feat.tracking && <Route path="/tracking" element={<Tracking />} />}
                <Route path="/login" element={<Login />} />
                {feat.rewards && <Route path="/rewards" element={<Rewards />} />}
                {feat.gallery && <Route path="/gallery" element={<Gallery />} />}
                <Route path="/payment-success" element={<PaymentSuccess />} />

                {/* Booking Portal (self-service) */}
                {feat.bookingPortal && <Route path="/booking" element={<Booking />} />}

                {/* Shareable Group Plans (public) */}
                <Route path="/share/:id" element={<SharedPlan />} />

                {/* Contract Signing (public) */}
                {feat.contracts && <Route path="/contract/:id" element={<ContractSign />} />}

                {/* Vendor Info Pack (public) */}
                <Route path="/info-pack" element={<VendorPack />} />

                {feat.aiChat && (
                  <Route path="/pitmaster-ai" element={
                    <ProtectedCustomerRoute>
                      <PitmasterAI />
                    </ProtectedCustomerRoute>
                  } />
                )}

                <Route path="/profile" element={
                  <ProtectedCustomerRoute>
                    <CustomerProfile />
                  </ProtectedCustomerRoute>
                } />

                <Route path="/insights" element={
                  <ProtectedCustomerRoute>
                    <CustomerInsights />
                  </ProtectedCustomerRoute>
                } />

                <Route path="/admin" element={
                  <ProtectedAdminRoute>
                    <AdminDashboard />
                  </ProtectedAdminRoute>
                } />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Layout>
        } />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppProvider>
        <TenantProvider>
          <HashRouter>
            <ScrollToTop />
            <AppRoutes />
          </HashRouter>
        </TenantProvider>
      </AppProvider>
    </ToastProvider>
  );
};

export default App;

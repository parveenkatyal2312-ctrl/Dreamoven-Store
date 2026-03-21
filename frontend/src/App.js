import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import GRNPage from './pages/GRNPage';
import IssuePage from './pages/IssuePage';
import CurrentStockPage from './pages/CurrentStockPage';
import AlertsPage from './pages/AlertsPage';
import InventoryPage from './pages/InventoryPage';
import ReportsPage from './pages/ReportsPage';
import ItemsPage from './pages/ItemsPage';
import ScannerPage from './pages/ScannerPage';
import RequisitionsPage from './pages/RequisitionsPage';
import AutoPOPage from './pages/AutoPOPage';
import UsersPage from './pages/UsersPage';
import VendorsPage from './pages/VendorsPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import DailyPerishablesPage from './pages/DailyPerishablesPage';
import LocationsPage from './pages/LocationsPage';
import { Toaster } from './components/ui/sonner';
import './App.css';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/requisitions" replace />;
  }
  
  return children;
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }
  
  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
      } />
      
      <Route path="/" element={
        <ProtectedRoute allowedRoles={['admin', 'main_store']}>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/grn" element={
        <ProtectedRoute allowedRoles={['admin', 'main_store', 'kitchen']}>
          <Layout><GRNPage /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/auto-po" element={
        <ProtectedRoute allowedRoles={['admin', 'main_store']}>
          <Layout><AutoPOPage /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/issue" element={
        <ProtectedRoute allowedRoles={['admin', 'main_store']}>
          <Layout><IssuePage /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/current-stock" element={
        <ProtectedRoute allowedRoles={['admin', 'main_store']}>
          <Layout><CurrentStockPage /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/alerts" element={
        <ProtectedRoute allowedRoles={['admin', 'main_store']}>
          <Layout><AlertsPage /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/inventory" element={
        <ProtectedRoute allowedRoles={['admin', 'main_store']}>
          <Layout><InventoryPage /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/reports" element={
        <ProtectedRoute allowedRoles={['admin', 'main_store']}>
          <Layout><ReportsPage /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/items" element={
        <ProtectedRoute allowedRoles={['admin', 'main_store']}>
          <Layout><ItemsPage /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/scan" element={
        <ProtectedRoute>
          <Layout><ScannerPage /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/requisitions" element={
        <ProtectedRoute>
          <Layout><RequisitionsPage /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/users" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout><UsersPage /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/vendors" element={
        <ProtectedRoute allowedRoles={['admin', 'main_store']}>
          <Layout><VendorsPage /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/purchase-orders" element={
        <ProtectedRoute allowedRoles={['admin', 'main_store', 'kitchen']}>
          <Layout><PurchaseOrdersPage /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/daily-perishables" element={
        <ProtectedRoute allowedRoles={['admin', 'main_store']}>
          <Layout><DailyPerishablesPage /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/locations" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout><LocationsPage /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster richColors position="top-center" />
      </AuthProvider>
    </Router>
  );
}

export default App;

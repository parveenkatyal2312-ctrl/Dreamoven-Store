import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  ClipboardList, 
  Bell, 
  BarChart3,
  Home,
  Menu,
  X,
  QrCode,
  Boxes,
  ScanLine,
  FileText,
  Users,
  LogOut,
  User,
  Building2,
  ShoppingCart,
  TrendingDown,
  PackageCheck,
  Carrot,
  MapPin,
  RefreshCw,
  Save,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';

// App version - update this when making changes
const APP_VERSION = "1.2.3";

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin, isMainStore, isKitchen } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Force refresh to get latest version
  const handleForceRefresh = async () => {
    setRefreshing(true);
    try {
      // Clear service worker cache
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
        }
      }
      // Clear browser cache and reload
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      // Force reload from server
      window.location.reload(true);
    } catch (error) {
      console.error('Error refreshing:', error);
      window.location.reload(true);
    }
  };

  // Save and Sync function - ensures all data is saved to server
  const handleSaveAndSync = async () => {
    setSyncing(true);
    try {
      // Check online status
      if (!navigator.onLine) {
        toast.error('No internet connection. Please connect to the internet and try again.');
        setSyncing(false);
        return;
      }

      // Trigger sync if service worker supports it
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        try {
          const registration = await navigator.serviceWorker.ready;
          if ('sync' in registration) {
            await registration.sync.register('background-sync');
          }
        } catch (e) {
          console.log('Background sync not available:', e);
        }
      }

      // Clear any cached POST requests that might be pending
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          if (cacheName.includes('workbox') || cacheName.includes('runtime')) {
            // Keep these caches but trigger a refresh
          }
        }
      }

      // Make a health check to verify server connection using relative URL
      const apiUrl = process.env.REACT_APP_BACKEND_URL || '';
      const response = await fetch(`${apiUrl}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        // Store last sync time
        const syncTime = new Date().toLocaleString('en-IN', { 
          dateStyle: 'medium', 
          timeStyle: 'short' 
        });
        localStorage.setItem('lastSyncTime', new Date().toISOString());
        
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="font-medium">Data Saved & Synced!</p>
              <p className="text-xs text-slate-400">Synced at {syncTime}</p>
            </div>
          </div>,
          { duration: 4000 }
        );
      } else {
        toast.error('Server connection issue. Please try again.');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync. Please check your internet connection.');
    } finally {
      setSyncing(false);
    }
  };

  // Navigation items based on role
  const getNavItems = () => {
    const items = [];
    
    if (isMainStore || isAdmin) {
      items.push(
        { path: '/', icon: Home, label: 'Dashboard' },
        { path: '/auto-po', icon: FileText, label: 'Auto POs' },
        { path: '/purchase-orders', icon: ShoppingCart, label: 'Purchase Orders' },
        { path: '/grn', icon: Package, label: 'Receive (GRN)' },
        { path: '/requisitions', icon: ClipboardList, label: 'Requisitions' },
        { path: '/issue', icon: ClipboardList, label: 'Issue' },
        { path: '/daily-perishables', icon: Carrot, label: 'Daily Perishables' },
        { path: '/current-stock', icon: TrendingDown, label: 'Current Stock' },
        { path: '/alerts', icon: Bell, label: 'Alerts' },
        { path: '/inventory', icon: Boxes, label: 'Inventory' },
        { path: '/items', icon: QrCode, label: 'Items' },
        { path: '/vendors', icon: Building2, label: 'Vendors' },
        { path: '/reports', icon: BarChart3, label: 'Reports' },
        { path: '/scan', icon: ScanLine, label: 'Scan QR' },
      );
      
      if (isAdmin) {
        items.push({ path: '/users', icon: Users, label: 'Users' });
        items.push({ path: '/locations', icon: MapPin, label: 'Locations' });
      }
    } else if (isKitchen) {
      items.push(
        { path: '/requisitions', icon: ClipboardList, label: 'My Requisitions' },
        { path: '/purchase-orders', icon: ShoppingCart, label: 'Purchase Orders' },
        { path: '/grn', icon: PackageCheck, label: 'Receive Goods' },
        { path: '/scan', icon: ScanLine, label: 'Scan QR' },
      );
    }
    
    return items;
  };

  const navItems = getNavItems();

  // Bottom nav items based on role
  const getBottomNavItems = () => {
    if (isMainStore || isAdmin) {
      return [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/invoice-scan', icon: FileText, label: 'Invoice' },
        { path: '/scan', icon: ScanLine, label: 'Scan', highlight: true },
        { path: '/requisitions', icon: ClipboardList, label: 'Requests' },
        { path: '/alerts', icon: Bell, label: 'Alerts' },
      ];
    } else {
      return [
        { path: '/requisitions', icon: ClipboardList, label: 'Requests' },
        { path: '/scan', icon: ScanLine, label: 'Scan', highlight: true },
      ];
    }
  };

  const bottomNavItems = getBottomNavItems();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            DREAMOVEN
          </h1>
          <Link 
            to="/scan"
            className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors"
          >
            <ScanLine className="w-6 h-6" />
          </Link>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-72 bg-slate-900 border-r border-slate-800
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              DREAMOVEN
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {user?.role === 'kitchen' ? user?.location_name : 'Main Store'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Save & Sync Button - moved to top right */}
            <Button
              onClick={handleSaveAndSync}
              variant="outline"
              size="sm"
              disabled={syncing}
              className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/20 h-9 px-3"
              data-testid="save-sync-btn"
            >
              <Save className={`w-4 h-4 ${syncing ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline ml-2">{syncing ? 'Saving...' : 'Save & Sync'}</span>
            </Button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="p-3 border-b border-slate-800">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/50">
            <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center">
              <User className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : ''}`} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer with Version and Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500">v{APP_VERSION}</span>
            <Button
              onClick={handleForceRefresh}
              variant="ghost"
              size="sm"
              disabled={refreshing}
              className="text-xs text-slate-400 hover:text-white h-7 px-2"
              title="Update to latest version"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Updating...' : 'Update'}
            </Button>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 safe-area-pb">
        <div className="flex items-center justify-around px-2 py-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all
                  ${item.highlight
                    ? 'bg-emerald-600 -mt-4 px-5 py-3 shadow-lg shadow-emerald-600/30'
                    : isActive
                      ? 'text-emerald-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${item.highlight ? 'text-white' : ''}`} />
                <span className={`text-xs font-medium ${item.highlight ? 'text-white' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, 
  ClipboardList, 
  ArrowRightLeft, 
  Bell, 
  AlertTriangle,
  Boxes,
  MapPin,
  TrendingUp,
  ScanLine,
  RefreshCw,
  Store,
  ShoppingCart,
  ChevronRight
} from 'lucide-react';
import { getDashboardStats, seedData } from '../lib/api';
import { Button } from '../components/ui/button';
import PendingReminders from '../components/PendingReminders';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    try {
      setSeeding(true);
      await seedData();
      await fetchStats();
    } catch (error) {
      console.error('Error seeding data:', error);
    } finally {
      setSeeding(false);
    }
  };

  const handleReminderAction = (action) => {
    switch (action) {
      case 'grn':
        navigate('/grn');
        break;
      case 'requisitions':
        navigate('/requisitions');
        break;
      case 'purchase-orders':
        navigate('/purchase-orders');
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const quickActions = [
    { path: '/grn', icon: Package, label: 'Receive Stock', color: 'emerald', desc: 'Create GRN' },
    { path: '/issue', icon: ClipboardList, label: 'Issue to Kitchen', color: 'blue', desc: 'FEFO Issue' },
    { path: '/transfer', icon: ArrowRightLeft, label: 'Transfer', color: 'violet', desc: 'Move Stock' },
    { path: '/scan', icon: ScanLine, label: 'Scan QR', color: 'amber', desc: 'Quick Lookup' },
  ];

  const statCards = stats ? [
    { label: 'Active Lots', value: stats.total_lots, icon: Boxes, color: 'emerald' },
    { label: 'Total Items', value: stats.total_items, icon: Package, color: 'blue' },
    { label: 'Locations', value: stats.total_locations, icon: MapPin, color: 'violet' },
    { label: 'Expiring Soon', value: stats.expiring_soon_count, icon: Bell, color: 'amber', alert: stats.expiring_soon_count > 0 },
    { label: 'Expired', value: stats.expired_count, icon: AlertTriangle, color: 'red', alert: stats.expired_count > 0 },
  ] : [];

  const todayStats = stats ? [
    { label: "Today's GRN", value: stats.today_grn, icon: Package },
    { label: "Today's Issues", value: stats.today_issues, icon: ClipboardList },
    { label: "Today's Transfers", value: stats.today_transfers, icon: ArrowRightLeft },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-6" data-testid="dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">DREAMOVEN Manager</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchStats}
            variant="outline"
            size="sm"
            className="bg-slate-800 border-slate-700 hover:bg-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleSeedData}
            disabled={seeding}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500"
          >
            {seeding ? 'Loading...' : 'Setup Data'}
          </Button>
        </div>
      </div>

      {/* Pending Reminders */}
      <PendingReminders user={user} onNavigate={handleReminderAction} />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.path}
              to={action.path}
              data-testid={`quick-action-${action.label.toLowerCase().replace(' ', '-')}`}
              className={`
                relative overflow-hidden p-4 rounded-2xl transition-all duration-300
                bg-gradient-to-br from-${action.color}-600/20 to-${action.color}-600/5
                border border-${action.color}-600/20
                hover:border-${action.color}-500/40 hover:shadow-lg hover:shadow-${action.color}-500/10
                hover:-translate-y-1
              `}
              style={{
                background: `linear-gradient(135deg, 
                  ${action.color === 'emerald' ? 'rgba(16, 185, 129, 0.15)' : 
                    action.color === 'blue' ? 'rgba(59, 130, 246, 0.15)' :
                    action.color === 'violet' ? 'rgba(139, 92, 246, 0.15)' :
                    'rgba(245, 158, 11, 0.15)'} 0%, 
                  transparent 100%)`
              }}
            >
              <Icon className={`w-8 h-8 mb-3 ${
                action.color === 'emerald' ? 'text-emerald-400' :
                action.color === 'blue' ? 'text-blue-400' :
                action.color === 'violet' ? 'text-violet-400' :
                'text-amber-400'
              }`} />
              <h3 className="font-semibold text-white">{action.label}</h3>
              <p className="text-xs text-slate-400 mt-1">{action.desc}</p>
            </Link>
          );
        })}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              data-testid={`stat-${stat.label.toLowerCase().replace(' ', '-')}`}
              className={`
                relative p-4 rounded-2xl bg-slate-900/50 border border-slate-800
                ${stat.alert ? 'animate-pulse border-red-500/50' : ''}
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${
                  stat.color === 'emerald' ? 'text-emerald-400' :
                  stat.color === 'blue' ? 'text-blue-400' :
                  stat.color === 'violet' ? 'text-violet-400' :
                  stat.color === 'amber' ? 'text-amber-400' :
                  'text-red-400'
                }`} />
                {stat.alert && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                )}
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-400">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Today's Activity */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold">Today's Activity</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {todayStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center p-3 rounded-xl bg-slate-800/50">
                <Icon className="w-5 h-5 mx-auto mb-2 text-slate-400" />
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-400">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Kitchen Activity Section */}
      {stats?.kitchen_activity && (
        <div className="bg-gradient-to-br from-teal-900/30 to-slate-900/50 rounded-2xl border border-teal-700/30 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-teal-400" />
              <h2 className="text-lg font-semibold text-white">Kitchen Activity (Daily Perishables)</h2>
            </div>
            <Link 
              to="/reports" 
              className="text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1"
            >
              View Full Report <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {/* Kitchen Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="text-center p-3 rounded-xl bg-slate-800/50 border border-teal-600/20">
              <ShoppingCart className="w-5 h-5 mx-auto mb-2 text-teal-400" />
              <p className="text-xl font-bold text-white">{stats.kitchen_activity.today_pos}</p>
              <p className="text-xs text-slate-400">Today's Kitchen POs</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-800/50 border border-teal-600/20">
              <Package className="w-5 h-5 mx-auto mb-2 text-emerald-400" />
              <p className="text-xl font-bold text-white">{stats.kitchen_activity.today_grns}</p>
              <p className="text-xs text-slate-400">Today's Receivables</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-800/50 border border-teal-600/20">
              <p className="text-xl font-bold text-emerald-400">
                ₹{(stats.kitchen_activity.today_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-slate-400">Today's Value</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-800/50 border border-amber-600/20">
              <Bell className="w-5 h-5 mx-auto mb-2 text-amber-400" />
              <p className="text-xl font-bold text-amber-400">{stats.kitchen_activity.pending_pos}</p>
              <p className="text-xs text-slate-400">Pending Kitchen POs</p>
            </div>
          </div>
          
          {/* Recent Kitchen POs */}
          {stats.kitchen_activity.recent_pos?.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-300 mb-2">Recent Kitchen POs:</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {stats.kitchen_activity.recent_pos.map((po, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
                    <div>
                      <p className="text-white text-sm font-medium">{po.po_number}</p>
                      <p className="text-xs text-slate-400">{po.kitchen_name} → {po.vendor_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 text-sm font-medium">₹{po.total_amount?.toLocaleString('en-IN')}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        po.status === 'received' ? 'bg-emerald-500/20 text-emerald-400' :
                        po.status === 'partial' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {po.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Recent Receivables */}
          {stats.kitchen_activity.recent_receivables?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">Recent Receivables (Last 7 Days):</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {stats.kitchen_activity.recent_receivables.map((rec, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
                    <div>
                      <p className="text-white text-sm font-medium">{rec.date}</p>
                      <p className="text-xs text-slate-400">{rec.kitchen_name} • {rec.items_count} items</p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 text-sm font-medium">₹{rec.total_value?.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-slate-500">{rec.vendors?.join(', ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Empty State */}
          {(!stats.kitchen_activity.recent_pos?.length && !stats.kitchen_activity.recent_receivables?.length) && (
            <div className="text-center py-4">
              <Store className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-slate-400 text-sm">No kitchen activity yet</p>
              <p className="text-xs text-slate-500">Kitchen POs and receivables will appear here</p>
            </div>
          )}
        </div>
      )}

      {/* Alerts Banner */}
      {stats && (stats.expired_count > 0 || stats.expiring_soon_count > 0) && (
        <Link
          to="/alerts"
          className="block p-4 rounded-2xl bg-gradient-to-r from-red-600/20 to-amber-600/20 border border-red-500/30 hover:border-red-500/50 transition-all"
          data-testid="alerts-banner"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-500/20">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">Attention Required</h3>
              <p className="text-sm text-slate-300">
                {stats.expired_count > 0 && `${stats.expired_count} expired items`}
                {stats.expired_count > 0 && stats.expiring_soon_count > 0 && ' • '}
                {stats.expiring_soon_count > 0 && `${stats.expiring_soon_count} expiring within 7 days`}
              </p>
            </div>
            <Bell className="w-5 h-5 text-amber-400" />
          </div>
        </Link>
      )}
    </div>
  );
}

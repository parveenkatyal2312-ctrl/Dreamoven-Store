import { useState, useEffect } from 'react';
import { AlertTriangle, Bell, Clock, Package, ShoppingCart, X } from 'lucide-react';
import { Button } from './ui/button';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function PendingReminders({ user, onNavigate }) {
  const [reminders, setReminders] = useState([]);
  const [dismissed, setDismissed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchReminders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchReminders = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (!token) {
        setLoading(false);
        return;
      }
      
      let currentUser = user;
      if (!currentUser && userStr) {
        try {
          currentUser = JSON.parse(userStr);
        } catch (e) {
          console.error('Error parsing user:', e);
        }
      }
      
      const remindersList = [];
      const isKitchen = currentUser?.role === 'kitchen';
      const isMainStore = currentUser?.role === 'admin' || currentUser?.role === 'main_store';
      
      // Fetch pending alerts
      const alertsRes = await axios.get(`${API_URL}/api/pending-alerts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const alerts = alertsRes.data;

      if (isKitchen) {
        // Dispatched requisitions waiting for confirmation
        if (alerts.dispatched_requisitions_count > 0) {
          remindersList.push({
            id: 'pending-reqs',
            type: 'warning',
            icon: Package,
            title: 'Pending Requisition Confirmations',
            message: `You have ${alerts.dispatched_requisitions_count} dispatched requisition(s) to confirm receipt`,
            count: alerts.dispatched_requisitions_count,
            action: 'requisitions'
          });
        }

        // Pending POs that need GRN (kitchen created POs)
        if (alerts.pending_kitchen_grn_count > 0) {
          remindersList.push({
            id: 'pending-kitchen-grn',
            type: 'error',
            icon: ShoppingCart,
            title: 'Daily Perishables GRN Pending',
            message: `${alerts.pending_kitchen_grn_count} PO(s) awaiting GRN. Please complete receiving.`,
            count: alerts.pending_kitchen_grn_count,
            action: 'grn'
          });
        }
      }

      if (isMainStore) {
        // Urgent POs (more than 24 hours old)
        if (alerts.urgent_pos_count > 0) {
          remindersList.push({
            id: 'urgent-grn',
            type: 'error',
            icon: AlertTriangle,
            title: 'Urgent: GRN Overdue',
            message: `${alerts.urgent_pos_count} PO(s) are waiting for GRN for more than 24 hours!`,
            count: alerts.urgent_pos_count,
            action: 'grn'
          });
        }

        // Regular pending POs
        const regularPending = alerts.pending_pos_count - alerts.urgent_pos_count;
        if (regularPending > 0) {
          remindersList.push({
            id: 'pending-grn',
            type: 'warning',
            icon: Clock,
            title: 'Pending GRN',
            message: `${regularPending} PO(s) awaiting goods receipt`,
            count: regularPending,
            action: 'grn'
          });
        }

        // Pending requisitions to dispatch
        if (alerts.pending_requisitions_count > 0) {
          remindersList.push({
            id: 'pending-dispatch',
            type: 'warning',
            icon: Package,
            title: 'Requisitions to Dispatch',
            message: `${alerts.pending_requisitions_count} requisition(s) waiting to be dispatched`,
            count: alerts.pending_requisitions_count,
            action: 'requisitions'
          });
        }
      }

      // Show alerts regardless of role for debugging
      if (remindersList.length === 0 && (alerts.pending_pos_count > 0 || alerts.pending_requisitions_count > 0)) {
        if (alerts.urgent_pos_count > 0) {
          remindersList.push({
            id: 'urgent-grn',
            type: 'error',
            icon: AlertTriangle,
            title: 'Urgent: GRN Overdue',
            message: `${alerts.urgent_pos_count} PO(s) are waiting for GRN for more than 24 hours!`,
            count: alerts.urgent_pos_count,
            action: 'grn'
          });
        }
        
        const regularPending = alerts.pending_pos_count - alerts.urgent_pos_count;
        if (regularPending > 0) {
          remindersList.push({
            id: 'pending-grn',
            type: 'warning',
            icon: Clock,
            title: 'Pending GRN',
            message: `${regularPending} PO(s) awaiting goods receipt`,
            count: regularPending,
            action: 'grn'
          });
        }
        
        if (alerts.pending_requisitions_count > 0) {
          remindersList.push({
            id: 'pending-dispatch',
            type: 'warning',
            icon: Package,
            title: 'Requisitions to Dispatch',
            message: `${alerts.pending_requisitions_count} requisition(s) waiting to be dispatched`,
            count: alerts.pending_requisitions_count,
            action: 'requisitions'
          });
        }
      }

      setReminders(remindersList.filter(r => !dismissed.includes(r.id)));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      setLoading(false);
    }
  };

  const dismissReminder = (id) => {
    setDismissed([...dismissed, id]);
    setReminders(reminders.filter(r => r.id !== id));
  };

  const handleAction = (action) => {
    if (onNavigate) {
      onNavigate(action);
    }
  };

  if (loading || reminders.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {reminders.map((reminder) => (
        <div
          key={reminder.id}
          className={`p-4 rounded-xl border flex items-start gap-4 animate-pulse-slow ${
            reminder.type === 'error'
              ? 'bg-red-900/30 border-red-500/50'
              : 'bg-amber-900/30 border-amber-500/50'
          }`}
        >
          <div className={`p-2 rounded-lg ${
            reminder.type === 'error' ? 'bg-red-600/20' : 'bg-amber-600/20'
          }`}>
            <reminder.icon className={`w-6 h-6 ${
              reminder.type === 'error' ? 'text-red-400' : 'text-amber-400'
            }`} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className={`font-semibold ${
                reminder.type === 'error' ? 'text-red-300' : 'text-amber-300'
              }`}>
                {reminder.title}
              </h3>
              <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                reminder.type === 'error' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-amber-600 text-white'
              }`}>
                {reminder.count}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">{reminder.message}</p>
            
            <Button
              size="sm"
              onClick={() => handleAction(reminder.action)}
              className={`mt-3 ${
                reminder.type === 'error'
                  ? 'bg-red-600 hover:bg-red-500'
                  : 'bg-amber-600 hover:bg-amber-500'
              }`}
            >
              Take Action
            </Button>
          </div>
          
          <button
            onClick={() => dismissReminder(reminder.id)}
            className="text-slate-500 hover:text-slate-300 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

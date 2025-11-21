import React, { useEffect, useState } from 'react';
import * as api from '../api';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  async function loadNotifications() {
    setLoading(true);
    const r = await api.getNotifications();
    if (r && r.notifications) {
      setNotifications(r.notifications);
      setUnreadCount(r.notifications.filter(n => !n.read).length);
    }
    setLoading(false);
  }

  async function markAsRead(id) {
    const r = await api.markNotificationRead(id);
    if (r && r.ok) {
      await loadNotifications();
    }
  }

  async function markAllRead() {
    const r = await api.markAllNotificationsRead();
    if (r && r.ok) {
      await loadNotifications();
    }
  }

  async function deleteNotification(id) {
    const r = await api.deleteNotification(id);
    if (r && r.ok) {
      await loadNotifications();
    }
  }

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  function formatTime(iso) {
    const date = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  function getNotificationIcon(type) {
    switch (type) {
      case 'trade': return '💰';
      case 'admin': return '📢';
      case 'system': return '⚙️';
      case 'promo': return '🎁';
      default: return '📬';
    }
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Notifications</h2>
        {unreadCount > 0 && (
          <button className="btn" onClick={markAllRead}>
            Mark all as read ({unreadCount})
          </button>
        )}
      </div>

      {loading ? (
        <div className="card">
          <div className="muted" style={{ textAlign: 'center', padding: 20 }}>Loading...</div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="card">
          <div className="muted" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div>No notifications yet</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notifications.map(n => (
            <div 
              key={n.id} 
              className="card"
              style={{ 
                padding: 16,
                backgroundColor: n.read ? 'rgba(15, 23, 42, 0.6)' : 'rgba(30, 41, 59, 0.8)',
                borderLeft: n.read ? '3px solid rgba(148, 163, 184, 0.3)' : '3px solid #3b82f6',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => !n.read && markAsRead(n.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                  <div style={{ fontSize: 24 }}>
                    {getNotificationIcon(n.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: n.read ? 600 : 800,
                      marginBottom: 4,
                      color: n.read ? '#94a3b8' : '#f1f5f9'
                    }}>
                      {n.title}
                    </div>
                    <div style={{ 
                      fontSize: 14,
                      color: '#94a3b8',
                      marginBottom: 8,
                      lineHeight: 1.5
                    }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      {formatTime(n.created_at)}
                    </div>
                  </div>
                </div>
                <button 
                  className="btn ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(n.id);
                  }}
                  style={{ padding: '4px 8px', fontSize: 12 }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

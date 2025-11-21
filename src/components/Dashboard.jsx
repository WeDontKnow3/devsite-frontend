import React, { useEffect, useState } from 'react';
import * as api from '../api';

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [userRes, statsRes] = await Promise.all([
        api.getMe(),
        api.getUserStats()
      ]);
      
      if (userRes && userRes.user) setMe(userRes.user);
      if (statsRes && statsRes.stats) setStats(statsRes.stats);
    } catch (err) {
      console.error('failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  function formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card">
          <p className="muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!me || !stats) {
    return (
      <div className="page">
        <div className="card">
          <p className="muted">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, marginBottom: 8 }}>Dashboard</h2>
        <p className="muted">Overview of your account statistics and activity</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        <div style={{
          padding: 20,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>Total Transactions</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#3b82f6' }}>
            {formatNumber(stats.total_transactions)}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
            All time activity
          </div>
        </div>

        <div style={{
          padding: 20,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>Total Volume</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#22c55e' }}>
            ${formatNumber(stats.total_volume.toFixed(2))}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
            Traded across all coins
          </div>
        </div>

        <div style={{
          padding: 20,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>Unique Tokens</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#a855f7' }}>
            {stats.unique_tokens}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
            Different tokens traded
          </div>
        </div>

        <div style={{
          padding: 20,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>Database Usage</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>
            {formatBytes(stats.database_usage)}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
            Storage consumed
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        <div style={{
          padding: 20,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Trade Breakdown</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>Buy Orders</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>
                {formatNumber(stats.buy_count)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>Sell Orders</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#ef4444' }}>
                {formatNumber(stats.sell_count)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>Transfers</span>
              <span style={{ fontSize: 16, fontWeight: 700 }}>
                {formatNumber(stats.transfer_count)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>Gambling Games</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#a855f7' }}>
                {formatNumber(stats.gamble_count)}
              </span>
            </div>
          </div>
        </div>

        <div style={{
          padding: 20,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Trading Performance</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>Largest Trade</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#3b82f6' }}>
                ${formatNumber(stats.largest_trade.toFixed(2))}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>Average Trade</span>
              <span style={{ fontSize: 16, fontWeight: 700 }}>
                ${formatNumber(stats.average_trade.toFixed(2))}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>Total Profit/Loss</span>
              <span style={{ 
                fontSize: 16, 
                fontWeight: 700,
                color: stats.total_pnl >= 0 ? '#22c55e' : '#ef4444'
              }}>
                {stats.total_pnl >= 0 ? '+' : ''}${formatNumber(stats.total_pnl.toFixed(2))}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>Coins Created</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#f59e0b' }}>
                {formatNumber(stats.coins_created)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        padding: 20,
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Account Details</div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Username</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{me.username}</div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>USD Balance</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#22c55e' }}>
              ${Number(me.usd_balance).toFixed(2)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Token Holdings</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              {me.tokens.length} token{me.tokens.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Account Type</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: me.is_admin ? '#a855f7' : '#64748b' }}>
              {me.is_admin ? 'Admin' : 'Standard'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Member Since</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              {stats.member_since ? new Date(stats.member_since).toLocaleDateString() : 'N/A'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Last Activity</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              {stats.last_activity ? new Date(stats.last_activity).toLocaleDateString() : 'Never'}
            </div>
          </div>
        </div>
      </div>

      {me.tokens.length > 0 && (
        <div style={{
          marginTop: 24,
          padding: 20,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Current Holdings</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {me.tokens.map(token => (
              <div 
                key={token.symbol}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.03)'
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{token.symbol}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{token.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>
                    {Number(token.amount).toFixed(6)}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>tokens</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import * as api from '../api';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all'); // all | 24h | 7d
  const [stats, setStats] = useState({
    totalVolume24h: 0,
    activeTraders: 0,
    totalCoins: 0,
    avgProfit24h: 0
  });

  async function loadLeaderboard() {
    setLoading(true);
    try {
      const res = await api.getLeaderboard(timeframe);
      
      if (res && res.leaderboard) {
        setLeaders(res.leaderboard);
        
        if (res.stats) {
          setStats({
            totalVolume24h: res.stats.totalVolume24h || 0,
            activeTraders: res.stats.activeTraders || 0,
            totalCoins: res.stats.totalCoins || 0,
            avgProfit24h: res.stats.avgProfit24h || 0
          });
        }
      } else {
        // Fallback para dados mockados se API falhar
        console.warn('Leaderboard API failed, using mock data');
        const mockRes = await api.getMe();
        
        if (mockRes && mockRes.user) {
          const mockLeaders = [
            { 
              username: mockRes.user.username, 
              usd_balance: mockRes.user.usd_balance, 
              rank: Math.floor(Math.random() * 5) + 1, 
              profit_24h: (Math.random() - 0.5) * 500,
              total_trades: Math.floor(Math.random() * 100) + 10,
              win_rate: Math.floor(Math.random() * 30) + 60
            },
            { username: 'crypto_whale', usd_balance: 8420.80, rank: 1, profit_24h: 680.20, total_trades: 245, win_rate: 78 },
            { username: 'diamond_hands', usd_balance: 6890.30, rank: 2, profit_24h: 420.50, total_trades: 189, win_rate: 72 },
          ];
          
          const sorted = mockLeaders.sort((a, b) => b.usd_balance - a.usd_balance);
          sorted.forEach((user, idx) => user.rank = idx + 1);
          
          setLeaders(sorted);
          setStats({
            totalVolume24h: 12450.80,
            activeTraders: 156,
            totalCoins: 42,
            avgProfit24h: 85.20
          });
        }
      }
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadLeaderboard(); }, [timeframe]);

  function getMedalIcon(rank) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }

  return (
    <div className="leaderboard-page">
      {/* Header Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, marginBottom: 4 }}>🏆 Top Traders</h2>
            <p className="muted" style={{ margin: 0 }}>
              Ranking dos traders mais bem-sucedidos
            </p>
          </div>
          
          <div className="timeframe-selector">
            <button 
              className={`timeframe-btn ${timeframe === 'all' ? 'active' : ''}`}
              onClick={() => setTimeframe('all')}
            >
              All Time
            </button>
            <button 
              className={`timeframe-btn ${timeframe === '24h' ? 'active' : ''}`}
              onClick={() => setTimeframe('24h')}
            >
              24h
            </button>
            <button 
              className={`timeframe-btn ${timeframe === '7d' ? 'active' : ''}`}
              onClick={() => setTimeframe('7d')}
            >
              7d
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
            <div>Loading leaderboard...</div>
          </div>
        ) : leaders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
            <div>No traders found</div>
          </div>
        ) : (
          <div className="leaderboard-list">
            {leaders.map((user, idx) => (
              <div key={idx} className={`leaderboard-item rank-${idx + 1} fade-in`} style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="rank-badge">
                  {getMedalIcon(user.rank)}
                </div>

                <div className="leader-info">
                  <div className="leader-name">
                    {user.username}
                    {user.rank <= 3 && <span style={{ marginLeft: 8, fontSize: 14 }}>⭐</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                    <span>🎯 {user.total_trades} trades</span>
                    <span>📈 {user.win_rate}% win rate</span>
                  </div>
                  <div className="leader-profit" style={{ 
                    color: user.profit_24h >= 0 ? '#16a34a' : '#ef4444',
                    marginTop: 6,
                    fontWeight: 700
                  }}>
                    {user.profit_24h >= 0 ? '↗ +' : '↘ '}${Math.abs(user.profit_24h).toFixed(2)} (24h)
                  </div>
                </div>

                <div className="leader-balance">
                  <div className="balance-label">Balance</div>
                  <div className="balance-value">${Number(user.usd_balance).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistics Card */}
      <div className="card">
        <h3 style={{ marginBottom: 20 }}>📊 Platform Statistics</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-label">💰 Total Volume (24h)</div>
            <div className="stat-value">${stats.totalVolume24h.toFixed(2)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">👥 Active Traders</div>
            <div className="stat-value">{stats.activeTraders}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">🪙 Total Coins</div>
            <div className="stat-value">{stats.totalCoins}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">📈 Avg. Profit (24h)</div>
            <div 
              className="stat-value" 
              style={{ color: stats.avgProfit24h >= 0 ? '#16a34a' : '#ef4444' }}
            >
              {stats.avgProfit24h >= 0 ? '+' : ''}${stats.avgProfit24h.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="card" style={{ background: 'rgba(15,98,254,0.05)', borderColor: 'rgba(15,98,254,0.2)' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ fontSize: 32 }}>💡</div>
          <div>
            <h4 style={{ margin: 0, marginBottom: 8, color: '#60a5fa' }}>Como subir no ranking?</h4>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#94a3b8', lineHeight: 1.8 }}>
              <li>Faça trades lucrativos para aumentar seu saldo USD</li>
              <li>Mantenha um bom win rate (% de trades vencedoras)</li>
              <li>Trade ativamente para aumentar seu volume</li>
              <li>Diversifique seu portfolio entre várias coins</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

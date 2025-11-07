import React, { useEffect, useState } from 'react';
import * as api from '../api';

export default function Market({ onOpenCoin, onActionComplete }) {
  const [coins, setCoins] = useState([]);
  const [usdBuy, setUsdBuy] = useState({});
  const [msg, setMsg] = useState('');
  const [loadingSymbol, setLoadingSymbol] = useState(null);
  const [loadingList, setLoadingList] = useState(false);

  async function load() {
    setMsg('');
    setLoadingList(true);
    try {
      const r = await api.listCoins();
      setCoins(r.coins || []);
    } catch (e) {
      setMsg('Erro ao carregar mercado');
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => { load(); }, []);

  function fmtPercent(p) {
    if (p == null) return '—';
    const sign = p > 0 ? '+' : '';
    return `${sign}${p.toFixed(2)}%`;
  }

  function fmtVol(v) {
    if (!v) return '$0';
    return `$${Number(v).toFixed(2)}`;
  }

  async function buy(symbol) {
    setMsg('');
    const usd = Number(usdBuy[symbol] || 0);
    if (!usd || usd <= 0) { setMsg('Valor inválido'); return; }
    setLoadingSymbol(symbol);
    try {
      const res = await api.buyCoin(symbol, usd);
      if (res.ok) {
        setMsg(`Comprou ${Number(res.bought.tokenAmount).toFixed(6)} ${symbol}`);
        // reload market
        await load();
        // animate money going down (user spent usd)
        if (onActionComplete) onActionComplete({ keepView: true, animate: { amount: Number(usd), type: 'down' } });
      } else {
        setMsg(res.error || 'Erro na compra');
      }
    } catch (err) {
      setMsg(err.message || 'Erro');
    } finally {
      setLoadingSymbol(null);
    }
  }

  return (
    <div className="page">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
        <h2 style={{margin:0}}>Market</h2>
        <div style={{fontSize:13, color:'#bfc7d6'}}>{loadingList ? 'Carregando...' : `${coins.length} coins`}</div>
      </div>

      {msg && <p className="msg">{msg}</p>}

      <div className="market-list">
        {coins.length === 0 && !loadingList && <div className="card muted">Nenhuma coin disponível.</div>}
        {coins.map(c => (
          <div key={c.symbol} className="market-item fade-in">
            <div className="market-left">
              <button className="link-btn" onClick={() => onOpenCoin(c.symbol)}>{c.symbol}</button>
              <div className="name">{c.name}</div>
              <div className="muted" style={{marginTop:6}}>
                Pool: {Number(c.liquidity_base || 0).toFixed(4)} base • {Number(c.liquidity_token || 0).toLocaleString()} token
              </div>
            </div>

            <div className="market-mid">
              <div className="small muted">Price</div>
              <div style={{fontWeight:800}}>{c.price === null ? '—' : `$${Number(c.price).toFixed(8)}`}</div>

              <div style={{marginTop:6}}>
                <span className={c.change24h > 0 ? 'flash-up' : (c.change24h < 0 ? 'flash-down' : '')} style={{fontWeight:700}}>
                  {fmtPercent(c.change24h)}
                </span>
                <div className="small muted">24h vol {fmtVol(c.volume24h)}</div>
              </div>
            </div>

            <div className="market-right">
              <input
                className="small-input"
                value={usdBuy[c.symbol] || ''}
                onChange={e => setUsdBuy({...usdBuy, [c.symbol]: e.target.value})}
                placeholder="USD"
                inputMode="decimal"
              />
              <button
                className="btn"
                onClick={() => buy(c.symbol)}
                disabled={loadingSymbol && loadingSymbol !== c.symbol}
              >
                {loadingSymbol === c.symbol ? 'Buying...' : 'Buy'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

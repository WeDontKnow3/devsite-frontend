import React, { useEffect, useRef, useState } from 'react';
import * as api from '../api';
import PriceChart from './PriceChart';

export default function CoinDetail({ symbol, onBack, onActionComplete }) {
  const [coin, setCoin] = useState(null);
  const [buyUsd, setBuyUsd] = useState('');
  const [sellAmt, setSellAmt] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingCoin, setLoadingCoin] = useState(true);

  const prevPriceRef = useRef(null);
  const priceElRef = useRef(null);

  async function load() {
    setLoadingCoin(true);
    setMsg('');
    try {
      const r = await api.getCoin(symbol);
      if (r && r.coin) {
        setCoin(r.coin);
      } else {
        // API returned error or invalid payload
        console.error('getCoin error response:', r);
        setCoin(null);
        setMsg(r.error || 'Coin não encontrada / resposta inválida do servidor');
      }
    } catch (e) {
      console.error('getCoin threw:', e);
      setCoin(null);
      setMsg('Erro ao carregar coin (ver console)');
    } finally {
      setLoadingCoin(false);
    }
  }

  async function loadHistory() {
    try {
      const h = await api.getCoinHistory(symbol, 24);
      if (h && h.series) setHistory(h.series);
      else {
        console.warn('getCoinHistory returned invalid:', h);
        setHistory([]);
      }
    } catch (e) {
      console.warn('getCoinHistory error', e);
      setHistory([]);
    }
  }

  useEffect(() => { load(); loadHistory(); }, [symbol]);

  // flash price when it changes
  useEffect(() => {
    if (!coin) return;
    const prev = prevPriceRef.current;
    const curr = coin.price;
    if (prev != null && curr != null && prev !== curr) {
      const el = priceElRef.current;
      if (el) {
        el.classList.remove('flash-up', 'flash-down');
        if (curr > prev) el.classList.add('flash-up');
        else if (curr < prev) el.classList.add('flash-down');
        setTimeout(() => el.classList.remove('flash-up', 'flash-down'), 900);
      }
    }
    prevPriceRef.current = curr;
  }, [coin]);

  async function buy() {
    setMsg('');
    const usd = Number(buyUsd);
    if (!usd || usd <= 0) { setMsg('USD inválido'); return; }
    setLoading(true);
    try {
      const res = await api.buyCoin(symbol, usd);
      if (res && res.ok) {
        setMsg(`Comprou ${Number(res.bought.tokenAmount).toFixed(6)} ${symbol}`);
        await load();
        await loadHistory();
        if (onActionComplete) onActionComplete({ keepView: true, animate: { amount: Number(res.bought.usdSpent || usd), type: 'down' } });
        setBuyUsd('');
      } else {
        console.error('buyCoin error:', res);
        setMsg(res && res.error ? res.error : 'Erro na compra (ver console)');
      }
    } catch (err) {
      console.error('buyCoin threw:', err);
      setMsg('Erro na compra (ver console)');
    } finally {
      setLoading(false);
    }
  }

  async function sell() {
    setMsg('');
    const amt = Number(sellAmt);
    if (!amt || amt <= 0) { setMsg('Quantidade inválida'); return; }
    setLoading(true);
    try {
      const res = await api.sellCoin(symbol, amt);
      if (res && res.ok) {
        setMsg(`Vendeu ${Number(res.sold.tokenAmount).toFixed(6)} ${symbol}`);
        await load();
        await loadHistory();
        if (onActionComplete) onActionComplete({ keepView: true, animate: { amount: Number(res.sold.usdGained || 0), type: 'up' } });
        setSellAmt('');
      } else {
        console.error('sellCoin error:', res);
        setMsg(res && res.error ? res.error : 'Erro na venda (ver console)');
      }
    } catch (err) {
      console.error('sellCoin threw:', err);
      setMsg('Erro na venda (ver console)');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h2>Coin: {symbol}</h2>

      {loadingCoin && <div className="card">Carregando coin...</div>}

      {!loadingCoin && msg && <div className="card"><div style={{color:'#ffd2d2'}}>{msg}</div></div>}

      {!loadingCoin && coin && (
        <>
          <div className="card">
            <strong>{coin.name}</strong>
            <div className="row" style={{marginTop:8}}>
              <div>
                Price: <strong ref={priceElRef} id={`price-${symbol}`}>{coin.price === null ? '—' : `$${Number(coin.price).toFixed(8)}`}</strong>
              </div>
              <div className="muted">Pool base: {Number(coin.pool_base).toFixed(6)}</div>
              <div className="muted">Pool token: {Number(coin.pool_token).toLocaleString()}</div>
              <div style={{marginLeft:12}}>
                <div className={coin.change24h > 0 ? 'flash-up' : (coin.change24h < 0 ? 'flash-down' : '')} style={{fontWeight:700}}>
                  {coin.change24h == null ? '—' : `${coin.change24h.toFixed(2)}%`}
                </div>
                <div className="small muted">24h volume: {coin.volume24h != null ? `$${Number(coin.volume24h).toFixed(2)}` : '—'}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Price (24h)</h3>
            <PriceChart series={history} />
          </div>

          <div className="card">
            <h3>Buy (base → token)</h3>
            <input className="full" placeholder="USD" value={buyUsd} onChange={e=>setBuyUsd(e.target.value)} inputMode="decimal" />
            <button className="btn" onClick={buy} disabled={loading}>{loading ? 'Processing...' : 'Buy'}</button>
          </div>

          <div className="card">
            <h3>Sell (token → base)</h3>
            <input className="full" placeholder="Token amount" value={sellAmt} onChange={e=>setSellAmt(e.target.value)} inputMode="decimal" />
            <button className="btn" onClick={sell} disabled={loading}>{loading ? 'Processing...' : 'Sell'}</button>
          </div>

          {msg && <p className="msg">{msg}</p>}
        </>
      )}
    </div>
  );
}

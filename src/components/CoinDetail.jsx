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
  const [userBalance, setUserBalance] = useState(0);
  const [userTokenAmount, setUserTokenAmount] = useState(0);
  const [estimatedTokens, setEstimatedTokens] = useState(null);
  const [estimatedUsd, setEstimatedUsd] = useState(null);
  const [topHolders, setTopHolders] = useState([]);
  const [loadingHolders, setLoadingHolders] = useState(false);

  const prevPriceRef = useRef(null);
  const priceElRef = useRef(null);

  async function loadUserData() {
    try {
      const r = await api.getMe();
      if (r && r.user) {
        setUserBalance(Number(r.user.usd_balance || 0));
        const userToken = r.user.tokens?.find(t => t.symbol === symbol);
        setUserTokenAmount(userToken ? Number(userToken.amount || 0) : 0);
      }
    } catch (e) {
      console.error('loadUserData error', e);
    }
  }

  async function loadTopHolders() {
    setLoadingHolders(true);
    try {
      const r = await api.getCoinHolders(symbol);
      if (r && r.holders) {
        setTopHolders(r.holders);
      } else {
        setTopHolders([]);
      }
    } catch (e) {
      console.error('loadTopHolders error', e);
      setTopHolders([]);
    } finally {
      setLoadingHolders(false);
    }
  }

  async function load() {
    setLoadingCoin(true);
    setMsg('');
    try {
      const r = await api.getCoin(symbol);
      if (r && r.coin) {
        setCoin(r.coin);
      } else {
        console.error('getCoin error response:', r);
        setCoin(null);
        setMsg(r.error || 'Coin not found / invalid server response');
      }
    } catch (e) {
      console.error('getCoin threw:', e);
      setCoin(null);
      setMsg('Error loading coin (see console)');
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

  useEffect(() => { 
    load(); 
    loadHistory(); 
    loadUserData();
    loadTopHolders();
  }, [symbol]);

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

  useEffect(() => {
    if (!coin || !buyUsd || Number(buyUsd) <= 0) {
      setEstimatedTokens(null);
      return;
    }
    const usdIn = Number(buyUsd);
    const poolBase = Number(coin.pool_base || 0);
    const poolToken = Number(coin.pool_token || 0);
    if (poolBase <= 0 || poolToken <= 0) {
      setEstimatedTokens(null);
      return;
    }
    const K_FEE = 0.003;
    const FEE_MULT = 1 - K_FEE;
    const effectiveUsd = FEE_MULT * usdIn;
    const k = poolBase * poolToken;
    const newPoolBase = poolBase + effectiveUsd;
    const newPoolToken = k / newPoolBase;
    const tokensReceived = poolToken - newPoolToken;
    setEstimatedTokens(tokensReceived > 0 ? tokensReceived : 0);
  }, [buyUsd, coin]);

  useEffect(() => {
    if (!coin || !sellAmt || Number(sellAmt) <= 0) {
      setEstimatedUsd(null);
      return;
    }
    const tAmount = Number(sellAmt);
    const poolBase = Number(coin.pool_base || 0);
    const poolToken = Number(coin.pool_token || 0);
    if (poolBase <= 0 || poolToken <= 0) {
      setEstimatedUsd(null);
      return;
    }
    const K_FEE = 0.003;
    const FEE_MULT = 1 - K_FEE;
    const k = poolBase * poolToken;
    const newPoolToken = poolToken + tAmount;
    const newPoolBase = k / newPoolToken;
    const baseOutBeforeFee = poolBase - newPoolBase;
    const usdOut = FEE_MULT * baseOutBeforeFee;
    setEstimatedUsd(usdOut > 0 ? usdOut : 0);
  }, [sellAmt, coin]);

  async function buy() {
    setMsg('');
    const usd = Number(buyUsd);
    if (!usd || usd <= 0) { setMsg('Invalid USD'); return; }
    setLoading(true);
    try {
      const res = await api.buyCoin(symbol, usd);
      if (res && res.ok) {
        setMsg(`Bought ${Number(res.bought.tokenAmount).toFixed(6)} ${symbol}`);
        await load();
        await loadHistory();
        await loadUserData();
        await loadTopHolders();
        if (onActionComplete) onActionComplete({ keepView: true, animate: { amount: Number(res.bought.usdSpent || usd), type: 'down' } });
        setBuyUsd('');
        setEstimatedTokens(null);
      } else {
        console.error('buyCoin error:', res);
        setMsg(res && res.error ? res.error : 'Buy error (see console)');
      }
    } catch (err) {
      console.error('buyCoin threw:', err);
      setMsg('Buy error (see console)');
    } finally {
      setLoading(false);
    }
  }

  async function sell() {
    setMsg('');
    const amt = Number(sellAmt);
    if (!amt || amt <= 0) { setMsg('Invalid amount'); return; }
    setLoading(true);
    try {
      const res = await api.sellCoin(symbol, amt);
      if (res && res.ok) {
        setMsg(`Sold ${Number(res.sold.tokenAmount).toFixed(6)} ${symbol}`);
        await load();
        await loadHistory();
        await loadUserData();
        await loadTopHolders();
        if (onActionComplete) onActionComplete({ keepView: true, animate: { amount: Number(res.sold.usdGained || 0), type: 'up' } });
        setSellAmt('');
        setEstimatedUsd(null);
      } else {
        console.error('sellCoin error:', res);
        setMsg(res && res.error ? res.error : 'Sell error (see console)');
      }
    } catch (err) {
      console.error('sellCoin threw:', err);
      setMsg('Sell error (see console)');
    } finally {
      setLoading(false);
    }
  }

  function handleMaxBuy() {
    if (userBalance > 0) {
      setBuyUsd(userBalance.toString());
    }
  }

  function handleMaxSell() {
    if (userTokenAmount > 0) {
      setSellAmt(userTokenAmount.toString());
    }
  }

  return (
    <div className="page">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h2>Coin: {symbol}</h2>

      {loadingCoin && <div className="card">Loading coin...</div>}

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
            <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
              <input 
                className="full" 
                placeholder="USD" 
                value={buyUsd} 
                onChange={e=>setBuyUsd(e.target.value)} 
                inputMode="decimal" 
                style={{flex:1}}
              />
              <button 
                className="btn" 
                onClick={handleMaxBuy} 
                disabled={loading || userBalance <= 0}
                style={{minWidth:'60px'}}
              >
                Max
              </button>
            </div>
            {estimatedTokens !== null && (
              <div style={{marginTop:'8px', fontSize:'0.9em', color:'#aaa'}}>
                Estimated: {estimatedTokens.toFixed(6)} {symbol}
              </div>
            )}
            <button className="btn" onClick={buy} disabled={loading} style={{marginTop:'8px'}}>{loading ? 'Processing...' : 'Buy'}</button>
          </div>

          <div className="card">
            <h3>Sell (token → base)</h3>
            <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
              <input 
                className="full" 
                placeholder="Token amount" 
                value={sellAmt} 
                onChange={e=>setSellAmt(e.target.value)} 
                inputMode="decimal"
                style={{flex:1}}
              />
              <button 
                className="btn" 
                onClick={handleMaxSell} 
                disabled={loading || userTokenAmount <= 0}
                style={{minWidth:'60px'}}
              >
                Max
              </button>
            </div>
            {estimatedUsd !== null && (
              <div style={{marginTop:'8px', fontSize:'0.9em', color:'#aaa'}}>
                Estimated: ${estimatedUsd.toFixed(6)}
              </div>
            )}
            <button className="btn" onClick={sell} disabled={loading} style={{marginTop:'8px'}}>{loading ? 'Processing...' : 'Sell'}</button>
          </div>

          <div className="card">
            <h3>Top 10 Holders</h3>
            {loadingHolders && <div style={{color:'#aaa', fontSize:'0.9em'}}>Loading holders...</div>}
            {!loadingHolders && topHolders.length === 0 && <div style={{color:'#aaa', fontSize:'0.9em'}}>No holders yet</div>}
            {!loadingHolders && topHolders.length > 0 && (
              <div style={{marginTop:'12px'}}>
                {topHolders.map((holder, idx) => (
                  <div key={idx} style={{
                    display:'flex', 
                    justifyContent:'space-between', 
                    alignItems:'center',
                    padding:'8px 0',
                    borderBottom: idx < topHolders.length - 1 ? '1px solid #333' : 'none'
                  }}>
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                      <span style={{
                        color: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#888',
                        fontWeight: idx < 3 ? 'bold' : 'normal',
                        minWidth:'25px'
                      }}>
                        #{idx + 1}
                      </span>
                      <span style={{fontWeight: idx < 3 ? '600' : 'normal'}}>
                        {holder.username}
                      </span>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontWeight:'600'}}>
                        {Number(holder.amount).toLocaleString()} {symbol}
                      </div>
                      <div style={{fontSize:'0.85em', color:'#aaa'}}>
                        {holder.percentage ? `${holder.percentage.toFixed(2)}%` : '—'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {msg && <p className="msg">{msg}</p>}
        </>
      )}
    </div>
  );
}

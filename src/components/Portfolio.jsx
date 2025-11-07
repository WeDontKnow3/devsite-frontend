import React, { useEffect, useState } from 'react';
import * as api from '../api';

export default function Portfolio({ onActionComplete }) {
  const [me, setMe] = useState(null);
  const [txs, setTxs] = useState([]);
  const [sellAmounts, setSellAmounts] = useState({});
  const [msg, setMsg] = useState('');
  const [loadingSell, setLoadingSell] = useState(null);

  async function load() {
    setMsg('');
    try {
      const r = await api.getMe();
      if (r && r.user) setMe(r.user);
    } catch (e) {
      setMsg('Erro ao carregar perfil');
    }

    try {
      const tr = await api.getTransactions();
      setTxs(tr.transactions || []);
    } catch (_) {
      setTxs([]);
    }
  }

  useEffect(() => { load(); }, []);

  async function sell(symbol) {
    setMsg('');
    const amt = Number(sellAmounts[symbol] || 0);
    if (!amt || amt <= 0) { setMsg('Quantidade inválida'); return; }
    setLoadingSell(symbol);
    try {
      const res = await api.sellCoin(symbol, amt);
      if (res.ok) {
        setMsg(`Vendeu ${Number(res.sold.tokenAmount).toFixed(6)} ${symbol}`);
        await load();
        if (onActionComplete) onActionComplete({ keepView: true, animate: { amount: Number(res.sold.usdGained || 0), type: 'up' } });
        setSellAmounts(s => ({ ...s, [symbol]: '' }));
      } else {
        setMsg(res.error || 'Erro ao vender');
      }
    } catch (err) {
      setMsg(err.message || 'Erro');
    } finally {
      setLoadingSell(null);
    }
  }

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
        <h2 style={{margin:0}}>Portfolio</h2>
        <div style={{fontSize:13, color:'#bfc7d6'}}>{me ? me.username : ''}</div>
      </div>

      {msg && <p className="msg">{msg}</p>}

      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div>
            <div className="small muted">USD Balance</div>
            <div style={{fontWeight:800, fontSize:20}}>{me ? `$${Number(me.usd_balance).toFixed(2)}` : '—'}</div>
          </div>

          <div style={{textAlign:'right'}}>
            <div className="small muted">Tokens</div>
            <div style={{fontWeight:700}}>{me ? me.tokens.length : 0}</div>
          </div>
        </div>
      </div>

      <div style={{marginTop:8}}>
        <h3>Holdings</h3>
        {me && me.tokens.length === 0 && <div className="card muted">Você não tem tokens.</div>}
        {me && me.tokens.map(t => (
          <div key={t.symbol} className="card" style={{display:'flex', alignItems:'center', gap:12, justifyContent:'space-between'}}>
            <div>
              <div style={{fontWeight:800}}>{t.symbol}</div>
              <div className="muted">{t.name}</div>
              <div className="muted">Amount: {Number(t.amount).toLocaleString()}</div>
            </div>

            <div style={{display:'flex', gap:8, alignItems:'center'}}>
              <input className="small-input" placeholder="Amount" value={sellAmounts[t.symbol] || ''} onChange={e=>setSellAmounts({...sellAmounts, [t.symbol]: e.target.value})} />
              <button className="btn" onClick={()=>sell(t.symbol)} disabled={loadingSell && loadingSell !== t.symbol}>{loadingSell === t.symbol ? 'Selling...' : 'Sell'}</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{marginTop:14}}>
        <h3>Transactions</h3>
        {txs.length === 0 && <div className="card muted">Nenhuma transação ainda.</div>}
        {txs.map(tx => (
          <div key={tx.id} className="card" style={{marginBottom:8}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <div style={{fontWeight:800}}>{tx.type.toUpperCase()}</div>
                <div className="muted">{tx.symbol} • {new Date(tx.created_at).toLocaleString()}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div>{tx.usd_amount ? `$${Number(tx.usd_amount).toFixed(4)}` : ''}</div>
                <div className="muted">{tx.token_amount ? `${Number(tx.token_amount).toLocaleString()} tokens` : ''}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


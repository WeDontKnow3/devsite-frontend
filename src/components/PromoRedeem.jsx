import React, { useEffect, useState } from 'react';
import * as api from '../api';

/**
 * PromoRedeem.jsx
 * - Redeem promo codes (user)
 * - props:
 *    onActionComplete({ keepView, animate: { amount, type } })  // optional, to update balance + animate
 */
export default function PromoRedeem({ onActionComplete }) {
  const [code, setCode] = useState('');
  const [available, setAvailable] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState(null);

  async function loadAvailable() {
    try {
      const r = await api.listAvailablePromoCodes();
      setAvailable((r && r.promos) ? r.promos : []);
    } catch (e) {
      console.warn('loadAvailable error', e);
      setAvailable([]);
    }
  }

  async function loadMe() {
    try {
      const r = await api.getMe();
      if (r && r.user) setMe(r.user);
      else setMe(null);
    } catch (e) {
      setMe(null);
    }
  }

  useEffect(() => {
    loadAvailable();
    loadMe();
  }, []);

  async function redeem() {
    setMsg('');
    if (!code || code.trim() === '') {
      setMsg('Digite um código para resgatar.');
      return;
    }
    setLoading(true);
    try {
      const r = await api.redeemPromoCode(code.trim());
      if (r && r.ok) {
        const credited = Number(r.credited || 0);
        setMsg(`Sucesso! Credited $${credited.toFixed(2)} — novo saldo: $${Number(r.new_balance).toFixed(2)}`);
        setCode('');
        await loadAvailable();
        await loadMe();
        if (onActionComplete) onActionComplete({ keepView: true, animate: { amount: credited, type: 'up' } });
      } else {
        setMsg((r && r.error) ? r.error : 'Erro ao resgatar (ver console)');
        console.warn('redeemPromoCode error:', r);
      }
    } catch (err) {
      console.error('redeemPromoCode threw:', err);
      setMsg('Erro de rede ao resgatar.');
    } finally {
      setLoading(false);
    }
  }

  // quick handler to set and redeem from list
  function useAndRedeem(promoCode) {
    setCode(promoCode);
    // slight delay so input shows value then redeem (optional)
    setTimeout(() => { redeem(); }, 120);
  }

  return (
    <div className="page">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
        <h2 style={{margin:0}}>Resgatar Promo Code</h2>
        <div style={{fontSize:13, color:'#bfc7d6'}}>
          {me ? `${me.username} • Saldo: $${Number(me.usd_balance).toFixed(2)}` : 'Faça login para resgatar'}
        </div>
      </div>

      <div className="card">
        <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
          <input
            placeholder="Digite o código (ex: WELCOME100)"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            style={{flex:1}}
          />
          <button className="btn" onClick={redeem} disabled={loading || !me}>
            {loading ? 'Resgatando...' : 'Resgatar'}
          </button>
          <button className="btn ghost" onClick={() => { setCode(''); setMsg(''); loadAvailable(); }} disabled={loading}>
            Limpar / Refresh
          </button>
        </div>

        {msg && <p className="msg" style={{marginTop:10}}>{msg}</p>}

        <div style={{marginTop:14}}>
          <h4 style={{marginBottom:8}}>Códigos disponíveis</h4>
          {available.length === 0 ? (
            <div className="muted">Nenhum código público disponível no momento.</div>
          ) : (
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
              {available.map(p => (
                <div key={p.code} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.02)'}}>
                  <div>
                    <div style={{fontWeight:800}}>{p.code} — ${Number(p.amount).toFixed(2)}</div>
                    <div className="muted" style={{fontSize:13}}>
                      used {p.used_count}/{p.max_uses || '∞'} • per user {p.per_user_limit} • exp {p.expires_at || '—'}
                    </div>
                  </div>
                  <div style={{display:'flex', gap:8}}>
                    <button className="btn ghost" onClick={() => { setCode(p.code); }} disabled={!me}>Copiar</button>
                    <button className="btn" onClick={() => useAndRedeem(p.code)} disabled={!me}>Usar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{marginTop:12}} className="card">
        <h4>Como funciona</h4>
        <ul style={{margin:'8px 0 0 16px', color:'#bfc7d6'}}>
          <li>Um código pode creditar USD diretamente na sua conta.</li>
          <li>Cada código tem limites de uso e pode expirar.</li>
          <li>Se o resgate for bem-sucedido, seu saldo será atualizado automaticamente.</li>
        </ul>
      </div>
    </div>
  );
}

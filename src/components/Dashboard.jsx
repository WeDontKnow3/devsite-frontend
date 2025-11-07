import React, { useEffect, useState } from 'react';
import * as api from '../api';

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [txs, setTxs] = useState([]);

  async function load() {
    const r = await api.getMe();
    setMe(r.user);
    const t = await api.getTransactions();
    setTxs(t.transactions || []);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      {!me && <p>Carregando...</p>}
      {me && (
        <>
          <p><strong>{me.username}</strong></p>
          <p>USD balance: ${Number(me.usd_balance).toFixed(2)}</p>
          <h3>Tokens</h3>
          <ul>
            {Array.isArray(me.tokens) && me.tokens.length > 0 ? me.tokens.map(t => (
              <li key={t.symbol}>{t.symbol}: {Number(t.amount).toFixed(6)}</li>
            )) : <li>Sem tokens</li>}
          </ul>
          <h3>Transactions</h3>
          <ul>
            {txs.length === 0 && <li>Nenhuma transação</li>}
            {txs.map(tx => (
              <li key={tx.id}>{tx.created_at} — {tx.type} {Number(tx.token_amount).toFixed(6)} {tx.symbol} — ${Number(tx.usd_amount).toFixed(2)}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

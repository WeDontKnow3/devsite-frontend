import React, { useState } from 'react';
import * as api from '../api';

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login'); // login | register
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    try {
      if (mode === 'login') {
        const res = await api.login(username, password);
        if (res.token) { onLogin(res.token); setMsg('Logado'); }
        else setMsg(res.error || 'Erro');
      } else {
        const res = await api.register(username, password);
        if (res.token) { onLogin(res.token); setMsg('Registrado e logado'); }
        else setMsg(res.error || 'Erro');
      }
    } catch (e) { setMsg(e.message); }
  }

  return (
    <div className="auth card">
      <h2>{mode === 'login' ? 'Login' : 'Registrar'}</h2>
      <form onSubmit={submit}>
        <input placeholder="username" value={username} onChange={e=>setUsername(e.target.value)} required />
        <input placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button type="submit">{mode === 'login' ? 'Login' : 'Registrar'}</button>
      </form>
      <p><button onClick={()=>setMode(mode === 'login' ? 'register' : 'login')}>Switch to {mode === 'login' ? 'Register' : 'Login'}</button></p>
      {msg && <p className="msg">{msg}</p>}
    </div>
  );
}

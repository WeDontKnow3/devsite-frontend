// frontend/src/api.js
const API_BASE = import.meta.env.VITE_API_BASE || 'https://devsite-backend-production.up.railway.app';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: 'Bearer ' + token } : {};
}

async function safeJson(resp) {
  try {
    return await resp.json();
  } catch (e) {
    return { error: 'invalid_json_response', message: e.message };
  }
}

/* ---------- Auth ---------- */
export async function register(username, password, adminSecret = null) {
  try {
    const body = { username, password };
    if (adminSecret) body.adminSecret = adminSecret;
    const r = await fetch(`${API_BASE}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await safeJson(r);
  } catch (err) {
    return { error: err.message || 'network_error' };
  }
}

export async function login(username, password) {
  try {
    const r = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return await safeJson(r);
  } catch (err) {
    return { error: err.message || 'network_error' };
  }
}

/* ---------- Profile / user ---------- */
export async function getMe() {
  try {
    const r = await fetch(`${API_BASE}/api/me`, {
      headers: { ...authHeaders() }
    });
    return await safeJson(r);
  } catch (err) {
    return { error: err.message || 'network_error' };
  }
}

/* ---------- Coins / Market ---------- */
export async function listCoins() {
  try {
    const r = await fetch(`${API_BASE}/api/coins`);
    return await safeJson(r);
  } catch (err) {
    return { error: err.message || 'network_error' };
  }
}

export async function getCoin(symbol) {
  try {
    const r = await fetch(`${API_BASE}/api/coins/${encodeURIComponent(symbol)}`);
    return await safeJson(r);
  } catch (err) {
    return { error: err.message || 'network_error' };
  }
}

export async function getCoinHistory(symbol, hours = 24) {
  try {
    const r = await fetch(`${API_BASE}/api/coins/${encodeURIComponent(symbol)}/history?hours=${Number(hours)}`);
    return await safeJson(r);
  } catch (err) {
    return { error: err.message || 'network_error' };
  }
}

export async function createCoin(data) {
  // data: { symbol, name }
  try {
    const r = await fetch(`${API_BASE}/api/coins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data)
    });
    return await safeJson(r);
  } catch (err) {
    return { error: err.message || 'network_error' };
  }
}

/* ---------- Trade ---------- */
export async function buyCoin(symbol, usdAmount) {
  try {
    const r = await fetch(`${API_BASE}/api/trade/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ symbol, usdAmount })
    });
    return await safeJson(r);
  } catch (err) {
    return { error: err.message || 'network_error' };
  }
}

export async function sellCoin(symbol, tokenAmount) {
  try {
    const r = await fetch(`${API_BASE}/api/trade/sell`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ symbol, tokenAmount })
    });
    return await safeJson(r);
  } catch (err) {
    return { error: err.message || 'network_error' };
  }
}

/* ---------- Transactions ---------- */
export async function getTransactions() {
  try {
    const r = await fetch(`${API_BASE}/api/transactions`, {
      headers: { ...authHeaders() }
    });
    return await safeJson(r);
  } catch (err) {
    return { error: err.message || 'network_error' };
  }
}

/* ---------- Promo codes (public) ---------- */
export async function listAvailablePromoCodes() {
  try {
    const r = await fetch(`${API_BASE}/api/promocodes/available`);
    return await safeJson(r);
  } catch (err) {
    return { error: err.message || 'network_error' };
  }
}

export async function redeemPromoCode(code) {
  try {
    const r = await fetch(`${API_BASE}/api/promocodes/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ code })
    });
    return await safeJson(r);
  } catch (err) {
    return { error: err.message || 'network_error' };
  }
}

/* ---------- Promo codes (admin) ---------- */
export async function createPromoCode(data) {
  // data: { code, amount, maxUses, perUserLimit, expiresAt }
  try {
    const r = await fetch(`${API_BASE}/api/promocodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data)
    });
    return await safeJson(r);
  } catch (err) {
    return { error: err.message || 'network_error' };
  }
}

export async function adminListPromoCodes() {
  try {
    const r = await fetch(`${API_BASE}/api/admin/promocodes`, {
      headers: { ...authHeaders() }
    });
    return await safeJson(r);
  } catch (err) {
    return { error: err.message || 'network_error' };
  }
}

export async function adminListPromoRedemptions() {
  try {
    const r = await fetch(`${API_BASE}/api/admin/promocodes/redemptions`, {
      headers: { ...authHeaders() }
    });
    return await safeJson(r);
  } catch (err) {
    return { error: err.message || 'network_error' };
  }
}

/* ---------- Admin (requires is_admin token) ---------- */
export async function adminGetDB() {
  try {
    const r = await fetch(`${API_BASE}/api/admin/db`, { headers: { ...authHeaders() } });
    return await safeJson(r);
  } catch (err) { return { error: err.message || 'network_error' }; }
}

export async function adminReplaceDB(payload) {
  try {
    const r = await fetch(`${API_BASE}/api/admin/db`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload)
    });
    return await safeJson(r);
  } catch (err) { return { error: err.message || 'network_error' }; }
}

export async function adminListUsers() {
  try {
    const r = await fetch(`${API_BASE}/api/admin/users`, { headers: { ...authHeaders() } });
    return await safeJson(r);
  } catch (err) { return { error: err.message || 'network_error' }; }
}

export async function adminBanUser(userId, ban) {
  try {
    const r = await fetch(`${API_BASE}/api/admin/users/${userId}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ ban: !!ban })
    });
    return await safeJson(r);
  } catch (err) { return { error: err.message || 'network_error' }; }
}

export async function adminDeleteUser(userId) {
  try {
    const r = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { ...authHeaders() }
    });
    return await safeJson(r);
  } catch (err) { return { error: err.message || 'network_error' }; }
}

export async function adminListCoins() {
  try {
    const r = await fetch(`${API_BASE}/api/admin/coins`, { headers: { ...authHeaders() } });
    return await safeJson(r);
  } catch (err) { return { error: err.message || 'network_error' }; }
}

export async function adminDeleteCoin(coinId) {
  try {
    const r = await fetch(`${API_BASE}/api/admin/coins/${coinId}`, {
      method: 'DELETE',
      headers: { ...authHeaders() }
    });
    return await safeJson(r);
  } catch (err) { return { error: err.message || 'network_error' }; }
}

export async function adminUpdateCoin(coinId, patch) {
  try {
    const r = await fetch(`${API_BASE}/api/admin/coins/${coinId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(patch)
    });
    return await safeJson(r);
  } catch (err) { return { error: err.message || 'network_error' }; }
}

/* ---------- Leaderboard ---------- */
// Adicione esta função no final do arquivo api.js, antes de "/* ---------- done ---------- */"

export async function getLeaderboard(timeframe = 'all') {
  try {
    const r = await fetch(`${API_BASE}/api/leaderboard?timeframe=${timeframe}`, {
      headers: { ...authHeaders() }
    });
    return await safeJson(r);
  } catch (err) {
    return { error: err.message || 'network_error' };
  }
}

/* ---------- done ---------- */


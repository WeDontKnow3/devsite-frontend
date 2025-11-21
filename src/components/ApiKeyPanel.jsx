import React, { useState, useEffect } from 'react';
import * as api from '../api';

export default function ApiKeyPanel() {
  const [apiKeys, setApiKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [apiMsg, setApiMsg] = useState('');

  async function loadApiKeys() {
    try {
      const res = await api.listApiKeys();
      if (res && res.keys) setApiKeys(res.keys);
    } catch (err) {
      console.error('failed to load api keys', err);
    }
  }

  useEffect(() => {
    loadApiKeys();
  }, []);

  async function handleCreateApiKey(e) {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    setApiMsg('');
    try {
      const res = await api.createApiKey(newKeyName.trim());
      if (res && res.ok) {
        setApiMsg(`API Key created: ${res.key.api_key}`);
        setNewKeyName('');
        await loadApiKeys();
      } else {
        setApiMsg(res && res.error ? res.error : 'Failed to create API key');
      }
    } catch (err) {
      setApiMsg('Error creating API key');
    }
    setCreatingKey(false);
  }

  async function handleDeleteApiKey(id) {
    if (!window.confirm('Delete this API key? This cannot be undone.')) return;
    try {
      const res = await api.deleteApiKey(id);
      if (res && res.ok) {
        setApiMsg('API key deleted');
        await loadApiKeys();
      } else {
        setApiMsg(res && res.error ? res.error : 'Failed to delete key');
      }
    } catch (err) {
      setApiMsg('Error deleting API key');
    }
  }

  async function handleResetApiKey(id) {
    if (!window.confirm('Reset request counter for this API key?')) return;
    try {
      const res = await api.resetApiKeyUsage(id);
      if (res && res.ok) {
        setApiMsg('Request counter reset');
        await loadApiKeys();
      } else {
        setApiMsg(res && res.error ? res.error : 'Failed to reset');
      }
    } catch (err) {
      setApiMsg('Error resetting key');
    }
  }

  return (
    <div className="page">
      <div className="card">
        <h2>API Keys</h2>
        <p className="muted">Manage your API keys to access coin data programmatically</p>

        <form onSubmit={handleCreateApiKey} style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Key name (e.g., My Bot)"
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              style={{ 
                flex: 1,
                minWidth: 200,
                padding: '8px 12px',
                fontSize: 14
              }}
              disabled={creatingKey}
            />
            <button
              type="submit"
              className="btn"
              disabled={creatingKey || !newKeyName.trim()}
            >
              {creatingKey ? 'Creating...' : 'Create API Key'}
            </button>
          </div>
        </form>

        {apiMsg && (
          <div 
            className="msg" 
            style={{ 
              marginTop: 12, 
              color: apiMsg.includes('created') ? '#86efac' : '#fda4af',
              wordBreak: 'break-all'
            }}
          >
            {apiMsg}
          </div>
        )}

        <div style={{ 
          marginTop: 24,
          padding: 16,
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: 8,
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>API Documentation</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>
            <strong>Endpoint:</strong> <code style={{ color: '#bfc7d6', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4 }}>GET /api/v1/coin/:symbol</code>
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>
            <strong>Header:</strong> <code style={{ color: '#bfc7d6', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4 }}>X-API-Key: your_key</code>
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>
            <strong>Rate Limit:</strong> 2,000 requests per month (resets automatically)
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <h3>Your API Keys ({apiKeys.length}/5)</h3>
          
          {apiKeys.length === 0 && (
            <div style={{ 
              marginTop: 16,
              padding: 32,
              textAlign: 'center',
              color: '#94a3b8',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 8
            }}>
              No API keys yet. Create one to get started.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {apiKeys.map(key => (
              <div 
                key={key.id}
                style={{
                  padding: 16,
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{key.name}</div>
                    <div style={{ 
                      color: '#94a3b8', 
                      fontFamily: 'monospace',
                      fontSize: 13,
                      wordBreak: 'break-all',
                      background: 'rgba(0,0,0,0.3)',
                      padding: '6px 8px',
                      borderRadius: 4,
                      marginTop: 8
                    }}>
                      {key.api_key}
                    </div>
                  </div>
                  <span style={{ 
                    fontSize: 12,
                    padding: '4px 12px',
                    background: key.active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: key.active ? '#86efac' : '#fda4af',
                    borderRadius: 4,
                    fontWeight: 600
                  }}>
                    {key.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '12px 0',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  marginBottom: 12
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Usage</div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>
                      {key.requests_used.toLocaleString()} / {key.requests_limit.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Remaining</div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: '#86efac' }}>
                      {(key.requests_limit - key.requests_used).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Usage</div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>
                      {((key.requests_used / key.requests_limit) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleResetApiKey(key.id)}
                    className="btn"
                    style={{ flex: 1, minWidth: 100 }}
                  >
                    Reset Counter
                  </button>
                  <button
                    onClick={() => handleDeleteApiKey(key.id)}
                    className="btn ghost"
                    style={{ flex: 1, minWidth: 100 }}
                  >
                    Delete Key
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

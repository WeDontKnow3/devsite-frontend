import React, { useEffect, useState } from 'react';
import * as api from '../api';

export default function Hopium({ onActionComplete }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [voting, setVoting] = useState({});
  const [newQuestion, setNewQuestion] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  async function loadQuestions() {
    setLoading(true);
    try {
      const res = await api.listHopiumQuestions();
      if (res.questions) {
        setQuestions(res.questions);
      }
    } catch (err) {
      console.error('Failed to load hopium questions', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuestions();
    const interval = setInterval(loadQuestions, 15000);
    return () => clearInterval(interval);
  }, []);

  async function handleAnalyze() {
    if (!newQuestion.trim() || analyzing) return;
    setAnalyzing(true);
    setAiAnalysis(null);
    try {
      const res = await api.analyzeHopiumQuestion(newQuestion);
      if (res.analysis) {
        setAiAnalysis(res.analysis);
      } else if (res.error) {
        alert('Analysis failed: ' + res.error);
      }
    } catch (err) {
      console.error('Analysis error', err);
      alert('Failed to analyze question');
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleCreate() {
    if (!newQuestion.trim() || !aiAnalysis || creating) return;
    
    const confirm = window.confirm('Creating a Hopium question costs $100,000. Continue?');
    if (!confirm) return;

    setCreating(true);
    try {
      const res = await api.createHopiumQuestion({
        question: newQuestion,
        ai_analysis: aiAnalysis
      });
      if (res.ok) {
        alert('Hopium question created!');
        setNewQuestion('');
        setAiAnalysis(null);
        await loadQuestions();
        if (onActionComplete) {
          onActionComplete({ animate: { amount: 100000, type: 'down' } });
        }
      } else if (res.error) {
        alert('Error: ' + res.error);
      }
    } catch (err) {
      console.error('Create error', err);
      alert('Failed to create question');
    } finally {
      setCreating(false);
    }
  }

  async function handleVote(questionId, vote, betAmount) {
    if (voting[questionId]) return;
    
    const amount = parseFloat(betAmount);
    if (!amount || amount < 1 || amount > 1000000) {
      alert('Bet must be between $1 and $1,000,000');
      return;
    }

    setVoting(v => ({ ...v, [questionId]: true }));
    try {
      const res = await api.voteHopiumQuestion(questionId, vote, amount);
      if (res.ok) {
        alert(`Voted ${vote.toUpperCase()} with $${amount.toLocaleString()}!`);
        await loadQuestions();
        if (onActionComplete) {
          onActionComplete({ animate: { amount, type: 'down' } });
        }
      } else if (res.error) {
        alert('Error: ' + res.error);
      }
    } catch (err) {
      console.error('Vote error', err);
      alert('Failed to vote');
    } finally {
      setVoting(v => ({ ...v, [questionId]: false }));
    }
  }

  function formatTimeRemaining(expiresAt) {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  }

  function calculateMultiplier(totalYes, totalNo, userVote) {
    const total = totalYes + totalNo;
    if (total === 0) return 1;
    
    if (userVote === 'yes') {
      const yesPercent = (totalYes / total) * 100;
      return Math.max(1, 100 / yesPercent);
    } else {
      const noPercent = (totalNo / total) * 100;
      return Math.max(1, 100 / noPercent);
    }
  }

  if (loading) {
    return (
      <div className="card fade-in" style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="muted" style={{ fontSize: '1.2rem' }}>Loading Hopium questions...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div className="card fade-in" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        marginBottom: '2rem'
      }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem' }}>🔮 Create Hopium Question</h2>
        <p style={{ opacity: 0.9, marginBottom: '1.5rem' }}>
          Cost: <strong>$100,000</strong> | Min Bet: $1 | Max Bet: $1,000,000
        </p>
        
        <textarea
          style={{
            width: '100%',
            padding: '1rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '1rem',
            marginBottom: '1rem',
            resize: 'vertical',
            color: '#000',
            fontFamily: 'inherit'
          }}
          placeholder="e.g., Will BTC coin reach $0.1 within 7 days?"
          value={newQuestion}
          onChange={e => setNewQuestion(e.target.value)}
          maxLength={500}
          rows={3}
        />

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            className="btn"
            style={{ 
              background: 'white',
              color: '#667eea',
              border: 'none'
            }}
            onClick={handleAnalyze}
            disabled={!newQuestion.trim() || analyzing}
          >
            {analyzing ? '🔄 Analyzing...' : '🤖 Analyze with AI'}
          </button>
          
          {aiAnalysis && (
            <button
              className="btn"
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none'
              }}
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? 'Creating...' : '✨ Create Question ($100k)'}
            </button>
          )}
        </div>

        {aiAnalysis && (
          <div style={{
            marginTop: '1.5rem',
            background: 'rgba(255,255,255,0.1)',
            padding: '1.5rem',
            borderRadius: '8px'
          }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>🤖 AI Analysis</h3>
            <div style={{
              display: 'flex',
              height: '60px',
              borderRadius: '8px',
              overflow: 'hidden',
              fontWeight: 600,
              marginBottom: '1rem'
            }}>
              <div style={{
                background: '#10b981',
                width: `${aiAnalysis.yes_chance}%`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'width 0.3s'
              }}>
                YES {aiAnalysis.yes_chance}%
              </div>
              <div style={{
                background: '#ef4444',
                width: `${100 - aiAnalysis.yes_chance}%`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'width 0.3s'
              }}>
                NO {100 - aiAnalysis.yes_chance}%
              </div>
            </div>
            <p style={{ lineHeight: 1.6, opacity: 0.95, margin: 0 }}>{aiAnalysis.reasoning}</p>
          </div>
        )}
      </div>

      <div className="card fade-in">
        <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.8rem' }}>📊 Active Questions</h2>
        
        {questions.length === 0 && (
          <div className="muted" style={{ textAlign: 'center', padding: '3rem' }}>
            No active Hopium questions yet. Be the first to create one!
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {questions.map(q => {
            const totalYes = parseFloat(q.total_yes || 0);
            const totalNo = parseFloat(q.total_no || 0);
            const totalPool = totalYes + totalNo;
            const yesPercent = totalPool > 0 ? (totalYes / totalPool) * 100 : 0;
            const noPercent = totalPool > 0 ? (totalNo / totalPool) * 100 : 0;
            const isExpired = new Date(q.expires_at) <= new Date();
            const userVoted = q.user_vote;

            return (
              <div key={q.id} className="market-item" style={{ 
                opacity: isExpired ? 0.6 : 1,
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  gap: '1rem'
                }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', flex: 1 }}>{q.question}</h3>
                  <span className="muted" style={{ whiteSpace: 'nowrap' }}>
                    {isExpired ? '⏰ Expired' : `⏱️ ${formatTimeRemaining(q.expires_at)}`}
                  </span>
                </div>

                <div style={{
                  background: 'var(--glass)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)'
                }}>
                  <div className="muted" style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600,
                    marginBottom: '0.5rem'
                  }}>
                    🤖 AI Prediction:
                  </div>
                  <div style={{
                    background: 'rgba(148, 163, 184, 0.1)',
                    height: '24px',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: 'linear-gradient(90deg, #10b981, #059669)',
                      height: '100%',
                      width: `${q.ai_yes_chance}%`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'white',
                      transition: 'width 0.3s'
                    }}>
                      {q.ai_yes_chance}%
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{
                    display: 'flex',
                    height: '40px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{
                      background: '#10b981',
                      width: `${yesPercent}%`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      transition: 'width 0.3s'
                    }}>
                      YES {yesPercent.toFixed(1)}%
                    </div>
                    <div style={{
                      background: '#ef4444',
                      width: `${noPercent}%`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      transition: 'width 0.3s'
                    }}>
                      NO {noPercent.toFixed(1)}%
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem',
                    marginBottom: '1rem'
                  }}>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>
                      ${totalYes.toLocaleString()}
                    </span>
                    <span style={{ fontWeight: 600 }}>
                      Pool: ${totalPool.toLocaleString()}
                    </span>
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>
                      ${totalNo.toLocaleString()}
                    </span>
                  </div>

                  {!isExpired && !userVoted && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="number"
                        className="small-input"
                        placeholder="Bet amount"
                        min="1"
                        max="1000000"
                        id={`bet-${q.id}`}
                        style={{ flex: 1, minWidth: '120px' }}
                      />
                      <button
                        className="btn"
                        style={{ background: '#10b981', color: 'white', border: 'none' }}
                        onClick={() => {
                          const input = document.getElementById(`bet-${q.id}`);
                          handleVote(q.id, 'yes', input.value);
                        }}
                        disabled={voting[q.id]}
                      >
                        Vote YES
                      </button>
                      <button
                        className="btn"
                        style={{ background: '#ef4444', color: 'white', border: 'none' }}
                        onClick={() => {
                          const input = document.getElementById(`bet-${q.id}`);
                          handleVote(q.id, 'no', input.value);
                        }}
                        disabled={voting[q.id]}
                      >
                        Vote NO
                      </button>
                    </div>
                  )}

                  {userVoted && (
                    <div style={{
                      background: 'var(--glass)',
                      padding: '1rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border)'
                    }}>
                      <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>
                        Your vote: <strong>{userVoted.vote.toUpperCase()}</strong>
                        {' '}with <strong>${parseFloat(userVoted.amount).toLocaleString()}</strong>
                      </p>
                      <p style={{ 
                        margin: '0.5rem 0', 
                        fontSize: '0.9rem',
                        color: '#10b981',
                        fontWeight: 600
                      }}>
                        Potential multiplier: <strong>{calculateMultiplier(totalYes, totalNo, userVoted.vote).toFixed(2)}x</strong>
                      </p>
                    </div>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border)',
                  fontSize: '0.85rem'
                }}>
                  <span className="muted">Created by {q.creator_username}</span>
                  <span className="muted">{q.vote_count} participants</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

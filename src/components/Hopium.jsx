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
    
    const confirm = window.confirm(
      `Creating a Hopium question costs $100,000. Continue?`
    );
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
    return <div className="hopium-loading">Loading Hopium questions...</div>;
  }

  return (
    <div className="hopium-container">
      <div className="hopium-create-section">
        <h2>🔮 Create Hopium Question</h2>
        <p className="hopium-create-info">
          Cost: <strong>$100,000</strong> | Min Bet: $1 | Max Bet: $1,000,000
        </p>
        
        <textarea
          className="hopium-question-input"
          placeholder="e.g., Will BTC coin reach $0.1 within 7 days?"
          value={newQuestion}
          onChange={e => setNewQuestion(e.target.value)}
          maxLength={500}
          rows={3}
        />

        <div className="hopium-create-actions">
          <button
            className="btn-analyze"
            onClick={handleAnalyze}
            disabled={!newQuestion.trim() || analyzing}
          >
            {analyzing ? '🔄 Analyzing...' : '🤖 Analyze with AI'}
          </button>
          
          {aiAnalysis && (
            <button
              className="btn-create-hopium"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? 'Creating...' : '✨ Create Question ($100k)'}
            </button>
          )}
        </div>

        {aiAnalysis && (
          <div className="ai-analysis-result">
            <h3>🤖 AI Analysis</h3>
            <div className="analysis-chart">
              <div className="chart-bar">
                <div 
                  className="chart-yes" 
                  style={{ width: `${aiAnalysis.yes_chance}%` }}
                >
                  <span>YES {aiAnalysis.yes_chance}%</span>
                </div>
                <div 
                  className="chart-no" 
                  style={{ width: `${100 - aiAnalysis.yes_chance}%` }}
                >
                  <span>NO {100 - aiAnalysis.yes_chance}%</span>
                </div>
              </div>
            </div>
            <p className="analysis-reasoning">{aiAnalysis.reasoning}</p>
          </div>
        )}
      </div>

      <div className="hopium-questions-section">
        <h2>📊 Active Questions</h2>
        
        {questions.length === 0 && (
          <div className="no-questions">
            No active Hopium questions yet. Be the first to create one!
          </div>
        )}

        <div className="hopium-questions-grid">
          {questions.map(q => {
            const totalYes = parseFloat(q.total_yes || 0);
            const totalNo = parseFloat(q.total_no || 0);
            const totalPool = totalYes + totalNo;
            const yesPercent = totalPool > 0 ? (totalYes / totalPool) * 100 : 0;
            const noPercent = totalPool > 0 ? (totalNo / totalPool) * 100 : 0;
            const isExpired = new Date(q.expires_at) <= new Date();
            const userVoted = q.user_vote;

            return (
              <div key={q.id} className={`hopium-question-card ${isExpired ? 'expired' : ''}`}>
                <div className="question-header">
                  <h3>{q.question}</h3>
                  <span className="question-time">
                    {isExpired ? '⏰ Expired' : `⏱️ ${formatTimeRemaining(q.expires_at)}`}
                  </span>
                </div>

                <div className="question-ai-prediction">
                  <span className="ai-label">🤖 AI Prediction:</span>
                  <div className="ai-mini-chart">
                    <div 
                      className="ai-yes-bar" 
                      style={{ width: `${q.ai_yes_chance}%` }}
                    >
                      {q.ai_yes_chance}%
                    </div>
                  </div>
                </div>

                <div className="question-voting">
                  <div className="vote-stats">
                    <div className="vote-bar">
                      <div 
                        className="vote-yes" 
                        style={{ width: `${yesPercent}%` }}
                      >
                        YES {yesPercent.toFixed(1)}%
                      </div>
                      <div 
                        className="vote-no" 
                        style={{ width: `${noPercent}%` }}
                      >
                        NO {noPercent.toFixed(1)}%
                      </div>
                    </div>
                    <div className="vote-amounts">
                      <span className="yes-amount">${totalYes.toLocaleString()}</span>
                      <span className="total-pool">Pool: ${totalPool.toLocaleString()}</span>
                      <span className="no-amount">${totalNo.toLocaleString()}</span>
                    </div>
                  </div>

                  {!isExpired && !userVoted && (
                    <div className="vote-actions">
                      <input
                        type="number"
                        className="bet-input"
                        placeholder="Bet amount"
                        min="1"
                        max="1000000"
                        id={`bet-${q.id}`}
                      />
                      <button
                        className="btn-vote-yes"
                        onClick={() => {
                          const input = document.getElementById(`bet-${q.id}`);
                          handleVote(q.id, 'yes', input.value);
                        }}
                        disabled={voting[q.id]}
                      >
                        Vote YES
                      </button>
                      <button
                        className="btn-vote-no"
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
                    <div className="user-vote-info">
                      <p>
                        Your vote: <strong>{userVoted.vote.toUpperCase()}</strong> 
                        {' '}with <strong>${parseFloat(userVoted.amount).toLocaleString()}</strong>
                      </p>
                      <p className="potential-multiplier">
                        Potential multiplier: <strong>{calculateMultiplier(totalYes, totalNo, userVoted.vote).toFixed(2)}x</strong>
                      </p>
                    </div>
                  )}
                </div>

                <div className="question-footer">
                  <span className="created-by">Created by {q.creator_username}</span>
                  <span className="participants">{q.vote_count} participants</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

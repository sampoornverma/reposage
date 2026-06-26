import React, { useState } from 'react';
import { Database, Loader2, Code, CheckCircle } from 'lucide-react';

export default function RepoConnector({ onRepoIndexed }) {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('idle'); // idle, indexing, complete, error
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) return;

    setStatus('indexing');
    setProgress(10);
    setErrorMsg('');

    try {
      const res = await fetch('http://localhost:3001/api/index', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ githubUrl: url })
      });

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }

      // Start polling
      pollStatus(data.jobId);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  const pollStatus = async (jobId) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/index/status/${jobId}`);
        const data = await res.json();
        
        if (data.data.state === 'completed') {
          clearInterval(interval);
          setProgress(100);
          setStatus('complete');
          // The backend returns the repo ID in the job result!
          const repoId = data.data.result?.repositoryId;
          setTimeout(() => onRepoIndexed(url, repoId), 1000);
        } else if (data.data.state === 'failed') {
          clearInterval(interval);
          setStatus('error');
          setErrorMsg('Indexing failed.');
        } else {
          // Fake progress for visual effect (backend polling in a real scenario)
          setProgress((p) => Math.min(p + 10, 90));
        }
      } catch (e) {
        console.error(e);
      }
    }, 2000);
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '500px', margin: '100px auto', padding: '40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', marginBottom: '16px' }}>
          <Database size={48} color="var(--accent-blue)" />
        </div>
        <h1>Connect Repository</h1>
        <p>Enter a public GitHub URL to map its architecture into the vector database.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ position: 'relative' }}>
          <Code size={20} color="var(--text-muted)" style={{ position: 'absolute', top: '14px', left: '16px' }} />
          <input
            type="url"
            className="glass-input"
            style={{ paddingLeft: '48px' }}
            placeholder="https://github.com/user/repo"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={status === 'indexing' || status === 'complete'}
            required
          />
        </div>

        {status === 'idle' && (
          <button type="submit" className="glass-button">
            Initialize Vector Store
          </button>
        )}

        {status === 'indexing' && (
          <div style={{ textAlign: 'center' }}>
            <Loader2 className="animate-pulse" size={24} color="var(--accent-blue)" style={{ animation: 'spin 2s linear infinite' }} />
            <p style={{ margin: '10px 0' }}>Chunking AST and calculating embeddings...</p>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-blue)', transition: 'width 0.5s ease' }} />
            </div>
          </div>
        )}

        {status === 'complete' && (
          <div style={{ textAlign: 'center', color: '#10b981' }} className="animate-fade-in">
            <CheckCircle size={32} style={{ marginBottom: '10px' }} />
            <p style={{ margin: 0, fontWeight: 600 }}>Vector space generated!</p>
          </div>
        )}

        {status === 'error' && (
          <div style={{ textAlign: 'center', color: 'var(--accent-red)' }} className="animate-fade-in">
            <p>{errorMsg}</p>
            <button type="button" onClick={() => setStatus('idle')} className="glass-button danger" style={{ marginTop: '10px' }}>
              Try Again
            </button>
          </div>
        )}
      </form>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

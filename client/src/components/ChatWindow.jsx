import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import MessageBubble from './MessageBubble';

export default function ChatWindow({ repositoryId, githubUrl, session }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e, forceStrict = false, retryQuestion = null) => {
    if (e) e.preventDefault();
    
    const questionToAsk = retryQuestion || input;
    if (!questionToAsk.trim() || isGenerating) return;

    if (!forceStrict) {
      setMessages(prev => [...prev, { role: 'user', content: questionToAsk }]);
      setInput('');
    }
    
    setIsGenerating(true);

    // Add empty AI message that we will stream into
    setMessages(prev => [...prev, { role: 'ai', content: '', isStreaming: !forceStrict }]);

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ 
          question: questionToAsk, 
          repositoryId,
          strictValidation: forceStrict
        })
      });

      if (forceStrict) {
        // --- STRICT MODE (JSON Response) ---
        const data = await response.json();
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1] = { role: 'ai', content: data.data.text, isStreaming: false };
          return newMsgs;
        });
        setIsGenerating(false);
        return;
      }

      // --- STANDARD MODE (SSE STREAMING) ---
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkString = decoder.decode(value, { stream: true });
        const lines = chunkString.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(dataStr);
              
              // Handle Hallucination Warning Event
              if (parsed.type === 'hallucination_warning') {
                setMessages(prev => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1].hallucinationWarning = parsed.invalidFiles;
                  return newMsgs;
                });
                continue;
              }

              // Normal text streaming
              if (parsed.text) {
                setMessages(prev => {
                  const newMsgs = [...prev];
                  // Deep copy the last message object to avoid mutating state directly!
                  // (React StrictMode runs this twice, causing double text if mutated in place)
                  const lastMsg = { ...newMsgs[newMsgs.length - 1] };
                  lastMsg.content += parsed.text;
                  newMsgs[newMsgs.length - 1] = lastMsg;
                  return newMsgs;
                });
              }
            } catch (err) {
              console.error('SSE Parse error', err);
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1].content = '⚠️ Connection error. Please try again.';
        return newMsgs;
      });
    } finally {
      setIsGenerating(false);
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1].isStreaming = false;
        return newMsgs;
      });
    }
  };

  const handleRebuildSafely = (questionIndex) => {
    // Find the user's question that caused the hallucination
    // It's always the message right before the AI's response
    const userMessage = messages[questionIndex - 1];
    if (userMessage && userMessage.role === 'user') {
      handleSubmit(null, true, userMessage.content);
    }
  };

  const isChatEmpty = messages.length === 0;

  const renderInputForm = () => (
    <form onSubmit={handleSubmit} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        className="glass-input"
        placeholder="Ask a question about the codebase..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isGenerating}
        style={{ paddingRight: '60px', padding: '20px 28px', borderRadius: '100px', width: '100%', boxSizing: 'border-box', fontSize: '1.1rem' }}
      />
      <button 
        type="submit" 
        disabled={isGenerating || !input.trim()}
        style={{
          position: 'absolute',
          right: '8px',
          top: '8px',
          bottom: '8px',
          width: '50px',
          borderRadius: '50%',
          background: input.trim() && !isGenerating ? 'var(--accent-blue)' : 'rgba(255,255,255,0.1)',
          border: 'none',
          color: 'white',
          cursor: input.trim() && !isGenerating ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease'
        }}
      >
        {isGenerating && (!messages.length || !messages[messages.length - 1]?.isStreaming) ? (
          <Loader2 size={24} className="animate-pulse" style={{ animation: 'spin 2s linear infinite' }} />
        ) : (
          <Send size={24} style={{ marginLeft: '-2px' }} />
        )}
      </button>
    </form>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: '1000px', margin: '0 auto', padding: '20px', boxSizing: 'border-box' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--accent-blue)' }}>RepoSage</h2>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{githubUrl}</div>
      </div>

      {isChatEmpty ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', color: 'var(--text-primary)', marginBottom: '16px', fontWeight: 'bold' }}>How can I help?</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '48px', fontSize: '1.2rem', maxWidth: '600px', lineHeight: '1.5' }}>
            I have mapped the vector space for your repository. Ask me anything about the architecture, security, or implementation details.
          </p>

          <div style={{ width: '100%', maxWidth: '750px' }}>
            {renderInputForm()}
          </div>
          
          <div style={{ display: 'flex', gap: '16px', marginTop: '32px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '800px' }}>
            {['Explain the architecture', 'Where is the database connected?', 'Find security vulnerabilities', 'How does the auth work?'].map(chip => (
               <div 
                 key={chip} 
                 onClick={() => setInput(chip)} 
                 style={{ 
                   padding: '16px 24px', 
                   background: 'var(--bg-secondary)', 
                   border: '1px solid var(--border-color)', 
                   borderRadius: '12px', 
                   cursor: 'pointer', 
                   color: 'var(--text-secondary)', 
                   fontSize: '0.95rem', 
                   transition: 'all 0.2s ease',
                   flex: '1 1 200px'
                 }} 
                 onMouseOver={(e) => {
                   e.currentTarget.style.borderColor = 'var(--accent-blue)';
                   e.currentTarget.style.color = 'var(--text-primary)';
                 }} 
                 onMouseOut={(e) => {
                   e.currentTarget.style.borderColor = 'var(--border-color)';
                   e.currentTarget.style.color = 'var(--text-secondary)';
                 }}
               >
                 {chip}
               </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Chat History */}
          <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', padding: '24px', marginBottom: '20px', display: 'flex', flexDirection: 'column' }}>
            {messages.map((msg, idx) => (
              <MessageBubble 
                key={idx} 
                message={msg} 
                onRebuildSafely={() => handleRebuildSafely(idx)}
              />
            ))}
            {isGenerating && messages[messages.length - 1].isStreaming && (
              <div className="animate-pulse" style={{ display: 'inline-block', width: '8px', height: '16px', background: 'var(--accent-blue)', marginLeft: '60px' }} />
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          {renderInputForm()}
        </>
      )}
    </div>
  );
}

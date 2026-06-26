import React from 'react';
import { User, Bot, AlertTriangle } from 'lucide-react';

export default function MessageBubble({ message, onRebuildSafely }) {
  const isAI = message.role === 'ai';

  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      padding: '20px',
      borderRadius: '16px',
      background: isAI ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
      border: isAI ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
      marginBottom: '16px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: isAI ? 'rgba(59, 130, 246, 0.2)' : 'rgba(139, 92, 246, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {isAI ? <Bot size={20} color="var(--accent-blue)" /> : <User size={20} color="#8b5cf6" />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, marginBottom: '8px', color: isAI ? 'var(--accent-blue)' : '#8b5cf6' }}>
          {isAI ? 'RepoSage' : 'You'}
        </div>
        
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', wordBreak: 'break-word' }}>
          {message.content}
        </div>

        {/* Hallucination Warning UI */}
        {message.hallucinationWarning && (
          <div className="animate-fade-in" style={{
            marginTop: '16px',
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-red)' }}>
              <AlertTriangle size={18} />
              <span style={{ fontSize: '14px' }}>
                <strong>Safety Warning:</strong> The AI hallucinated these files: {message.hallucinationWarning.join(', ')}
              </span>
            </div>
            
            <button 
              onClick={onRebuildSafely}
              className="glass-button danger" 
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Rebuild Safely
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

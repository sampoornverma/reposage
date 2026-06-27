import React from 'react';
import { supabase } from '../supabaseClient';
import './AuthPage.css'; // Reuse the auth card styling

const WaitlistPage = ({ onSignOut }) => {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    if (onSignOut) onSignOut();
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '500px' }}>
        <h1>Access Pending</h1>
        <p className="subtitle">You are on the waitlist</p>
        
        <div style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
          <p>Thank you for signing up for RepoSage!</p>
          <p style={{ marginTop: '1rem' }}>
            To prevent API abuse, access is currently restricted. 
            An administrator must manually approve your account.
          </p>
          <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>
            You will receive an email once you are approved.
          </p>
        </div>

        <button onClick={handleSignOut} className="auth-submit" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default WaitlistPage;

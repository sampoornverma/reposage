import React from 'react';
import { ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function PendingApproval() {
  const { signOut, user } = useAuth();

  return (
    <div className="landing-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', padding: '40px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', marginBottom: '24px' }}>
          <ShieldAlert size={48} color="var(--accent-red)" />
        </div>
        
        <h2 style={{ fontSize: '28px', marginBottom: '16px', color: 'white' }}>Account Pending Approval</h2>
        
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6', marginBottom: '32px' }}>
          Welcome, <strong>{user?.email}</strong>! You have successfully created an account and have been placed on the waitlist. 
          An administrator must approve your account before you can access the RepoSage platform.
        </p>

        <button 
          onClick={signOut}
          className="glass-button" 
          style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

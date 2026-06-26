import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Users, CheckCircle, Shield, XCircle, LogOut } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function AdminPanel() {
  const { signOut } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const toggleApproval = async (userId, currentStatus) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_approved: !currentStatus })
      .eq('id', userId);

    if (error) {
      alert('Error updating user status.');
      console.error(error);
    } else {
      fetchUsers();
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Shield size={32} color="var(--accent-blue)" />
          <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
        </div>
        <button className="glass-button" onClick={signOut} style={{ padding: '10px 20px' }}>
          <LogOut size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Sign Out
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading users...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <tr>
                <th style={{ padding: '20px', fontWeight: 600 }}>User Email</th>
                <th style={{ padding: '20px', fontWeight: 600 }}>Role</th>
                <th style={{ padding: '20px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '20px' }}>{u.email}</td>
                  <td style={{ padding: '20px' }}>
                    {u.is_admin ? (
                      <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>Admin</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>User</span>
                    )}
                  </td>
                  <td style={{ padding: '20px' }}>
                    {u.is_approved ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
                        <CheckCircle size={16} /> Approved
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24' }}>
                        <XCircle size={16} /> Pending
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '20px', textAlign: 'right' }}>
                    {!u.is_admin && (
                      <button 
                        onClick={() => toggleApproval(u.id, u.is_approved)}
                        className="btn-primary"
                        style={{ 
                          padding: '8px 16px', 
                          fontSize: '14px', 
                          background: u.is_approved ? 'rgba(255,255,255,0.1)' : 'var(--accent-blue)',
                          boxShadow: 'none'
                        }}
                      >
                        {u.is_approved ? 'Revoke Access' : 'Approve User'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

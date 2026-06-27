import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Check, X, Shield, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    // Fetch all profiles. Due to RLS, this works because the policy allows public select, 
    // but in a production app you might restrict select to admins only.
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
    } else {
      setUsers(data || []);
    }
    setIsLoading(false);
  };

  const approveUser = async (userId) => {
    // Attempt to update the user to approved.
    // The PostgreSQL RLS Policy 'Admins can update profiles' enforces that ONLY
    // an admin can successfully run this query. If a non-admin tries it via JS console,
    // the database returns an error/fails silently.
    const { error } = await supabase
      .from('profiles')
      .update({ is_approved: true })
      .eq('id', userId);

    if (error) {
      alert("Failed to approve user. Are you sure you have admin rights?");
      console.error(error);
    } else {
      // Update local state to show instantly
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_approved: true } : u));
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        Loading users...
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <Shield size={32} color="var(--accent-blue)" />
        <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Admin Dashboard</h2>
      </div>

      <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '16px', fontWeight: '500' }}>Email Address</th>
              <th style={{ padding: '16px', fontWeight: '500' }}>Joined Date</th>
              <th style={{ padding: '16px', fontWeight: '500' }}>Status</th>
              <th style={{ padding: '16px', fontWeight: '500', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No users found.
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px', color: 'var(--text-primary)' }}>
                    {user.email}
                    {user.is_admin && <span style={{ marginLeft: '8px', fontSize: '10px', background: 'var(--accent-blue)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>ADMIN</span>}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px' }}>
                    {user.is_approved ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 12px', borderRadius: '100px', fontSize: '14px' }}>
                        <Check size={14} /> Approved
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 12px', borderRadius: '100px', fontSize: '14px' }}>
                        <Clock size={14} /> Pending
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    {!user.is_approved && !user.is_admin && (
                      <button 
                        onClick={() => approveUser(user.id)}
                        className="btn-primary" 
                        style={{ padding: '6px 16px', fontSize: '14px' }}
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

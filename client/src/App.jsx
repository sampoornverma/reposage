import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import RepoConnector from './components/RepoConnector';
import ChatWindow from './components/ChatWindow';
import AuthPage from './components/AuthPage';
import WaitlistPage from './components/WaitlistPage';
import AdminDashboard from './components/AdminDashboard';
import { supabase } from './supabaseClient';

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isStarted, setIsStarted] = useState(false);
  const [activeRepo, setActiveRepo] = useState(null);
  const [isAdminView, setIsAdminView] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setIsLoadingAuth(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setIsLoadingAuth(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    setIsLoadingAuth(true);
    // Add a slight delay to allow the Supabase trigger to create the profile row
    await new Promise(r => setTimeout(r, 500));
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) setProfile(data);
    else console.error("Error fetching profile:", error);
    
    setIsLoadingAuth(false);
  };

  const handleRepoIndexed = async (githubUrl, repoId) => {
    if (repoId) {
      setActiveRepo({ url: githubUrl, id: repoId });
    } else {
      console.error("No repoId was returned from the backend.");
    }
  };

  if (isLoadingAuth) {
    return <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}><h2>Loading Auth...</h2></div>;
  }

  if (!isStarted) {
    return <LandingPage onStart={() => setIsStarted(true)} onSignOut={async () => await supabase.auth.signOut()} />;
  }

  if (!session) {
    return <AuthPage />;
  }

  if (profile && profile.is_approved === false) {
    return <WaitlistPage onSignOut={() => setIsStarted(false)} />;
  }

  return (
    <div className="app-container">
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 100, display: 'flex', gap: '12px' }}>
         {profile?.is_admin && (
           <button 
             onClick={() => setIsAdminView(!isAdminView)} 
             style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '8px', cursor: 'pointer'}}
           >
             {isAdminView ? 'Return to Chat' : 'Admin Dashboard'}
           </button>
         )}
         <button onClick={() => supabase.auth.signOut()} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer'}}>Sign Out</button>
      </div>
      
      {isAdminView ? (
        <AdminDashboard />
      ) : !activeRepo ? (
        <RepoConnector onRepoIndexed={handleRepoIndexed} session={session} />
      ) : (
        <ChatWindow repositoryId={activeRepo.id} githubUrl={activeRepo.url} session={session} />
      )}
    </div>
  );
}

export default App;

import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import RepoConnector from './components/RepoConnector';
import ChatWindow from './components/ChatWindow';

function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [activeRepo, setActiveRepo] = useState(null);

  const handleRepoIndexed = async (githubUrl, repoId) => {
    if (repoId) {
      setActiveRepo({ url: githubUrl, id: repoId });
    } else {
      console.error("No repoId was returned from the backend.");
    }
  };

  if (!isStarted) {
    return <LandingPage onStart={() => setIsStarted(true)} />;
  }

  return (
    <div className="app-container">
      {!activeRepo ? (
        <RepoConnector onRepoIndexed={handleRepoIndexed} />
      ) : (
        <ChatWindow repositoryId={activeRepo.id} githubUrl={activeRepo.url} />
      )}
    </div>
  );
}

export default App;

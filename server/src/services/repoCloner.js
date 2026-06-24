const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * Clones a GitHub repository to a temporary local directory.
 * 
 * @param {string} githubUrl - The full GitHub URL (e.g., "https://github.com/facebook/react")
 * @param {string} branch - The branch to clone (default: repo's default branch)
 * @returns {object} - { localPath, repoName } where localPath is the cloned folder path
 */
async function cloneRepository(githubUrl, branch = null) {

  // Step 1: Extract the repo name from the URL
  // "https://github.com/facebook/react" → "react"
  // "https://github.com/facebook/react.git" → "react"
  const repoName = githubUrl
    .split('/')          // ["https:", "", "github.com", "facebook", "react"]
    .pop()               // "react" (last element)
    .replace('.git', ''); // Remove .git suffix if present

  // Step 2: Create a unique temporary folder
  // os.tmpdir() returns the OS temp directory (e.g., /var/folders/... on Mac)
  // We add a timestamp to avoid folder name collisions if same repo is cloned twice
  const timestamp = Date.now();
  const cloneDir = path.join(os.tmpdir(), 'reposage', `${repoName}-${timestamp}`);

  // Step 3: Ensure the parent directory exists
  // { recursive: true } means "create all missing parent folders too"
  fs.mkdirSync(path.join(os.tmpdir(), 'reposage'), { recursive: true });

  console.log(`[CLONER] Cloning ${githubUrl} (branch: ${branch || 'default'}) into ${cloneDir}...`);

  // Step 4: Initialize simple-git and perform the clone
  const git = simpleGit();

  // Build clone options dynamically
  // If no branch is specified, we skip --branch and git clones the repo's default branch automatically
  const cloneOptions = ['--depth', '1', '--single-branch'];
  if (branch) {
    cloneOptions.push('--branch', branch);
  }

  try {
    await git.clone(githubUrl, cloneDir, cloneOptions);

    console.log(`[CLONER] ✅ Successfully cloned ${repoName} to ${cloneDir}`);

    return {
      localPath: cloneDir,
      repoName: repoName
    };

  } catch (error) {
    // Clean up the folder if clone failed (don't leave empty directories)
    if (fs.existsSync(cloneDir)) {
      fs.rmSync(cloneDir, { recursive: true, force: true });
    }

    throw new Error(`Failed to clone repository: ${error.message}`);
  }
}

/**
 * Deletes a cloned repository from local storage after indexing is complete.
 * 
 * @param {string} localPath - The path to the cloned repository
 */
function cleanupClone(localPath) {
  if (fs.existsSync(localPath)) {
    fs.rmSync(localPath, { recursive: true, force: true });
    console.log(`[CLONER] 🗑️  Cleaned up ${localPath}`);
  }
}

module.exports = { cloneRepository, cleanupClone };

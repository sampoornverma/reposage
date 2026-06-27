const { supabase } = require('../config/supabase');

/**
 * Background Sweeper Worker
 * This script is designed to be run periodically (e.g., via a cron job or Heroku Scheduler).
 * It finds repositories that are older than 7 days and deletes them.
 * 
 * Because the `chunks` table has a Foreign Key to `repositories.id` with `ON DELETE CASCADE`,
 * deleting the repository automatically deletes all 10,000+ chunks associated with it!
 */
async function runCleanup() {
  console.log("🧹 [CLEANUP] Starting TTL sweep for old repositories...");

  try {
    // Calculate the date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 1);
    const cutoffTimestamp = sevenDaysAgo.toISOString();

    // Find and delete old repositories (in a real app, you might also check `is_starred = false`)
    // Supabase will return the deleted rows if we add `.select()`
    const { data: deletedRepos, error } = await supabase
      .from('repositories')
      .delete()
      .lt('created_at', cutoffTimestamp)
      .select('id, repo_name');

    if (error) {
      throw error;
    }

    if (deletedRepos && deletedRepos.length > 0) {
      console.log(`✅ [CLEANUP] Deleted ${deletedRepos.length} old repositories and all their associated chunks.`);
      deletedRepos.forEach(repo => console.log(`   - Removed: ${repo.repo_name}`));
    } else {
      console.log("✅ [CLEANUP] No old repositories found to delete.");
    }

  } catch (error) {
    console.error("❌ [CLEANUP] Error during cleanup:", error.message);
  }
}

// If run directly via `node src/jobs/cleanupWorker.js`
if (require.main === module) {
  runCleanup().then(() => process.exit(0));
}

module.exports = runCleanup;

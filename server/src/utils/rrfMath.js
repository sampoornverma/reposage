/**
 * Reciprocal Rank Fusion (RRF) Math Utility
 * 
 * While the actual RRF merging happens via the PostgreSQL `match_chunks` RPC,
 * this utility exists for testing, benchmarking, and demonstrating the RRF 
 * logic for senior engineering interviews.
 * 
 * Formula: Score = 1 / (k + rank)
 * k is a smoothing constant, typically 60.
 */

function calculateRrfScore(rank, k = 60) {
  if (rank <= 0) return 0;
  return 1 / (k + rank);
}

/**
 * Fuses two lists of ranked items.
 * @param {Array} vectorRankings - Array of { id, rank } from semantic search
 * @param {Array} keywordRankings - Array of { id, rank } from BM25 search
 * @param {number} k - The smoothing constant
 * @returns {Array} - Array of { id, rrf_score } sorted descending
 */
function fuseRankings(vectorRankings, keywordRankings, k = 60) {
  const scores = {};

  for (const item of vectorRankings) {
    if (!scores[item.id]) scores[item.id] = 0;
    scores[item.id] += calculateRrfScore(item.rank, k);
  }

  for (const item of keywordRankings) {
    if (!scores[item.id]) scores[item.id] = 0;
    scores[item.id] += calculateRrfScore(item.rank, k);
  }

  const fused = Object.keys(scores).map(id => ({
    id,
    rrf_score: scores[id]
  }));

  // Sort descending (highest RRF score first)
  return fused.sort((a, b) => b.rrf_score - a.rrf_score);
}

module.exports = {
  calculateRrfScore,
  fuseRankings
};

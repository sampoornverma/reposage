-- Supabase pgvector + Full-Text Search Hybrid Retrieval (Reciprocal Rank Fusion)
-- You MUST run this SQL in your Supabase Dashboard -> SQL Editor to replace the old function

-- 🎤 INTERVIEW POINT: "How does your Hybrid Retrieval work?"
-- Answer: "I built a Reciprocal Rank Fusion (RRF) algorithm inside Postgres. 
-- It simultaneously runs a Vector Cosine Distance search and a Full-Text Keyword Search (tsvector).
-- It calculates the rank of the code chunks in both searches, merges them using the RRF formula:
-- (1 / (60 + vector_rank)) + (1 / (60 + keyword_rank)), and returns the absolute best match."

CREATE OR REPLACE FUNCTION match_chunks (
  query_embedding vector(1536), -- Vector from OpenAI
  query_text text,              -- Raw string question from the user
  match_count int,              -- Limit (e.g., 5)
  repo_id uuid                  -- specific repo
)
RETURNS TABLE (
  id uuid,
  repository_id uuid,
  file_path text,
  content text,
  start_line int,
  end_line int,
  rrf_score float              -- Merged score
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH vector_search AS (
    SELECT 
      chunks.id, 
      rank() OVER (ORDER BY chunks.embedding <=> query_embedding) as vector_rank
    FROM chunks
    WHERE chunks.repository_id = repo_id
  ),
  keyword_search AS (
    SELECT 
      chunks.id, 
      rank() OVER (ORDER BY ts_rank_cd(to_tsvector('english', chunks.content), websearch_to_tsquery('english', query_text)) DESC) as keyword_rank
    FROM chunks
    WHERE chunks.repository_id = repo_id 
      AND to_tsvector('english', chunks.content) @@ websearch_to_tsquery('english', query_text)
  )
  SELECT
    chunks.id,
    chunks.repository_id,
    chunks.file_path,
    chunks.content,
    chunks.start_line,
    chunks.end_line,
    (COALESCE(1.0 / (60 + vector_search.vector_rank), 0.0) +
     COALESCE(1.0 / (60 + keyword_search.keyword_rank), 0.0))::float as rrf_score
  FROM chunks
  JOIN vector_search ON chunks.id = vector_search.id
  LEFT JOIN keyword_search ON chunks.id = keyword_search.id
  WHERE chunks.repository_id = repo_id
  ORDER BY rrf_score DESC
  LIMIT match_count;
END;
$$;

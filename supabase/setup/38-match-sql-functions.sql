-- =====================================================
-- Match SQL Functions
-- =====================================================
-- Purpose: Database functions for match generation
-- Created: 2026-03-18
-- Task: 1.2.3 (TASKS.md)
-- =====================================================

-- =====================================================
-- Find Similar Users using pgvector
-- =====================================================
CREATE OR REPLACE FUNCTION find_similar_users(
  query_embedding vector(384),
  match_limit integer DEFAULT 50,
  exclude_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  headline text,
  avatar_url text,
  location text,
  similarity_score real,
  profile_completion integer,
  is_online boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.display_name,
    p.headline,
    p.avatar_url,
    p.location,
    (1 - (pe.embedding <-> query_embedding)) as similarity_score,
    p.profile_completion,
    (p.last_active > now() - interval '5 minutes') as is_online
  FROM profiles p
  INNER JOIN profile_embeddings pe ON p.id = pe.user_id
  WHERE p.id != COALESCE(exclude_user_id, p.id)
    AND p.onboarding_completed = true
    AND p.id NOT IN (
      -- Exclude already connected users
      SELECT receiver_id FROM connections 
      WHERE requester_id = exclude_user_id AND status = 'accepted'
      UNION
      SELECT requester_id FROM connections 
      WHERE receiver_id = exclude_user_id AND status = 'accepted'
    )
    AND p.id NOT IN (
      -- Exclude pending connection requests
      SELECT receiver_id FROM connections 
      WHERE requester_id = exclude_user_id AND status = 'pending'
      UNION
      SELECT requester_id FROM connections 
      WHERE receiver_id = exclude_user_id AND status = 'pending'
    )
    AND p.id NOT IN (
      -- Exclude recent match suggestions (< 30 days)
      SELECT matched_user_id FROM match_suggestions
      WHERE user_id = exclude_user_id 
      AND created_at > now() - interval '30 days'
    )
  ORDER BY pe.embedding <-> query_embedding
  LIMIT match_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Get User Skills
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_skills(p_user_id uuid)
RETURNS TABLE (
  skill_id uuid,
  name text,
  category text,
  proficiency_level text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.id as skill_id,
    s.name,
    s.category,
    us.proficiency_level
  FROM user_skills us
  INNER JOIN skills s ON us.skill_id = s.id
  WHERE us.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Get User Interests
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_interests(p_user_id uuid)
RETURNS TABLE (
  interest_id uuid,
  name text,
  category text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ui.id as interest_id,
    i.name,
    i.category
  FROM user_interests ui
  INNER JOIN interests i ON ui.interest_id = i.id
  WHERE ui.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Calculate Skills Overlap
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_skills_overlap(
  user1_id uuid,
  user2_id uuid
)
RETURNS TABLE (
  overlap_ratio real,
  user1_skills text[],
  user2_skills text[],
  shared_skills text[],
  complementary_skills text[]
) AS $$
DECLARE
  user1_skill_ids uuid[];
  user2_skill_ids uuid[];
  shared_skill_ids uuid[];
  all_skill_ids uuid[];
BEGIN
  -- Get skill IDs for both users
  SELECT ARRAY_AGG(skill_id) INTO user1_skill_ids
  FROM user_skills WHERE user_id = user1_id;
  
  SELECT ARRAY_AGG(skill_id) INTO user2_skill_ids
  FROM user_skills WHERE user_id = user2_id;
  
  -- Handle null cases
  IF user1_skill_ids IS NULL OR user2_skill_ids IS NULL THEN
    overlap_ratio := 0;
    user1_skills := ARRAY[]::text[];
    user2_skills := ARRAY[]::text[];
    shared_skills := ARRAY[]::text[];
    complementary_skills := ARRAY[]::text[];
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Calculate intersection (shared skills)
  SELECT ARRAY(
    SELECT UNNEST(user1_skill_ids)
    INTERSECT
    SELECT UNNEST(user2_skill_ids)
  ) INTO shared_skill_ids;
  
  -- Calculate union (all skills)
  SELECT ARRAY(
    SELECT UNNEST(user1_skill_ids)
    UNION
    SELECT UNNEST(user2_skill_ids)
  ) INTO all_skill_ids;
  
  -- Calculate Jaccard similarity
  IF array_length(all_skill_ids, 1) > 0 THEN
    overlap_ratio := array_length(shared_skill_ids, 1)::real / array_length(all_skill_ids, 1)::real;
  ELSE
    overlap_ratio := 0;
  END IF;
  
  -- Get skill names
  SELECT ARRAY_AGG(s.name) INTO user1_skills
  FROM skills s WHERE s.id = ANY(user1_skill_ids);
  
  SELECT ARRAY_AGG(s.name) INTO user2_skills
  FROM skills s WHERE s.id = ANY(user2_skill_ids);
  
  SELECT ARRAY_AGG(s.name) INTO shared_skills
  FROM skills s WHERE s.id = ANY(shared_skill_ids);
  
  -- Complementary skills (skills one has but other doesn't)
  SELECT ARRAY_AGG(s.name) INTO complementary_skills
  FROM skills s 
  WHERE s.id = ANY(
    ARRAY(
      SELECT UNNEST(user1_skill_ids)
      EXCEPT
      SELECT UNNEST(user2_skill_ids)
    )
    UNION
    ARRAY(
      SELECT UNNEST(user2_skill_ids)
      EXCEPT
      SELECT UNNEST(user1_skill_ids)
    )
  );
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Calculate Shared Interests
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_shared_interests(
  user1_id uuid,
  user2_id uuid
)
RETURNS TABLE (
  shared_count integer,
  user1_interest_count integer,
  user2_interest_count integer,
  shared_interests text[],
  shared_categories text[]
) AS $$
DECLARE
  user1_interest_ids uuid[];
  user2_interest_ids uuid[];
  shared_interest_ids uuid[];
BEGIN
  -- Get interest IDs
  SELECT ARRAY_AGG(interest_id) INTO user1_interest_ids
  FROM user_interests WHERE user_id = user1_id;
  
  SELECT ARRAY_AGG(interest_id) INTO user2_interest_ids
  FROM user_interests WHERE user_id = user2_id;
  
  -- Handle null cases
  IF user1_interest_ids IS NULL OR user2_interest_ids IS NULL THEN
    shared_count := 0;
    user1_interest_count := 0;
    user2_interest_count := 0;
    shared_interests := ARRAY[]::text[];
    shared_categories := ARRAY[]::text[];
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Calculate intersection
  SELECT ARRAY(
    SELECT UNNEST(user1_interest_ids)
    INTERSECT
    SELECT UNNEST(user2_interest_ids)
  ) INTO shared_interest_ids;
  
  -- Get counts
  shared_count := COALESCE(array_length(shared_interest_ids, 1), 0);
  user1_interest_count := COALESCE(array_length(user1_interest_ids, 1), 0);
  user2_interest_count := COALESCE(array_length(user2_interest_ids, 1), 0);
  
  -- Get interest names
  SELECT ARRAY_AGG(i.name) INTO shared_interests
  FROM interests i WHERE i.id = ANY(shared_interest_ids);
  
  -- Get unique categories
  SELECT ARRAY_AGG(DISTINCT i.category) INTO shared_categories
  FROM interests i WHERE i.id = ANY(shared_interest_ids);
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION find_similar_users TO service_role;
GRANT EXECUTE ON FUNCTION get_user_skills TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_interests TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_skills_overlap TO service_role;
GRANT EXECUTE ON FUNCTION calculate_shared_interests TO service_role;

-- Comments
COMMENT ON FUNCTION find_similar_users IS 'Find users with similar embeddings using pgvector cosine distance';
COMMENT ON FUNCTION get_user_skills IS 'Get all skills for a user with proficiency levels';
COMMENT ON FUNCTION get_user_interests IS 'Get all interests for a user';
COMMENT ON FUNCTION calculate_skills_overlap IS 'Calculate Jaccard similarity of skills between two users';
COMMENT ON FUNCTION calculate_shared_interests IS 'Calculate shared interests between two users';

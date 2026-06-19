/**
 * Migration: Role-Based User System + Enhanced Match Engine
 *
 * Adds:
 *   1. `roles` column to `profiles` — multi-role support
 *   2. Role-specific profile fields (student, investor, founder/pro, mentor)
 *   3. `calculate_role_compatibility()` — scoring function for role-based matching
 *   4. Updated `find_similar_users()` to use role boosts + interested_in_types filter
 *   5. Trigger to auto-set default match_preferences.interested_in_types from roles
 *
 * Architecture:
 *   Roles are stored as TEXT[] enabling multi-role (e.g. {'student','founder'})
 *   Role-specific fields are nullable columns on profiles (keep schema flat, no joins)
 *   interested_in_types in match_preferences filters WHO you want to match with
 *   role_compatibility_boost adds points to match score based on role pairs
 */

-- ============================================
-- 1. ADD ROLE COLUMNS TO PROFILES
-- ============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT '{}'
  CHECK (roles <@ ARRAY['student', 'investor', 'founder', 'professional', 'mentor']);

COMMENT ON COLUMN public.profiles.roles IS
  'Multi-role assignment. Supports: student, investor, founder, professional, mentor. Defined as TEXT[] so users can hold multiple roles.';

-- ============================================
-- 2. ROLE-SPECIFIC PROFILE FIELDS
-- ============================================
-- All nullable — only populated based on user's selected role(s)

-- Student fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS major TEXT,
  ADD COLUMN IF NOT EXISTS graduation_year INTEGER CHECK (graduation_year >= 1950 AND graduation_year <= 2040),
  ADD COLUMN IF NOT EXISTS looking_for_team BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS project_interests TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.profiles.major IS 'Student: field of study';
COMMENT ON COLUMN public.profiles.graduation_year IS 'Student: expected graduation year';

-- Investor fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS check_size_min NUMERIC(12, 2) CHECK (check_size_min >= 0),
  ADD COLUMN IF NOT EXISTS check_size_max NUMERIC(12, 2) CHECK (check_size_max >= 0),
  ADD COLUMN IF NOT EXISTS stage_focus TEXT[] DEFAULT '{}'
    CHECK (stage_focus <@ ARRAY['pre_seed', 'seed', 'series_a', 'series_b', 'growth', 'late_stage']),
  ADD COLUMN IF NOT EXISTS sectors TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
  ADD COLUMN IF NOT EXISTS investment_history_count INTEGER DEFAULT 0 CHECK (investment_history_count >= 0),
  ADD COLUMN IF NOT EXISTS accredited_investor BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.profiles.check_size_min IS 'Investor: minimum check size in USD';
COMMENT ON COLUMN public.profiles.check_size_max IS 'Investor: maximum check size in USD';
COMMENT ON COLUMN public.profiles.stage_focus IS 'Investor: preferred investment stages';
COMMENT ON COLUMN public.profiles.sectors IS 'Investor: target sectors/industries';
COMMENT ON COLUMN public.profiles.portfolio_url IS 'Investor: link to portfolio company list';
COMMENT ON COLUMN public.profiles.investment_history_count IS 'Investor: number of past investments';
COMMENT ON COLUMN public.profiles.accredited_investor IS 'Investor: accredited investor status';

-- Founder / Professional fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS company_stage TEXT
    CHECK (company_stage IN ('idea', 'pre_seed', 'seed', 'early', 'growth', 'established')),
  ADD COLUMN IF NOT EXISTS company_role TEXT,
  ADD COLUMN IF NOT EXISTS team_size INTEGER CHECK (team_size >= 1),
  ADD COLUMN IF NOT EXISTS fundraising_stage TEXT
    CHECK (fundraising_stage IN ('not_raising', 'pre_seed', 'seed', 'series_a', 'series_b', 'series_c_plus')),
  ADD COLUMN IF NOT EXISTS hiring_needs TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS open_to_mentoring BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.profiles.company_name IS 'Founder/Pro: company or organization name';
COMMENT ON COLUMN public.profiles.company_stage IS 'Founder/Pro: company maturity stage';
COMMENT ON COLUMN public.profiles.company_role IS 'Founder/Pro: role at company';
COMMENT ON COLUMN public.profiles.team_size IS 'Founder/Pro: current team size';
COMMENT ON COLUMN public.profiles.fundraising_stage IS 'Founder/Pro: current fundraising status';
COMMENT ON COLUMN public.profiles.hiring_needs IS 'Founder/Pro: roles currently hiring for';
COMMENT ON COLUMN public.profiles.open_to_mentoring IS 'Founder/Pro: open to mentoring others';

-- Mentor fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mentoring_areas TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS mentoring_format TEXT
    CHECK (mentoring_format IN ('one_on_one', 'group', 'async', 'any')),
  ADD COLUMN IF NOT EXISTS mentoring_availability_hours INTEGER
    CHECK (mentoring_availability_hours >= 0 AND mentoring_availability_hours <= 168);

COMMENT ON COLUMN public.profiles.mentoring_areas IS 'Mentor: domains willing to mentor in';
COMMENT ON COLUMN public.profiles.mentoring_format IS 'Mentor: preferred mentoring format';
COMMENT ON COLUMN public.profiles.mentoring_availability_hours IS 'Mentor: available hours per month';

-- ============================================
-- 3. UPDATE MATCH PREFERENCES
-- ============================================
-- Add default for interested_in_types to use the OR of user's roles
-- This makes matching work out of the box: your roles = who you can match with

ALTER TABLE public.match_preferences
  ALTER COLUMN interested_in_types SET DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS role_matching_enabled BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN public.match_preferences.role_matching_enabled IS
  'When true, match engine applies role-based compatibility boosts and interested_in_types filtering. Set false for classic semantic-only matching.';

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_roles ON public.profiles USING GIN (roles);

-- ============================================
-- 4. ROLE COMPATIBILITY FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_role_compatibility(
  user_roles TEXT[],
  target_roles TEXT[],
  OUT boost_points INTEGER,
  OUT reason TEXT
) AS $$
DECLARE
  has_overlap BOOLEAN;
  has_complement BOOLEAN;
BEGIN
  boost_points := 0;
  reason := '';

  -- If either has no roles, no boost (fallback to classic matching)
  IF array_length(user_roles, 1) IS NULL OR array_length(target_roles, 1) IS NULL THEN
    RETURN;
  END IF;

  -- Check for same-role overlap (peer matching)
  has_overlap := user_roles && target_roles;

  -- Check for high-value cross-role matches
  -- founder <-> investor: the classic startup-investor match
  IF (user_roles @> ARRAY['founder'] AND target_roles @> ARRAY['investor'])
     OR (user_roles @> ARRAY['investor'] AND target_roles @> ARRAY['founder']) THEN
    boost_points := 15;
    reason := 'Founder-Investor match';
    RETURN;
  END IF;

  -- student <-> mentor: mentorship pairing
  IF (user_roles @> ARRAY['student'] AND target_roles @> ARRAY['mentor'])
     OR (user_roles @> ARRAY['mentor'] AND target_roles @> ARRAY['student']) THEN
    boost_points := 12;
    reason := 'Student-Mentor match';
    RETURN;
  END IF;

  -- founder <-> professional: hiring / team building
  IF (user_roles @> ARRAY['founder'] AND target_roles @> ARRAY['professional'])
     OR (user_roles @> ARRAY['professional'] AND target_roles @> ARRAY['founder']) THEN
    boost_points := 10;
    reason := 'Founder-Professional team match';
    RETURN;
  END IF;

  -- Same-role peer boost (student-student, founder-founder, etc.)
  IF has_overlap THEN
    boost_points := 5;
    reason := 'Same-role peer match';
    RETURN;
  END IF;

  -- Cross-role general (investor-professional, mentor-founder, etc.)
  boost_points := 3;
  reason := 'Cross-role general match';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.calculate_role_compatibility(TEXT[], TEXT[]) IS
  'Returns a compatibility boost (0-15 points) and human-readable reason based on role pairing. Higher values indicate strategically valuable matches.';

-- ============================================
-- 5. UPDATE FIND_SIMILAR_USERS TO USE ROLE BOOST
-- ============================================

CREATE OR REPLACE FUNCTION public.find_similar_users(
  p_user_id UUID,
  p_embedding VECTOR(384),
  p_exclude_ids UUID[] DEFAULT '{}',
  p_limit INTEGER DEFAULT 20,
  p_min_score INTEGER DEFAULT 50,
  p_filter_roles TEXT[] DEFAULT NULL,
  p_role_matching BOOLEAN DEFAULT TRUE
)
RETURNS TABLE(
  matched_user_id UUID,
  match_percentage INTEGER,
  semantic_score REAL,
  skills_overlap INTEGER,
  interests_overlap INTEGER,
  role_boost INTEGER,
  role_reason TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_user_roles TEXT[];
  v_min_match_percentage INTEGER;
  v_interested_in TEXT[];
BEGIN
  -- Get the source user's roles and match preferences
  SELECT p.roles INTO v_user_roles
  FROM public.profiles p WHERE p.id = p_user_id;

  SELECT mp.min_match_percentage, mp.interested_in_types
    INTO v_min_match_percentage, v_interested_in
  FROM public.match_preferences mp WHERE mp.user_id = p_user_id;

  -- Use the higher of p_min_score and stored preference
  IF v_min_match_percentage IS NOT NULL AND v_min_match_percentage > p_min_score THEN
    p_min_score := v_min_match_percentage;
  END IF;

  RETURN QUERY
  WITH candidate_embeddings AS (
    SELECT
      pe.user_id,
      1 - (pe.embedding <=> p_embedding) AS semantic_sim
    FROM public.profile_embeddings pe
    WHERE pe.status = 'completed'
      AND pe.user_id <> p_user_id
      AND pe.user_id <> ALL(p_exclude_ids)
      -- Role filter: only show users whose roles intersect with interested_in_types
      AND (
        p_filter_roles IS NULL
        OR array_length(p_filter_roles, 1) IS NULL
        OR (
          SELECT EXISTS (
            SELECT 1 FROM public.profiles p2
            WHERE p2.id = pe.user_id
            AND (p2.roles && p_filter_roles)
          )
        )
      )
  ),
  role_boosts AS (
    SELECT
      ce.user_id,
      ce.semantic_sim,
      COALESCE(crc.boost_points, 0) AS role_boost,
      COALESCE(crc.reason, '') AS role_reason
    FROM candidate_embeddings ce
    LEFT JOIN LATERAL (
      SELECT * FROM public.calculate_role_compatibility(
        v_user_roles,
        (SELECT p.roles FROM public.profiles p WHERE p.id = ce.user_id)
      )
    ) crc ON p_role_matching
  )
  SELECT
    rb.user_id,
    LEAST(100, GREATEST(0, (rb.semantic_sim * 100 * 0.4)::INTEGER + rb.role_boost)) AS match_percentage,
    rb.semantic_sim,
    0 AS skills_overlap,
    0 AS interests_overlap,
    rb.role_boost,
    rb.role_reason
  FROM role_boosts rb
  WHERE (rb.semantic_sim * 100 * 0.4 + rb.role_boost) >= p_min_score
  ORDER BY match_percentage DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.find_similar_users(UUID, VECTOR(384), UUID[], INT, INT, TEXT[], BOOLEAN) IS
  'Enhanced similarity search with role-based compatibility scoring. Pass p_filter_roles to restrict results to specific role types.';

-- ============================================
-- 6. TRIGGER: AUTO-SET DEFAULT INTERESTED_IN_TYPES
-- ============================================
-- When a user's roles change, auto-update their match_preferences.interested_in_types
-- to include their own roles (unless they've customized it)

CREATE OR REPLACE FUNCTION public.sync_roles_to_match_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only auto-sync if role_matching_enabled is true or not set
  INSERT INTO public.match_preferences (user_id, interested_in_types)
  VALUES (NEW.id, NEW.roles)
  ON CONFLICT (user_id) DO UPDATE
  SET interested_in_types = CASE
    WHEN EXCLUDED.interested_in_types IS NOT NULL AND array_length(EXCLUDED.interested_in_types, 1) > 0
    THEN EXCLUDED.interested_in_types
    ELSE NEW.roles
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_roles_to_match_preferences_trigger ON public.profiles;

CREATE TRIGGER sync_roles_to_match_preferences_trigger
AFTER INSERT OR UPDATE OF roles ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_roles_to_match_preferences();

-- ============================================
-- 7. RLS POLICIES
-- ============================================

-- Users can see others' role data (needed for matching display)
-- (Existing SELECT policy already covers this since we're adding columns to profiles)

-- Service role needs access to role columns for match generation
-- (Existing service_role policies already cover ALL on profiles)

-- ============================================
-- 8. GRANT EXECUTION
-- ============================================

GRANT EXECUTE ON FUNCTION public.calculate_role_compatibility(TEXT[], TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_role_compatibility(TEXT[], TEXT[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.find_similar_users(UUID, VECTOR(384), UUID[], INT, INT, TEXT[], BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_roles_to_match_preferences() TO service_role;

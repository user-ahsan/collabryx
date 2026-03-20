-- =====================================================
-- Profile Completion Auto-Calculation Trigger
-- =====================================================
-- Purpose: Automatically update profile_completion when
--          profile data or related tables change
-- Created: 2026-03-21
-- Task: Fix profile matching for 100% complete profiles
-- =====================================================

-- =====================================================
-- FUNCTION: calculate_profile_completion
-- =====================================================
-- Calculates profile completion percentage based on:
-- - Basic info: full_name, headline, bio (25%)
-- - Skills: user_skills count (25%)
-- - Interests & Goals: user_interests + looking_for (25%)
-- - Experience: user_experiences count (25%)
-- =====================================================

CREATE OR REPLACE FUNCTION public.calculate_profile_completion(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  v_score integer := 0;
  v_profile RECORD;
  v_skills_count integer;
  v_interests_count integer;
  v_experiences_count integer;
BEGIN
  -- Get basic profile data
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Basic profile (25%)
  IF v_profile.full_name IS NOT NULL OR v_profile.display_name IS NOT NULL THEN
    v_score := v_score + 10;
  END IF;
  
  IF v_profile.headline IS NOT NULL THEN
    v_score := v_score + 10;
  END IF;
  
  IF v_profile.bio IS NOT NULL THEN
    v_score := v_score + 5;
  END IF;
  
  -- Skills (25%)
  SELECT COUNT(*) INTO v_skills_count
  FROM user_skills
  WHERE user_id = p_user_id;
  
  IF v_skills_count > 0 THEN
    v_score := v_score + 25;
  END IF;
  
  -- Interests & Goals (25%)
  SELECT COUNT(*) INTO v_interests_count
  FROM user_interests
  WHERE user_id = p_user_id;
  
  IF v_interests_count > 0 THEN
    v_score := v_score + 15;
  END IF;
  
  IF v_profile.looking_for IS NOT NULL AND array_length(v_profile.looking_for, 1) > 0 THEN
    v_score := v_score + 10;
  END IF;
  
  -- Experience (25%)
  SELECT COUNT(*) INTO v_experiences_count
  FROM user_experiences
  WHERE user_id = p_user_id;
  
  IF v_experiences_count > 0 THEN
    v_score := v_score + 25;
  END IF;
  
  RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: Update profile_completion on profile changes
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_profile_completion_from_profile()
RETURNS TRIGGER AS $$
BEGIN
  NEW.profile_completion := public.calculate_profile_completion(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_profile_completion_on_profile_update ON public.profiles;
CREATE TRIGGER update_profile_completion_on_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (
    OLD.full_name IS DISTINCT FROM NEW.full_name OR
    OLD.display_name IS DISTINCT FROM NEW.display_name OR
    OLD.headline IS DISTINCT FROM NEW.headline OR
    OLD.bio IS DISTINCT FROM NEW.bio OR
    OLD.looking_for IS DISTINCT FROM NEW.looking_for
  )
  EXECUTE FUNCTION public.update_profile_completion_from_profile();

-- =====================================================
-- TRIGGER: Update profile_completion when skills change
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_profile_completion_from_skills()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET profile_completion = public.calculate_profile_completion(
    COALESCE(NEW.user_id, OLD.user_id)
  )
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_profile_completion_on_skills_change ON public.user_skills;
CREATE TRIGGER update_profile_completion_on_skills_change
  AFTER INSERT OR DELETE OR UPDATE ON public.user_skills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_completion_from_skills();

-- =====================================================
-- TRIGGER: Update profile_completion when interests change
-- =====================================================

DROP TRIGGER IF EXISTS update_profile_completion_on_interests_change ON public.user_interests;
CREATE TRIGGER update_profile_completion_on_interests_change
  AFTER INSERT OR DELETE OR UPDATE ON public.user_interests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_completion_from_skills();

-- =====================================================
-- TRIGGER: Update profile_completion when experiences change
-- =====================================================

DROP TRIGGER IF EXISTS update_profile_completion_on_experiences_change ON public.user_experiences;
CREATE TRIGGER update_profile_completion_on_experiences_change
  AFTER INSERT OR DELETE OR UPDATE ON public.user_experiences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_completion_from_skills();

-- =====================================================
-- Helper: Recalculate all profile completions
-- =====================================================
-- Run this once to fix existing data

CREATE OR REPLACE FUNCTION public.recalculate_all_profile_completions()
RETURNS integer AS $$
DECLARE
  v_count integer := 0;
  v_profile RECORD;
  v_completion integer;
BEGIN
  FOR v_profile IN SELECT id FROM profiles LOOP
    v_completion := public.calculate_profile_completion(v_profile.id);
    UPDATE profiles
    SET profile_completion = v_completion
    WHERE id = v_profile.id AND profile_completion != v_completion;
    
    IF FOUND THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.calculate_profile_completion TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_profile_completion TO service_role;
GRANT EXECUTE ON FUNCTION public.recalculate_all_profile_completions TO service_role;

-- Comment
COMMENT ON FUNCTION public.calculate_profile_completion IS 'Calculate profile completion percentage (0-100) based on profile data, skills, interests, and experiences';
COMMENT ON FUNCTION public.recalculate_all_profile_completions IS 'Recalculate profile_completion for all profiles - use for data migration';

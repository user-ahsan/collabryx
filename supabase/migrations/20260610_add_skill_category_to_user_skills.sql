-- Migration: Add skill_category column to user_skills table
-- Created: 2026-06-10
-- 
-- This column stores the broad category of each skill (frontend, backend,
-- database, devops, design, business, finance, marketing, sales,
-- healthcare, education, trades, manufacturing, agriculture, energy,
-- transportation, legal, hospitality, arts, sports, science, etc.)
-- 
-- The complementary matching algorithm uses skill_category to determine
-- whether two users have complementary (different categories) or similar
-- (same category) skill sets.

-- Add the skill_category column (nullable for backward compatibility)
ALTER TABLE IF EXISTS public.user_skills
  ADD COLUMN IF NOT EXISTS skill_category TEXT;

-- Add an index for efficient category-based queries
CREATE INDEX IF NOT EXISTS idx_user_skills_category 
  ON public.user_skills(skill_category);

-- Add an index for cross-category matching queries
CREATE INDEX IF NOT EXISTS idx_user_skills_user_category 
  ON public.user_skills(user_id, skill_category);

-- Update the master schema table definition comment
COMMENT ON COLUMN public.user_skills.skill_category IS 
  'Broad category of the skill (e.g., frontend, backend, database, devops, design, business, finance, marketing, sales, healthcare, education, trades, manufacturing, agriculture, energy, transportation, legal, hospitality, arts, sports, science). Used by the complementary matching algorithm to find skill-gap partners.';

-- =============================================
-- Add complementary scoring columns to match_scores
-- =============================================

ALTER TABLE IF EXISTS public.match_scores
  ADD COLUMN IF NOT EXISTS skill_gap_score REAL DEFAULT 0;

ALTER TABLE IF EXISTS public.match_scores
  ADD COLUMN IF NOT EXISTS role_complementarity_score REAL DEFAULT 0;

COMMENT ON COLUMN public.match_scores.skill_gap_score IS 
  'Score 0-100: how many unique skills the candidate has that the user lacks. Higher = more complementary.';

COMMENT ON COLUMN public.match_scores.role_complementarity_score IS 
  'Score 0-100: how complementary the skill categories are across users. Cross-domain pairs (e.g. frontend+backend) score higher.';

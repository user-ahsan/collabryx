-- Migration: Add unique constraint on match_scores.suggestion_id
-- Applied directly on remote Supabase on 2026-06-03
-- Backfilled as local migration file for version consistency

ALTER TABLE public.match_scores
ADD CONSTRAINT match_scores_suggestion_id_unique
UNIQUE (suggestion_id);

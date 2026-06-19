-- Migration: Add algorithm learning tables for data-driven matching
-- Created: 2026-06-11
-- 
-- These tables store learned patterns from user behavior, replacing
-- hardcoded complementary pairs and static weights with data-driven values.

-- Table: complementary_pairs
-- Stores which skill category pairs actually lead to successful connections.
-- Data is refreshed periodically by the learner module.
CREATE TABLE IF NOT EXISTS public.complementary_pairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_a TEXT NOT NULL,
    category_b TEXT NOT NULL,
    score REAL NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    co_occurrence_count INTEGER NOT NULL DEFAULT 0,
    connection_count INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(category_a, category_b)
);

-- Table: algorithm_weights
-- Stores learned weights for each scoring dimension.
-- Weights are auto-tuned based on which dimensions predict connections.
CREATE TABLE IF NOT EXISTS public.algorithm_weights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dimension TEXT NOT NULL UNIQUE,
    weight REAL NOT NULL DEFAULT 0 CHECK (weight >= 0 AND weight <= 1),
    sample_size INTEGER NOT NULL DEFAULT 0,
    connection_rate REAL DEFAULT 0,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version TEXT NOT NULL DEFAULT 'v1',
    description TEXT
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_complementary_pairs_categories 
    ON public.complementary_pairs(category_a, category_b);
CREATE INDEX IF NOT EXISTS idx_complementary_pairs_score 
    ON public.complementary_pairs(score DESC);
CREATE INDEX IF NOT EXISTS idx_algorithm_weights_version 
    ON public.algorithm_weights(version);

-- Insert default weights (used as fallback when no learned data exists)
INSERT INTO public.algorithm_weights (dimension, weight, description) VALUES
    ('skill_gap', 0.35, 'Skills the other person has that you lack'),
    ('role_complementarity', 0.25, 'Cross-domain role synergy'),
    ('complementary', 0.20, 'Inverse Jaccard of skill sets'),
    ('semantic', 0.10, 'Vector embedding cosine similarity'),
    ('interests', 0.10, 'Shared interest overlap')
ON CONFLICT (dimension) DO NOTHING;

COMMENT ON TABLE public.complementary_pairs IS 
  'Learned complementary skill category pairs based on real user connection patterns. Refreshed periodically by the learner module.';
COMMENT ON TABLE public.algorithm_weights IS 
  'Auto-tuned scoring weights learned from user behavior data. Replaces static hardcoded weights.';
COMMENT ON COLUMN public.complementary_pairs.score IS 
  'Complementarity score 0-100. Higher = categories co-occur more often in successful connections.';

-- Table: embedding_validation_constraints
-- Adds validation constraints to profile_embeddings table
-- Ensures data quality for vector embeddings

-- Add validation check constraint for dimension
ALTER TABLE public.profile_embeddings
ADD CONSTRAINT check_embedding_dimension 
CHECK (vector_dims(embedding) = 384);

-- Create trigger function for validation
CREATE OR REPLACE FUNCTION public.validate_embedding_before_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Check dimension
  IF vector_dims(NEW.embedding) != 384 THEN
    RAISE EXCEPTION 'Invalid embedding dimension: expected 384, got %', vector_dims(NEW.embedding);
  END IF;
  
  -- Check for null values
  IF NEW.embedding IS NULL THEN
    RAISE EXCEPTION 'Embedding cannot be null';
  END IF;
  
  -- Check status is valid
  IF NEW.status NOT IN ('pending', 'processing', 'completed', 'failed') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for validation on INSERT and UPDATE
DROP TRIGGER IF EXISTS trigger_validate_embedding ON public.profile_embeddings;
CREATE TRIGGER trigger_validate_embedding
  BEFORE INSERT OR UPDATE ON public.profile_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_embedding_before_insert();

-- Add index on metadata for querying validation status
CREATE INDEX IF NOT EXISTS idx_profile_embeddings_metadata 
    ON public.profile_embeddings USING GIN (metadata);

-- Comment documenting the validation
COMMENT ON CONSTRAINT check_embedding_dimension ON public.profile_embeddings IS 
'Ensures all embeddings have exactly 384 dimensions (all-MiniLM-L6-v2 model)';

COMMENT ON FUNCTION public.validate_embedding_before_insert() IS 
'Validates embedding dimension, null checks, and status before insert/update';

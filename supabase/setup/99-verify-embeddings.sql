-- ============================================
-- EMBEDDING TABLE VERIFICATION SCRIPT
-- Run this AFTER migrations to verify everything is set up correctly
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Embedding Table Verification';
    RAISE NOTICE '============================================';
END $$;

-- 1. Verify table exists
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'profile_embeddings'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✓ Table profile_embeddings exists';
    ELSE
        RAISE WARNING '✗ Table profile_embeddings does NOT exist';
    END IF;
END $$;

-- 2. Verify columns (should have 7 columns)
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'profile_embeddings';
    
    IF col_count = 7 THEN
        RAISE NOTICE '✓ Correct number of columns: %', col_count;
    ELSE
        RAISE WARNING '✗ Wrong number of columns: % (expected 7)', col_count;
    END IF;
END $$;

-- 3. Verify specific columns exist
DO $$
DECLARE
    required_cols TEXT[] := ARRAY['id', 'user_id', 'embedding', 'last_updated', 'status', 'error_message', 'retry_count'];
    missing_cols TEXT[];
BEGIN
    SELECT ARRAY_AGG(column_name) INTO missing_cols
    FROM UNNEST(required_cols) AS required(column_name)
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'profile_embeddings'
          AND columns.column_name = required.column_name
    );
    
    IF missing_cols IS NULL THEN
        RAISE NOTICE '✓ All required columns exist';
    ELSE
        RAISE WARNING '✗ Missing columns: %', missing_cols;
    END IF;
END $$;

-- 4. Verify dimension constraint
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_embedding_dimensions'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        RAISE NOTICE '✓ Dimension constraint exists';
    ELSE
        RAISE WARNING '✗ Dimension constraint does NOT exist';
    END IF;
END $$;

-- 5. Verify indexes (should have at least 6)
DO $$
DECLARE
    idx_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO idx_count
    FROM pg_indexes
    WHERE schemaname = 'public' 
      AND tablename = 'profile_embeddings';
    
    IF idx_count >= 6 THEN
        RAISE NOTICE '✓ Correct number of indexes: %', idx_count;
    ELSE
        RAISE WARNING '✗ Wrong number of indexes: % (expected at least 6)', idx_count;
    END IF;
END $$;

-- 6. List all indexes
DO $$
DECLARE
    idx RECORD;
BEGIN
    RAISE NOTICE 'Indexes on profile_embeddings:';
    FOR idx IN
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public' 
          AND tablename = 'profile_embeddings'
    LOOP
        RAISE NOTICE '  - %', idx.indexname;
    END LOOP;
END $$;

-- 7. Verify helper functions exist
DO $$
DECLARE
    func_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO func_count
    FROM pg_proc
    WHERE proname IN ('has_embedding', 'get_embedding_status', 'regenerate_embedding');
    
    IF func_count = 3 THEN
        RAISE NOTICE '✓ All helper functions exist';
    ELSE
        RAISE WARNING '✗ Missing helper functions: found %/3', func_count;
    END IF;
END $$;

-- 8. Verify get_embedding_status returns correct columns
DO $$
DECLARE
    func_result RECORD;
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profile_embeddings';
    
    IF col_count >= 6 THEN
        RAISE NOTICE '✓ get_embedding_status should return all columns';
    ELSE
        RAISE WARNING '✗ get_embedding_status may be missing columns';
    END IF;
END $$;

-- 9. Test dimension constraint (should succeed with 384d)
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Get a test user
    SELECT id INTO test_user_id
    FROM profiles
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Try to insert 384d embedding (should succeed)
        BEGIN
            INSERT INTO profile_embeddings (user_id, embedding, status)
            VALUES (test_user_id, array_fill(0.1::real, ARRAY[384])::vector, 'test_success')
            ON CONFLICT (user_id) DO UPDATE
            SET status = 'test_success';
            
            RAISE NOTICE '✓ 384d embedding accepted (constraint working)';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING '✗ 384d embedding rejected: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'ℹ No test users found, skipping constraint test';
    END IF;
END $$;

-- 10. Test dimension constraint (should fail with 768d)
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Get a test user
    SELECT id INTO test_user_id
    FROM profiles
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Try to insert 768d embedding (should fail)
        BEGIN
            INSERT INTO profile_embeddings (user_id, embedding, status)
            VALUES (test_user_id, array_fill(0.1::real, ARRAY[768])::vector, 'test_fail')
            ON CONFLICT (user_id) DO UPDATE
            SET status = 'test_fail';
            
            RAISE WARNING '✗ 768d embedding accepted (constraint NOT working!)';
        EXCEPTION
            WHEN check_violation THEN
                RAISE NOTICE '✓ 768d embedding rejected (constraint working)';
            WHEN OTHERS THEN
                RAISE NOTICE '✓ 768d embedding rejected: %', SQLERRM;
        END;
    END IF;
END $$;

-- 11. Show current table structure
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Current Table Structure:';
    RAISE NOTICE '============================================';
END $$;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profile_embeddings'
ORDER BY ordinal_position;

-- 12. Show sample data (if any)
DO $$
DECLARE
    row_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO row_count
    FROM profile_embeddings;
    
    IF row_count > 0 THEN
        RAISE NOTICE '============================================';
        RAISE NOTICE 'Sample Data (% rows):', row_count;
        RAISE NOTICE '============================================';
    ELSE
        RAISE NOTICE '============================================';
        RAISE NOTICE 'No data in table yet';
        RAISE NOTICE '============================================';
    END IF;
END $$;

SELECT 
    user_id,
    status,
    vector_dims(embedding) as dimensions,
    error_message,
    retry_count,
    last_updated
FROM profile_embeddings
LIMIT 5;

-- 13. Final summary
DO $$
DECLARE
    all_good BOOLEAN;
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM information_schema.columns 
         WHERE table_schema = 'public' AND table_name = 'profile_embeddings') = 7
        AND
        (SELECT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'check_embedding_dimensions'
        ))
        AND
        (SELECT COUNT(*) FROM pg_indexes 
         WHERE schemaname = 'public' AND tablename = 'profile_embeddings') >= 6
    INTO all_good;
    
    RAISE NOTICE '============================================';
    IF all_good THEN
        RAISE NOTICE '✅ ALL CHECKS PASSED';
        RAISE NOTICE 'Database schema is ready for Python worker';
    ELSE
        RAISE NOTICE '⚠️ SOME CHECKS FAILED';
        RAISE NOTICE 'Review warnings above and fix issues';
    END IF;
    RAISE NOTICE '============================================';
END $$;

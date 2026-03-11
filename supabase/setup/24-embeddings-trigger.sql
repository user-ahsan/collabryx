-- Database trigger for automatic embedding generation on onboarding completion

-- Create a function to trigger embedding generation via HTTP request to Edge Function
CREATE OR REPLACE FUNCTION public.trigger_embedding_generation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger when onboarding_completed changes to true
    IF NEW.onboarding_completed = TRUE AND OLD.onboarding_completed = FALSE THEN
        -- Insert a pending embedding record
        INSERT INTO public.profile_embeddings (user_id, status)
        VALUES (NEW.id, 'pending')
        ON CONFLICT (user_id) DO UPDATE
        SET status = 'pending', last_updated = NOW();
        
        -- Log the trigger event
        INSERT INTO public.match_activity (
            actor_user_id,
            target_user_id,
            type,
            activity,
            created_at
        )
        VALUES (
            NEW.id,
            NEW.id,
            'profile_view',
            'Embedding generation triggered',
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS trigger_generate_embedding ON public.profiles;
CREATE TRIGGER trigger_generate_embedding
    AFTER UPDATE OF onboarding_completed ON public.profiles
    FOR EACH ROW
    WHEN (NEW.onboarding_completed = TRUE AND OLD.onboarding_completed = FALSE)
    EXECUTE FUNCTION public.trigger_embedding_generation();

-- Function to manually trigger embedding generation (for retries)
CREATE OR REPLACE FUNCTION public.regenerate_embedding(user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profile_embeddings
    SET status = 'pending', last_updated = NOW()
    WHERE user_id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.regenerate_embedding TO authenticated;

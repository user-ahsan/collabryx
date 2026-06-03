-- Migration: Fix missing RLS policies for post_impressions, feed_thompson_params, content_moderation_logs
-- Issue: Section 6 DROP ALL loop dropped inline policies for Section 2.5 tables but never recreated them
-- Also fixes content_moderation_logs missing admin view policy

-- Fix 1: post_impressions (was completely locked — RLS enabled with 0 policies)
CREATE POLICY "Users can view own impressions" ON public.post_impressions 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage impressions" ON public.post_impressions 
  FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- Fix 2: feed_thompson_params (was completely locked — RLS enabled with 0 policies)
CREATE POLICY "Service role can manage thompson params" ON public.feed_thompson_params 
  FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- Fix 3: content_moderation_logs (had 1 of 2 policies — missing admin view)
CREATE POLICY "Admin users can view moderation logs" ON public.content_moderation_logs 
  FOR SELECT USING ((auth.jwt() ->> 'role') IN ('service_role', 'admin'));

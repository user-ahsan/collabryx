import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export async function validateAuth(req: Request, supabase: ReturnType<typeof createClient>) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) throw new Error('Missing authorization')
  
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) throw new Error('Unauthorized')
  return user
}
